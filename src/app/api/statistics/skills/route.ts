/**
 * Player Model — skill profile derived from played actions (Sprint 60 follow-up).
 *
 *   GET /api/statistics/skills → per-skill accuracy, with sample sizes
 *
 * Replaces `defaultSkillProfile`, five hardcoded percentages — Opening Bids 84,
 * Takeout Doubles 52, Defense 73, Slams 29, Signals 61 — on a user who had
 * recorded nothing. Sprint 58 classified those as a known gap and left them
 * static rather than faking them from unrelated numbers, which was the right call
 * at the time. The practice and auction rows they needed now exist, so they can
 * be computed.
 *
 * ## The part that matters: sample size
 *
 * A percentage of two attempts is noise. "Defense 50%" from one call and one
 * pass tells the user nothing and looks authoritative, which is the exact
 * failure the fixture was. So every metric carries its `attempts` count and the
 * API returns `value: null` below `MIN_ATTEMPTS` — the page then shows the count
 * and a "not enough data" state instead of a number.
 *
 * ## What is and is not measured
 *
 * Accuracy is `engineLegal` for auction calls: the engine's own verdict, snapshotted
 * at the time of the call. Nothing here re-judges an auction — that would be a
 * second rules engine, which is the thing Sprint 57 exists to prevent.
 *
 * "Signals" is deliberately absent. Card-play communication is not recorded in a
 * way this can measure, and inventing a proxy for it would be the same mistake
 * with more steps.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma } from "@/lib/apiRoute";
import { Prisma } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Below this many attempts a percentage is not reported.
 *
 * Five is low on purpose: a user with one drill should see "not enough data",
 * not a confident-looking number derived from a single call.
 */
export const MIN_ATTEMPTS = 5;

export interface SkillMetric {
  id: string;
  label: string;
  /** null when there is not enough evidence to report a percentage. */
  value: number | null;
  attempts: number;
  correct: number;
  /** Plain-language reason there is no number, when value is null. */
  note?: string;
}

/** Opening calls: a `bid` by the player on lead, before anyone has bid. */
const OPENING: Prisma.AuctionActionWhereInput = {
  type: "bid",
  sequence: 1,
};

/** Doubles and redoubles. */
const DOUBLES: Prisma.AuctionActionWhereInput = { type: { in: ["double", "redouble"] } };

/** Calls at contract level, the point where slams are bid. */
const SLAMS: Prisma.AuctionActionWhereInput = { type: "bid", level: { gte: 6 } };

/** Calls made after the opening, which is where defensive judgement shows. */
const DEFENCE: Prisma.AuctionActionWhereInput = { type: "bid", sequence: { gt: 1 } };

async function measure(
  userId: string,
  id: string,
  label: string,
  where: Prisma.AuctionActionWhereInput,
): Promise<SkillMetric> {
  const [attempts, correct] = await Promise.all([
    prisma.auctionAction.count({ where: { auction: { userId }, ...where } }),
    prisma.auctionAction.count({ where: { engineLegal: true, auction: { userId }, ...where } }),
  ]);

  return {
    id,
    label,
    value: attempts >= MIN_ATTEMPTS ? Math.round((correct / attempts) * 100) : null,
    attempts,
    correct,
    note:
      attempts < MIN_ATTEMPTS
        ? `Played ${attempts} ${attempts === 1 ? "call" : "calls"} — ${MIN_ATTEMPTS} needed for a percentage`
        : undefined,
  };
}

export const GET = handleRoute(() =>
  withUser(async (userId) => {
    const [opening, doubles, slams, defence, practiceTotal] = await Promise.all([
      measure(userId, "opening", "Opening Bids", OPENING),
      measure(userId, "doubles", "Takeout Doubles", DOUBLES),
      measure(userId, "slams", "Slams", SLAMS),
      measure(userId, "defence", "Defence", DEFENCE),

      // Free-play practice records what was attempted but never grades it, so it
      // is reported as volume rather than folded into an accuracy figure. Mixing
      // ungraded attempts into a percentage would silently lower it.
      prisma.practiceAction.count({ where: { session: { userId } } }),
    ]);

    const metrics = [opening, doubles, slams, defence];
    const reportable = metrics.filter((m) => m.value !== null);

    return NextResponse.json({
      skills: metrics,
      /** Null rather than 0 when nothing is reportable, so the page can say so. */
      overall: reportable.length
        ? Math.round(reportable.reduce((sum, m) => sum + (m.value ?? 0), 0) / reportable.length)
        : null,
      /** Averages only the skills that had enough data, not the ones that did not. */
      skillsReported: reportable.length,
      skillsTotal: metrics.length,
      practiceActions: practiceTotal,
      minAttempts: MIN_ATTEMPTS,
    });
  }),
);
