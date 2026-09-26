/**
 * Bridge Coach — Progression Engine (Sprint 58 §10).
 *
 * SINGLE AUTHORITY for XP and level. Components and routes never mutate
 * `user.xp` directly; they record an XPEvent and this module recomputes the
 * user's progression from the event log.
 *
 *   User action → XPEvent row → Progression Engine → persisted read model
 *
 * The event log is the source of truth. `user.xp` / `user.level` are derived
 * caches, which means progression can always be rebuilt and every XP value can
 * be traced back to the event that granted it.
 */

import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { getLevelInfo } from "@/services/xpService";

/** XPEvent types that represent a real, repeatable user achievement. */
const COUNTABLE_EVENT_TYPES = [
  "LESSON_COMPLETED",
  "QUIZ_COMPLETED",
  "PRACTICE_COMPLETED",
  "ACHIEVEMENT_UNLOCKED",
  "MISSION_COMPLETED",
  "DAILY_CHALLENGE_COMPLETED",
  "COURSE_COMPLETED",
] as const;

export interface ProgressionSnapshot {
  xp: number;
  level: number;
  lifetimeXp: number;
  xpToNextLevel: number;
  levelTitle: string;
  streak: number;
  longestStreak: number;
}

/**
 * Records an XP event and recomputes progression.
 *
 * Idempotent: the unique constraint on (userId, type, reference) means awarding
 * the same logical achievement twice inserts nothing, so a replayed request
 * cannot inflate the user's XP.
 *
 * @returns how much XP this call actually granted (0 if it was a duplicate) and
 *          the recomputed progression.
 */
export async function awardXp(
  userId: string,
  type: (typeof COUNTABLE_EVENT_TYPES)[number],
  reference: string,
  amount: number,
  metadata?: Record<string, unknown>,
): Promise<{ awarded: number; progression: ProgressionSnapshot }> {
  const now = new Date();

  let awarded = 0;
  try {
    await prisma.xPEvent.create({
      data: {
        userId,
        type,
        reference,
        amount,
        status: "applied",
        appliedAt: now,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
    awarded = amount;
  } catch (error) {
    // The unique constraint rejected a duplicate award. That is the desired
    // behaviour, not an error worth surfacing to the caller.
    const isDuplicate =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    if (!isDuplicate) throw error;
  }

  const progression = await recomputeProgression(userId);
  return { awarded, progression };
}

/**
 * Rebuilds a user's progression from their event log and persists the derived
 * values. Safe to call as often as needed — it is idempotent by construction.
 */
export async function recomputeProgression(
  userId: string,
): Promise<ProgressionSnapshot> {
  const events = await prisma.xPEvent.findMany({
    where: { userId, status: "applied" },
    orderBy: { createdAt: "asc" },
    select: { amount: true, createdAt: true },
  });

  const lifetimeXp = events.reduce((sum, e) => sum + e.amount, 0);
  const levelInfo = getLevelInfo(lifetimeXp);

  // Streak = consecutive calendar days with at least one applied event, counting
  // back from today. Derived from real timestamps, never a stored counter that
  // can drift.
  const { streak, longestStreak } = computeStreaks(
    events.map((e) => e.createdAt.getTime()),
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: lifetimeXp,
      level: levelInfo.level,
      streak,
      longestStreak: Math.max(longestStreak, streak),
      lastActiveAt: events.length > 0 ? events[events.length - 1].createdAt : null,
    },
  });

  return {
    xp: lifetimeXp,
    level: levelInfo.level,
    lifetimeXp,
    xpToNextLevel: levelInfo.maxXp,
    levelTitle: levelInfo.title,
    streak,
    longestStreak: Math.max(longestStreak, streak),
  };
}

/**
 * Longest run of consecutive days containing an event, plus the run that ends on
 * the most recent active day. UTC days are used so the result does not depend on
 * the server's timezone.
 */
function computeStreaks(timestamps: number[]): { streak: number; longestStreak: number } {
  if (timestamps.length === 0) return { streak: 0, longestStreak: 0 };

  const days = [...new Set(timestamps.map((t) => toUtcDay(t)))].sort();
  const dayMs = 86_400_000;

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const gap = Date.parse(`${days[i]}T00:00:00Z`) - Date.parse(`${days[i - 1]}T00:00:00Z`);
    run = gap === dayMs ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  // The current streak only counts if the last active day is today or yesterday;
  // a gap of two or more days means the streak has already been broken.
  const today = toUtcDay(Date.now());
  const yesterday = new Date(Date.now() - dayMs).toISOString().slice(0, 10);
  const last = days[days.length - 1];
  let streak = 0;
  if (last === today || last === yesterday) {
    streak = 1;
    for (let i = days.length - 1; i > 0; i--) {
      const gap =
        Date.parse(`${days[i]}T00:00:00Z`) - Date.parse(`${days[i - 1]}T00:00:00Z`);
      if (gap !== dayMs) break;
      streak += 1;
    }
  }

  return { streak, longestStreak: longest };
}

function toUtcDay(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}
