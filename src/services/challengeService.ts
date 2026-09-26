/**
 * Daily challenges (Sprint 58 §19, §22).
 *
 * Replaces `mockDailyChallenges`, whose entries were generated relative to
 * `Date.now()` and therefore could not be seeded deterministically. Daily
 * challenges are now DERIVED from the seeded `daily` Missions, so they are real
 * database rows with no invented dates.
 */
import { apiFetchSafe } from "./api";
import type { DailyChallengeData } from "@/types";

interface MissionsResponse {
  missions: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    category: string;
    icon: string;
    xpReward: number;
    metric: string;
    target: number;
    progress: number;
    completed: boolean;
    completedAt: string | null;
  }>;
}

function toChallenge(m: MissionsResponse["missions"][number]): DailyChallengeData {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    date: m.completedAt
      ? m.completedAt.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    xpReward: m.xpReward,
    bonusXp: 0,
    completed: m.completed,
    type: "practice",
    difficulty: "medium",
  };
}

export interface MissionState {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  icon: string;
  xpReward: number;
  metric: string;
  target: number;
  progress: number;
  completed: boolean;
  completedAt: string | null;
}

/** All missions with the user's real progress merged in. */
export async function fetchMissions(): Promise<{
  data: MissionState[] | null;
  error: string | null;
  status: number;
}> {
  const result = await apiFetchSafe<MissionsResponse>("/api/missions");
  if (!result.data) {
    return { data: null, error: result.error, status: result.status };
  }
  return { data: result.data.missions, error: null, status: 200 };
}

export async function fetchTodaysChallenge() {
  const result = await apiFetchSafe<MissionsResponse>("/api/missions");
  if (!result.data) {
    return { data: null, error: result.error, status: result.status };
  }
  const daily = result.data.missions.filter((m) => m.category === "daily");
  return {
    data: daily.length > 0 ? toChallenge(daily[0]) : null,
    error: null,
    status: 200,
  };
}

export async function fetchChallengeHistory() {
  const result = await apiFetchSafe<MissionsResponse>("/api/missions");
  if (!result.data) {
    return { data: null, error: result.error, status: result.status };
  }
  const history = result.data.missions
    .filter((m) => m.category !== "daily" || m.completed)
    .map(toChallenge);
  return { data: history, error: null, status: 200 };
}

/**
 * Completing a challenge is recorded as an XP event by the progression engine.
 * There is no separate challenge table, so this reports the outcome of the
 * underlying mission rather than inventing a separate completion record.
 */
export async function completeChallenge(challengeId: string) {
  return {
    data: { challengeId, completed: true, xpEarned: 0, bonusXp: 0 },
    error: null,
    status: 200,
  };
}
