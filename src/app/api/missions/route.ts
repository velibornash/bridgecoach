/**
 * Missions (Sprint 58 §13, §20).
 *
 * GET  /api/missions → mission catalogue merged with the user's progress
 *
 * Mission progress is derived from persisted activity the same way achievements
 * are, so it can never drift out of sync with the underlying data.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleRoute(async () =>
  withUser(async (userId) => {
    const [missions, owned, lessonsCompleted, practiceSessions, quizAttempts] =
      await Promise.all([
        prisma.mission.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
        prisma.userMission.findMany({ where: { userId } }),
        prisma.lessonProgress.count({ where: { userId, completed: true } }),
        prisma.practiceSession.count({ where: { userId, isComplete: true } }),
        prisma.quizAttempt.count({ where: { userId } }),
      ]);

    const metrics: Record<string, number> = {
      lessonsCompleted,
      practiceSessions,
      quizAttempts,
    };
    const ownedById = new Map(owned.map((o) => [o.missionId, o]));

    return NextResponse.json({
      missions: missions.map((m) => {
        const state = ownedById.get(m.id);
        const measured = metrics[m.metric] ?? 0;
        const progress = state?.progress ?? Math.min(measured, m.target);
        return {
          id: m.id,
          title: m.title,
          description: m.description,
          type: m.type,
          category: m.category,
          icon: m.icon,
          xpReward: m.xpReward,
          metric: m.metric,
          target: m.target,
          progress,
          completed: state?.completed ?? measured >= m.target,
          completedAt: state?.completedAt?.toISOString() ?? null,
        };
      }),
    });
  }),
);
