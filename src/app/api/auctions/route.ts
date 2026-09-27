/**
 * Auction persistence (Sprint 58 §8, §9, §20).
 *
 * GET  /api/auctions          → list the user's auctions with engine state
 * POST /api/auctions          → create an auction and append structured actions
 *
 * ARCHITECTURAL RULE (§9): this route stores FACTS. It never decides legality.
 * Every persisted action is replayed through AuctionStateMachine on read, and the
 * engine's answer is what the client receives. The stored `engineLegal` column is
 * a snapshot for auditing, not the source of truth.
 */
import { NextResponse } from "next/server";
import {
  AuctionStateMachine,
  LegalBidValidator,
  parseBid,
  SEAT_ORDER,
  type BidCall,
  type Position,
  type Vulnerability,
} from "@/bridge";
import {
  handleRoute,
  withUser,
  prisma,
  readJson,
  requireString,
  badRequest,
  notFound,
} from "@/lib/apiRoute";

const validator = new LegalBidValidator();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The seat list, from the engine, so it cannot disagree with turn order.
const POSITIONS = SEAT_ORDER;
const VULNERABILITIES: Vulnerability[] = ["None", "NS", "EW", "All"];
const STRAINS = ["C", "D", "H", "S", "NT"] as const;

function parsePosition(value: unknown, field: string): Position {
  if (typeof value === "string" && POSITIONS.includes(value as Position)) {
    return value as Position;
  }
  throw badRequest(`"${field}" must be one of N, E, S, W`, "VALIDATION_ERROR");
}

function parseVulnerability(value: unknown): Vulnerability {
  if (typeof value === "string" && (VULNERABILITIES as string[]).includes(value)) {
    return value as Vulnerability;
  }
  return "None";
}

interface ActionBody {
  player?: unknown;
  bid?: unknown;
}

interface AuctionBody {
  handId?: unknown;
  dealer?: unknown;
  vulnerability?: unknown;
  actions?: unknown;
}

/** Convert one persisted action row back into an engine BidCall. */
function rowToCall(action: {
  type: string;
  level: number | null;
  strain: string | null;
}): BidCall | null {
  if (action.type === "bid") {
    return parseBid(`${action.level}${action.strain}`);
  }
  if (action.type === "pass" || action.type === "double" || action.type === "redouble") {
    return { type: action.type } as BidCall;
  }
  return null;
}

/**
 * Rebuild engine state from persisted facts. Returns null when the stored rows
 * cannot be replayed (e.g. a partially written auction), so a corrupt row can
 * never crash the API.
 */
function reconstruct(dealer: Position, vulnerability: Vulnerability, rows: Parameters<typeof rowToCall>[0][]) {
  try {
    const machine = new AuctionStateMachine({ dealer, vulnerability });
    for (const row of rows) {
      const call = rowToCall(row);
      if (!call) return null;
      machine.submit(call);
    }
    return machine.getState();
  } catch {
    return null;
  }
}

