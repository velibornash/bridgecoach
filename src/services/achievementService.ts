import { mockAchievements } from "./mockData";
import { mockApiCall, simulateDelay } from "./api";
import type { Achievement } from "@/types";

export async function fetchAchievements() {
  await simulateDelay();
  return mockApiCall(mockAchievements);
}

export async function fetchAchievementsByCategory(category: string) {
  await simulateDelay();
  const filtered = mockAchievements.filter((a) => a.category === category);
  return mockApiCall(filtered);
}

export async function checkAchievementUnlocks(currentXp: number, lessonsCompleted: number, streak: number) {
  await simulateDelay(200);
  const newlyUnlocked: Achievement[] = [];
  for (const achievement of mockAchievements) {
    if (achievement.unlocked) continue;
    let shouldUnlock = false;
    if (achievement.id === "a5" && lessonsCompleted >= 10) shouldUnlock = true;
    if (achievement.id === "a4" && streak >= 7) shouldUnlock = true;
    if (achievement.id === "a8" && streak >= 30) shouldUnlock = true;
    if (shouldUnlock) {
      newlyUnlocked.push({
        ...achievement,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      });
    }
  }
  return mockApiCall(newlyUnlocked);
}
