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

export interface RecordedAction {
  player: "N" | "E" | "S" | "W";
  bid?: { type: "bid" | "pass" | "double" | "redouble"; level?: number; strain?: string } | null;
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

/** Creates a hand. The replayer needs the cards, so the deal is stored. */
export async function createHand(input: {
  dealer: string;
  north: unknown;
  east: unknown;
  south: unknown;
  west: unknown;
}): Promise<{ data: HandRecord | null; error: string | null }> {
  const result = await apiFetchSafe<{ hand: HandRecord }>("/api/auctions", {
    method: "POST",
    body: { ...input, kind: "hand" },
  });
  return { data: result.data?.hand ?? null, error: result.data ? null : result.error };
}

/** Appends the auction, once it has finished. */
export async function createAuction(input: {
  handId: string;
  dealer: string;
  actions: RecordedAction[];
  isComplete?: boolean;
}): Promise<{ data: AuctionRecord | null; error: string | null }> {
  const result = await apiFetchSafe<{ auction: AuctionRecord }>("/api/auctions", {
    method: "POST",
    body: input,
  });
  return { data: result.data?.auction ?? null, error: result.data ? null : result.error };
}

export async function fetchAuctions(): Promise<{
  data: AuctionRecord[] | null;
  error: string | null;
  status: number;
}> {
  const result = await apiFetchSafe<{ auctions: AuctionRecord[] }>("/api/auctions");
  return { data: result.data?.auctions ?? null, error: result.data ? null : result.error, status: result.status };
}
