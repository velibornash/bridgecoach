/**
 * Achievements (Sprint 58 §19, §22).
 *
 * Progress and unlock state are derived by the server from persisted activity.
 * The browser no longer receives a fixture list with hardcoded progress, and it
 * can no longer "unlock" anything by itself — POST recomputes from real data.
 */
import { apiFetch, apiFetchSafe } from "./api";

interface AchievementsResponse {
  metrics: {
    lessonsCompleted: number;
    xp: number;
    streak: number;
    practiceSessions: number;
    quizAttempts: number;
    perfectQuizzes: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    xpReward: number;
    rarity: string;
    metric: string;
    threshold: number;
    progress: number;
    unlocked: boolean;
    unlockedAt: string | null;
  }>;
}

export interface AchievementState {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  rarity: string;
  metric: string;
  threshold: number;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export async function fetchAchievements(): Promise<ApiResponseLike<AchievementState[]>> {
  try {
    const response = await apiFetch<AchievementsResponse>("/api/achievements");
    return {
      data: response.achievements.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        category: a.category,
        xpReward: a.xpReward,
        rarity: a.rarity,
        metric: a.metric,
        threshold: a.threshold,
        progress: a.progress,
        maxProgress: a.threshold,
        unlocked: a.unlocked,
        unlockedAt: a.unlockedAt,
      })),
      error: null,
      status: 200,
    };
  } catch (error) {
    return { data: null, error: messageOf(error), status: 0 };
  }
}

export async function fetchAchievementsByCategory(
  category: string,
): Promise<ApiResponseLike<AchievementState[]>> {
  const result = await fetchAchievements();
  if (!result.data) return result;
  return {
    data: result.data.filter((a) => a.category === category),
    error: null,
    status: 200,
  };
}

/**
 * Recomputes unlock state on the server from persisted activity.
 *
 * Replaces the old client-side `checkAchievementUnlocks(currentXp, …)`, which
 * compared against hardcoded ids and returned objects that were then discarded —
 * so unlocks never actually happened.
 */
export async function refreshAchievements(): Promise<string[]> {
  const result = await apiFetchSafe<{ newlyUnlocked: string[]; count: number }>(
    "/api/achievements",
    { method: "POST" },
  );
  return result.data?.newlyUnlocked ?? [];
}

interface ApiResponseLike<T> {
  data: T | null;
  error: string | null;
  status: number;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}
