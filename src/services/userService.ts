/**
 * The signed-in user's aggregate state (Sprint 58 §11, §19).
 *
 * One endpoint, one fetch. The dashboard previously imported `mockUser` and
 * `mockUserStats` directly in seven separate components, so the page issued no
 * requests but showed fixture numbers. Now the page loads this once and passes
 * the result down as props — no N+1 fetching (§26).
 */
import { apiFetch } from "./api";

export interface DashboardUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  country: string;
  experienceLevel: string;
  joinedAt: string;
}

export interface DashboardProgression {
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  lifetimeXp: number;
  xpToNextLevel: number;
  levelTitle: string;
}

export interface DashboardStats {
  lessonsCompleted: number;
  totalLessons: number;
  practiceSessions: number;
  quizAttempts: number;
  auctionsCompleted: number;
  achievementsUnlocked: number;
}

export interface DashboardNextLesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  xpReward: number;
}

export interface DashboardActivity {
  id: string;
  type: string;
  refId: string | null;
  title: string;
  xp: number | null;
  createdAt: string;
}

export interface DashboardData {
  user: DashboardUser;
  progression: DashboardProgression;
  stats: DashboardStats;
  nextLesson: DashboardNextLesson | null;
  recentActivity: DashboardActivity[];
}

export async function fetchDashboard(): Promise<DashboardData> {
  return apiFetch<DashboardData>("/api/dashboard");
}

/** "Dev" -> "DV", for avatar fallbacks. */
export function initialsOf(user: Pick<DashboardUser, "firstName" | "lastName">): string {
  const first = user.firstName?.trim()?.[0] ?? "";
  const last = user.lastName?.trim()?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}
