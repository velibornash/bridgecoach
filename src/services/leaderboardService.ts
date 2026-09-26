/**
 * Leaderboard client (Sprint 59).
 *
 * Replaces the Sprint 58 fixture list of ten invented players. A leaderboard
 * built from fiction is worse than an empty one: it shows a rank that means
 * nothing and implies competitors who do not exist.
 */
import { apiFetchSafe } from "./api";

export interface LeaderboardEntry {
  userId: string;
  firstName: string;
  lastName: string;
  avatar: string;
  country: string;
  level: number;
  xp: number;
  streak: number;
  rank: number;
  periodXp: number | null;
  isCurrentUser: boolean;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  scope: "global" | "country";
  period: "all" | "weekly" | "monthly";
  /** The signed-in user's own rank, present even when outside the top N. */
  currentUserRank: number | null;
  totalPlayers: number;
}

export type LeaderboardScope = "global" | "country";
export type LeaderboardPeriod = "all" | "weekly" | "monthly";

export async function fetchLeaderboard(
  scope: LeaderboardScope = "global",
  period: LeaderboardPeriod = "all",
): Promise<{
  data: LeaderboardData | null;
  error: string | null;
  status: number;
}> {
  const params = new URLSearchParams({ scope, period });
  const result = await apiFetchSafe<LeaderboardData>(`/api/leaderboard?${params}`);
  return {
    data: result.data,
    error: result.data ? null : result.error,
    status: result.status,
  };
}
