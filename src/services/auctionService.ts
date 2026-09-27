/**
 * Auctions (Sprint 60 follow-up).
 *
 * The `/play` page dealt a hand, took bids and played cards entirely in
 * `useState` and wrote nothing, so `Hand` and `Auction` rows were never created
 * by actually playing. `/api/auctions` GET existed and had nothing to return,
 * which is why `/replay` fell back to a hardcoded scenario.
 *
 * Both now use these helpers: play records, replay reads.
 */
import { apiFetchSafe } from "./api";

/**
 * One recorded call, in the shape `POST /api/auctions` accepts.
 *
 * `bid` is the call as it was spoken — `"3NT"`, `"P"`, `"X"`, `"XX"` — not a
 * structured object. It used to be `{ type, level, strain }`, which the route
 * rejected with `"actions[0].bid" is required` because it calls `requireString`
 * on it. Nothing from /play was ever persisted as a result: the type said the
 * object was fine, the server disagreed, and the failure was a 400 nobody saw
 * because the page had no hand to attach the auction to either.
 *
 * The route parses the string with the engine's own `parseBid`, so the strain is
 * derived once, in one place, rather than being reconstructed by the client and
 * then re-parsed.
 */
export interface RecordedAction {
  player: "N" | "E" | "S" | "W";
  bid: string;
}

/**
 * Mirrors what `GET /api/auctions` actually returns, including the
 * `engine` block. That block is reconstructed through the bidding engine, so it
 * can be null when the recorded rows could not be replayed — which is a real
 * state and is treated as one here rather than coerced into a contract.
 */
export interface AuctionRecord {
  id: string;
  handId: string | null;
  dealer: string;
  vulnerability: string;
  isComplete: boolean;
  passedOut: boolean;
  engine: {
    isComplete: boolean;
    currentContract: {
      level: number;
      strain: string;
      doubled: boolean;
      redoubled: boolean;
    } | null;
    finalContract: {
      level: number | null;
      strain: string | null;
      declarer: string;
      passedOut: boolean;
    } | null;
  } | null;
  actions: {
    sequence: number;
    player: string;
    type: string;
    level: number | null;
    strain: string | null;
    engineLegal: boolean;
    engineReason: string | null;
  }[];
  startedAt: string;
  completedAt: string | null;
}

export interface HandRecord {
  id: string;
  dealer: string;
  createdAt: string;
}

/**
 * Creates a hand. The replayer needs the cards, so the deal is stored.
 *
 * This posts to `/api/hands`, not `/api/auctions`. It used to post
 * `kind: "hand"` to the auctions route, which only ever creates an `Auction`, so
 * nothing was stored, `data` came back null, and `handId` stayed null — which
 * made every later save unreachable. `HandRecord` is returned flat because that
 * is what the route returns.
 */
export async function createHand(input: {
  dealer: string;
  north: unknown;
  east: unknown;
  south: unknown;
  west: unknown;
  label?: string;
}): Promise<{ data: HandRecord | null; error: string | null }> {
  const result = await apiFetchSafe<HandRecord>("/api/hands", {
    method: "POST",
    body: input,
  });
  return { data: result.data ?? null, error: result.data ? null : result.error };
}

/**
 * What `POST /api/auctions` returns when it creates an auction: the created row
 * plus its actions, flat, not wrapped in an `auction` key.
 *
 * It is a deliberately smaller shape than the `GET` record — no timestamps, no
 * engine block, `declarer` instead of a full `FinalContract` — so it is typed on
 * its own terms rather than being passed off as an `AuctionRecord`. Reading
 * `.auction` off this response, which is what the client used to do, yielded
 * `undefined` while the request had in fact succeeded.
 */
export interface CreatedAuction {
  id: string;
  dealer: string;
  vulnerability: string;
  isComplete: boolean;
  declarer: string | null;
  actions: Array<{
    sequence: number;
    player: string;
    type: string;
    level: number | null;
    strain: string | null;
    engineLegal: boolean;
  }>;
}

/** Appends the auction, once it has finished. */
export async function createAuction(input: {
  handId: string | null;
  dealer: string;
  actions: RecordedAction[];
  isComplete?: boolean;
}): Promise<{ data: CreatedAuction | null; error: string | null }> {
  const result = await apiFetchSafe<CreatedAuction>("/api/auctions", {
    method: "POST",
    body: input,
  });
  return { data: result.data ?? null, error: result.data ? null : result.error };
}

export async function fetchAuctions(): Promise<{
  data: AuctionRecord[] | null;
  error: string | null;
  status: number;
}> {
  const result = await apiFetchSafe<{ auctions: AuctionRecord[] }>("/api/auctions");
  return { data: result.data?.auctions ?? null, error: result.data ? null : result.error, status: result.status };
}
