/**
 * Leaderboard (Sprint 59).
 *
 * GET /api/leaderboard?scope=global|country&period=all|weekly|monthly
 *
 * Rankings are DERIVED from persisted XP, never stored. XP itself is a read-model
 * cache written only by the progression engine, so this reads the same source of
 * truth the dashboard does and cannot drift from it.
 *
 * Two things this deliberately does not do:
 *
 * 1. It does not accept a user id from the client to decide who "is me". The
 *    current user comes from the session, so a caller cannot mark themselves as
 *    someone else by editing a query parameter.
 * 2. It does not fabricate a ranking for users who do not exist. The Sprint 58
 *    fixture had ten invented players with fabricated XP; those rows are gone, so
 *    a fresh database shows one real player and says so rather than padding the
 *    list with fiction.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  /** XP earned inside the selected period, when one is selected. */
  periodXp: number | null;
  isCurrentUser: boolean;
}

type Scope = "global" | "country";
type Period = "all" | "weekly" | "monthly";

const PERIOD_START: Record<Exclude<Period, "all">, (now: Date) => Date> = {
  weekly: (now) => {
    const start = new Date(now);
    // Monday, not "7 days ago": a weekly board that shifts every request is
    // not a weekly board.
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  },
  monthly: (now) => {
    const start = new Date(now);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return start;
  },
};

const LIMIT = 50;

export const GET = handleRoute((request: Request) =>
  withUser(async (userId) => {
    const url = new URL(request.url);
    const scope: Scope = url.searchParams.get("scope") === "country" ? "country" : "global";
    const rawPeriod = url.searchParams.get("period");
    const period: Period =
      rawPeriod === "weekly" || rawPeriod === "monthly" ? rawPeriod : "all";

    const where: Record<string, unknown> = {};
    if (scope === "country") {
      const me = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { country: true },
      });
      where.country = me.country;
    }

    const candidates = await prisma.user.findMany({
      where,
      orderBy: [{ xp: "desc" }, { joinedAt: "asc" }],
      take: LIMIT,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        country: true,
        level: true,
        xp: true,
        streak: true,
      },
    });

    // Period XP is summed from the XPEvent log, not from the cached total, so a
    // period board is actually about that period.
    let periodXpByUser: Map<string, number> | null = null;
    if (period !== "all") {
      const since = PERIOD_START[period](new Date());
      // Only applied events count. Pending and rejected rows exist in the log,
      // and summing them would award XP for work the engine refused.
      const grouped = await prisma.xPEvent.groupBy({
        by: ["userId"],
        where: {
          userId: { in: candidates.map((c) => c.id) },
          createdAt: { gte: since },
          status: "applied",
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
      });
      periodXpByUser = new Map(
        grouped.map((g) => [g.userId, g._sum.amount ?? 0]),
      );
    }

    // Rank within the period when one is selected; a player with no XP in the
    // period is not ranked at all rather than ranked last on a total they did
    // not earn inside it.
    const ranked = periodXpByUser
      ? candidates
          .map((c) => ({ ...c, periodXp: periodXpByUser!.get(c.id) ?? 0 }))
          .filter((c) => c.periodXp > 0)
          .sort((a, b) => b.periodXp - a.periodXp)
      : candidates.map((c) => ({ ...c, periodXp: null }));

    const entries: LeaderboardEntry[] = ranked.map((c, index) => ({
      userId: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      avatar: c.avatar,
      country: c.country,
      level: c.level,
      xp: c.xp,
      streak: c.streak,
      rank: index + 1,
      periodXp: c.periodXp,
      isCurrentUser: c.id === userId,
    }));

    // The current user's own rank, which is not visible when they fall outside
    // the top N — a leaderboard that hides where you stand is the part people
    // actually care about.
    let currentUserRank: number | null = null;
    if (!entries.some((e) => e.isCurrentUser)) {
      const all = await prisma.user.findMany({
        where,
        orderBy: [{ xp: "desc" }, { joinedAt: "asc" }],
        select: { id: true },
      });
      const index = all.findIndex((u) => u.id === userId);
      currentUserRank = index === -1 ? null : index + 1;
    }

    return NextResponse.json({
      entries,
      scope,
      period,
      currentUserRank,
      totalPlayers: await prisma.user.count({ where }),
    });
  }),
);