export const GET = handleRoute(async () =>
  withUser(async (userId) => {
    const auctions = await prisma.auction.findMany({
      where: { userId },
      include: { actions: { orderBy: { sequence: "asc" } } },
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      auctions: auctions.map((auction) => {
        const state = reconstruct(
          auction.dealer as Position,
          auction.vulnerability as Vulnerability,
          auction.actions,
        );
        return {
          id: auction.id,
          handId: auction.handId,
          dealer: auction.dealer,
          vulnerability: auction.vulnerability,
          isComplete: auction.isComplete,
          passedOut: auction.passedOut,
          // Engine-derived state. null means the rows could not be replayed.
          engine: state
            ? {
                isComplete: state.isComplete,
                currentContract: state.currentContract
                  ? {
                      level: state.currentContract.level,
                      strain: state.currentContract.strain,
                      doubled: state.currentContract.doubled,
                      redoubled: state.currentContract.redoubled,
                    }
                  : null,
                finalContract: state.finalContract
                  ? {
                      level: state.finalContract.contract?.level ?? null,
                      strain: state.finalContract.contract?.strain ?? null,
                      declarer: state.finalContract.declarer,
                      passedOut: state.finalContract.passedOut,
                    }
                  : null,
              }
            : null,
          actions: auction.actions.map((a) => ({
            sequence: a.sequence,
            player: a.player,
            type: a.type,
            level: a.level,
            strain: a.strain,
            engineLegal: a.engineLegal,
            engineReason: a.engineReason,
            suggestedBid: a.suggestedBid,
            strategyRuleName: a.strategyRuleName,
            createdAt: a.createdAt.toISOString(),
          })),
          startedAt: auction.startedAt.toISOString(),
          completedAt: auction.completedAt?.toISOString() ?? null,
        };
      }),
    });
  }),
);

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<AuctionBody>(request);
    const dealer = parsePosition(body.dealer ?? "N", "dealer");
    const vulnerability = parseVulnerability(body.vulnerability);

    if (body.handId != null && typeof body.handId !== "string") {
      throw badRequest('"handId" must be a string', "VALIDATION_ERROR");
    }
    if (body.handId) {
      const hand = await prisma.hand.findFirst({
        where: { id: body.handId, OR: [{ userId }, { userId: null }] },
        select: { id: true },
      });
      if (!hand) throw notFound(`Hand "${body.handId}" does not exist`);
    }

    if (body.actions !== undefined && !Array.isArray(body.actions)) {
      throw badRequest('"actions" must be an array', "VALIDATION_ERROR");
    }
    const rawActions = (body.actions ?? []) as ActionBody[];
    if (rawActions.length > 64) {
      throw badRequest("An auction cannot exceed 64 calls", "VALIDATION_ERROR");
    }

    // Normalise and validate every call BEFORE writing, so a rejected auction
    // never leaves half-persisted actions behind.
    const normalized = rawActions.map((raw, index) => {
      const bid = requireString(raw.bid, `actions[${index}].bid`);
      const call = parseBid(bid);
      if (!call) {
        throw badRequest(`actions[${index}].bid "${bid}" is not a bridge call`, "VALIDATION_ERROR");
      }
      if (call.type === "bid" && !STRAINS.includes(call.strain as never)) {
        throw badRequest(`actions[${index}].bid has an invalid strain`, "VALIDATION_ERROR");
      }
      return { call, bid: bid.toUpperCase() };
    });

    // Replay once to capture the engine's verdict for each action and the final
    // contract. The engine is the authority; we only record what it decided.
    const machine = new AuctionStateMachine({ dealer, vulnerability });
    const verdicts: Array<{ legal: boolean; reason: string | null; player: Position }> = [];
    for (const { call } of normalized) {
      const seat = machine.currentBidder;
      const check = validator.isLegal(machine.getState(), seat, call);
      verdicts.push({ legal: check.legal, reason: check.reason ?? null, player: seat });
      if (!check.legal) {
        throw badRequest(
          `Illegal call at sequence ${verdicts.length - 1} for ${seat}: ${check.reason}`,
          "ILLEGAL_CALL",
        );
      }
      machine.submit(call);
    }

    const finalState = machine.getState();
    const now = new Date();
    const isComplete = finalState.isComplete;
    const contract = finalState.finalContract?.contract ?? null;

    const auction = await prisma.auction.create({
      data: {
        userId,
        handId: (body.handId as string | undefined) ?? null,
        dealer,
        vulnerability,
        finalLevel: contract?.level ?? null,
        finalStrain: contract?.strain ?? null,
        finalDoubled: contract?.doubled ?? null,
        finalRedoubled: contract?.redoubled ?? null,
        declarer: finalState.finalContract?.declarer ?? null,
        passedOut: finalState.finalContract?.passedOut ?? false,
        isComplete,
        completedAt: isComplete ? now : null,
        actions: {
          create: normalized.map(({ call }, index) => ({
            sequence: index,
            player: verdicts[index].player,
            type: call.type,
            level: call.type === "bid" ? call.level : null,
            strain: call.type === "bid" ? call.strain : null,
            engineLegal: verdicts[index].legal,
            engineReason: verdicts[index].reason,
          })),
        },
      },
      include: { actions: { orderBy: { sequence: "asc" } } },
    });

    return NextResponse.json(
      {
        id: auction.id,
        dealer: auction.dealer,
        vulnerability: auction.vulnerability,
        isComplete: auction.isComplete,
        declarer: auction.declarer,
        actions: auction.actions.map((a) => ({
          sequence: a.sequence,
          player: a.player,
          type: a.type,
          level: a.level,
          strain: a.strain,
          engineLegal: a.engineLegal,
        })),
      },
      { status: 201 },
    );
  }),
);
