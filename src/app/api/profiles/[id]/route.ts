/**
 * Public profile (Sprint 59).
 *
 * GET /api/profiles/[id]
 *
 * Everything here is derived from persisted rows. The Sprint 58 version served
 * `mockPublicProfiles`, a hardcoded object keyed by invented ids, so every
 * profile page either showed fiction or 404'd for a real user.
 *
 * Privacy: this exposes a deliberately narrow slice of a user. Email, session
 * rows, auth events, notes, and anything else private are not selected. A
 * profile shows progression and unlocked achievements — the same facts the
 * leaderboard already shows — and nothing more.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma, notFound } from "@/lib/apiRoute";
import { getLevelInfo } from "@/services/xpService";
import { readPreferences } from "@/lib/preferences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleRoute(
  async (_request: Request, ctx: RouteContext<"/api/profiles/[id]">) =>
    withUser(async (viewerId) => {
      const { id } = await ctx.params;

      // The viewer must exist, but the profile is looked up independently: an
      // unauthenticated-looking id should 404, not 500.
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          country: true,
          experienceLevel: true,
          joinedAt: true,
          xp: true,
          level: true,
          streak: true,
          longestStreak: true,
          lastActiveAt: true,
        },
      });
      if (!user) throw notFound("Profile not found");

      const [profile, achievements, lessonCount, courseCount] = await Promise.all([
        prisma.profile.findUnique({ where: { userId: id } }),
        prisma.userAchievement.findMany({
          // `unlocked: true` rather than "any row": a progress row exists for
          // achievements the user has not earned yet, and showing those as
          // unlocked would be a lie.
          where: { userId: id, unlocked: true },
          orderBy: { unlockedAt: "desc" },
          include: { achievement: true },
        }),
        prisma.lessonProgress.count({ where: { userId: id, completed: true } }),
        prisma.courseProgress.count({ where: { userId: id, completed: true } }),
      ]);

      /**
       * The privacy choices from /settings, enforced here rather than described
       * on the settings page. A toggle that does not gate anything is a lie, and
       * this is the place it can be made true.
       */
      const privacy = readPreferences(profile?.preferences).privacy;

      // A user who turned their profile off is not merely hidden from the
      // leaderboard; the profile itself is not served. Viewers still get a
      // clean 404 rather than an error that reveals it exists.
      if (!privacy.showProfile && id !== viewerId) {
        throw notFound("Profile not found");
      }

      // Recent real activity, newest first. Previously a fixture list with
      // invented entries and dates.
      const activity = privacy.showActivity
        ? await prisma.activity.findMany({
            where: { userId: id },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
        : [];

      return NextResponse.json({
        user: {
          ...user,
          // From the same table the progression engine uses, so the level band
          // shown here cannot disagree with the one on the dashboard.
          levelTitle: getLevelInfo(user.xp).title,
          xpToNextLevel: getLevelInfo(user.xp).maxXp,
          joinedAt: user.joinedAt.toISOString(),
          lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
          bio: profile?.bio ?? "",
          isOwn: id === viewerId,
        },
        stats: {
          lessonsCompleted: lessonCount,
          coursesCompleted: courseCount,
          achievementsUnlocked: achievements.length,
          /**
           * Only metrics with a real source. The Sprint 58 fixture showed
           * "Avg Score 78%", "28 h learned", and "3840 cards played" — none of
           * which had a persisted origin, so they are not carried over. Empty
           * is better than invented, and a later sprint can add them once there
           * are rows to compute them from.
           */
          xp: user.xp,
        },
        achievements: achievements.map((row) => ({
          id: row.achievementId,
          title: row.achievement.title,
          description: row.achievement.description,
          icon: row.achievement.icon,
          rarity: row.achievement.rarity,
          category: row.achievement.category,
          xpReward: row.achievement.xpReward,
          // Nullable in the schema; a row can be unlocked without a timestamp if
          // it was granted outside the normal path.
          unlockedAt: row.unlockedAt?.toISOString() ?? null,
        })),
        // Reported so the page can explain an empty section rather than showing
        // "no recent activity" when the truth is that it was turned off.
        activityVisible: privacy.showActivity,
        activity: activity.map((row) => ({
          id: row.id,
          type: row.type,
          refId: row.refId,
          title: row.title,
          xp: row.xp,
          createdAt: row.createdAt.toISOString(),
        })),
      });
    }),
);
