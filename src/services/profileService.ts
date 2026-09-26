/**
 * Public profile client (Sprint 59).
 *
 * Replaces `mockPublicProfiles`, which was an object literal keyed by three
 * invented user ids. Any real profile URL 404'd against it.
 */
import { apiFetchSafe } from "./api";

export interface PublicProfileAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: string;
  category: string;
  xpReward: number;
  unlockedAt: string | null;
}

export interface PublicProfileActivity {
  id: string;
  type: string;
  refId: string | null;
  title: string;
  xp: number | null;
  createdAt: string;
}

export interface PublicProfile {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
    country: string;
    experienceLevel: string;
    joinedAt: string;
    lastActiveAt: string | null;
    level: number;
    levelTitle: string;
    xp: number;
    xpToNextLevel: number;
    streak: number;
    longestStreak: number;
    bio: string;
    isOwn: boolean;
  };
  stats: {
    lessonsCompleted: number;
    coursesCompleted: number;
    achievementsUnlocked: number;
    xp: number;
  };
  achievements: PublicProfileAchievement[];
  activity: PublicProfileActivity[];
}

export async function fetchPublicProfile(userId: string): Promise<{
  data: PublicProfile | null;
  error: string | null;
  status: number;
}> {
  const result = await apiFetchSafe<PublicProfile>(
    `/api/profiles/${encodeURIComponent(userId)}`,
  );
  return {
    data: result.data,
    error: result.data ? null : result.error,
    status: result.status,
  };
}
