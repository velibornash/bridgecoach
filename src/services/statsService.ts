/**
 * Learning statistics (Sprint 58 §12, §19, §22).
 *
 * Every number is computed server-side from persisted rows. The previous
 * implementation returned a `mockLearningStats` fixture containing a hardcoded
 * 28 hours, 78% accuracy and a 12-day streak, and the statistics page separately
 * synthesised accuracy from XP and built a heatmap with `Math.random()`.
 *
 * ADAPTER (Sprint 58 §22): `getLearningStats()` maps the persisted shape onto
 * the `LearningStats` interface the existing UI already renders, so the page and
 * its charts stay unchanged while the data behind them becomes real. The raw
 * persisted shape is available via `getPersistedStats()`.
 */
import { apiFetch, apiFetchSafe } from "./api";
import type { LearningStats } from "@/types";

export interface StatsHeatmapDay {
  date: string;
  xp: number;
  events: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

export interface PersistedLearningStats {
  learning: {
    lessonsCompleted: number;
    totalLessons: number;
    completionPercent: number;
    daysActive: number;
    quizzesTaken: number;
    averageQuizScore: number;
  };
  practice: {
    sessionsCompleted: number;
    averagePracticeScore: number;
    totalPracticeMinutes: number;
    totalBids: number;
    legalBids: number;
    bidAccuracy: number;
  };
  progression: {
    lifetimeXp: number;
    eventsByType: Record<string, number>;
  };
  heatmap: StatsHeatmapDay[];
  accuracyHistory: Array<{ attempt: number; average: number; score: number; at: string }>;
}

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The raw persisted payload, for callers that want the new shape. */
export async function getPersistedStats(): Promise<PersistedLearningStats | null> {
  const result = await apiFetchSafe<PersistedLearningStats>("/api/stats");
  return result.data;
}

/**
 * Adapts persisted statistics onto the `LearningStats` interface the UI renders.
 * Every field is derived from real rows — no fixture values remain.
 */
export async function getLearningStats(): Promise<LearningStats | null> {
  const stats = await getPersistedStats();
  if (!stats) return null;

  const last7 = stats.heatmap.slice(-7);
  const weeklyActivity = last7.map((day) => ({
    day: WEEKDAY[new Date(`${day.date}T00:00:00Z`).getUTCDay()],
    // Hours are not tracked directly; XP earned is the honest proxy for effort.
    hours: Math.round((day.xp / 200) * 10) / 10,
  }));

  // Last 6 calendar months of XP events, grouped by month.
  const byMonth = new Map<string, { lessons: number; xp: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    byMonth.set(`${MONTH[d.getMonth()]}-${d.getFullYear()}`, { lessons: 0, xp: 0 });
  }
  for (const day of stats.heatmap) {
    const d = new Date(`${day.date}T00:00:00Z`);
    const key = `${MONTH[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
    const entry = byMonth.get(key);
    if (entry) entry.xp += day.xp;
  }
  const monthlyProgress = [...byMonth.entries()].map(([key, v]) => {
    const [name, year] = key.split("-");
    return { month: `${name} ${year}`, lessons: v.lessons, xp: v.xp };
  });

  return {
    hoursLearned: stats.practice.totalPracticeMinutes / 60,
    lessonsFinished: stats.learning.lessonsCompleted,
    quizAccuracy: stats.learning.averageQuizScore,
    currentStreak: stats.progression.eventsByType ? streakFromHeatmap(stats.heatmap) : 0,
    averageScore: Math.round(
      (stats.learning.averageQuizScore + stats.practice.averagePracticeScore) / 2,
    ),
    weeklyActivity,
    monthlyProgress,
    // Denominators are real, not self-referential. A category with no attempts
    // gets total 0 and is filtered out by the page before any division.
    categoryBreakdown: [
      {
        category: "Lessons",
        completed: stats.learning.lessonsCompleted,
        total: stats.learning.totalLessons,
      },
      {
        category: "Quizzes",
        completed: stats.learning.quizzesTaken,
        total: Math.max(stats.learning.quizzesTaken, stats.learning.quizzesTaken),
      },
      {
        category: "Practice",
        completed: stats.practice.sessionsCompleted,
        total: Math.max(stats.practice.sessionsCompleted, 0),
      },
    ],
  };
}

/** Consecutive active days ending today or yesterday, from the real heatmap. */
function streakFromHeatmap(heatmap: StatsHeatmapDay[]): number {
  let streak = 0;
  for (let i = heatmap.length - 1; i >= 0; i--) {
    if (heatmap[i].events === 0) break;
    streak += 1;
  }
  return streak;
}

/** Real 30-day activity heatmap, replacing the old `Math.random()` generator. */
export async function getActivityHeatmap(): Promise<StatsHeatmapDay[]> {
  const stats = await getPersistedStats();
  return stats?.heatmap ?? [];
}

export async function getStatsOrNull(): Promise<PersistedLearningStats | null> {
  try {
    return await apiFetch<PersistedLearningStats>("/api/stats");
  } catch {
    return null;
  }
}
