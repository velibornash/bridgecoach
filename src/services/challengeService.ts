import { mockDailyChallenges, mockDailyChallengeHistory } from "./mockData";
import { mockApiCall, simulateDelay } from "./api";
import type { DailyChallengeData } from "@/types";

export async function fetchTodaysChallenge() {
  await simulateDelay();
  const today = new Date().toISOString().split("T")[0];
  const challenge = mockDailyChallenges.find((c) => c.date === today) || mockDailyChallenges[0];
  return mockApiCall(challenge);
}

export async function fetchChallengeHistory() {
  await simulateDelay();
  return mockApiCall(mockDailyChallengeHistory);
}

export async function completeChallenge(challengeId: string) {
  await simulateDelay(400);
  return mockApiCall({
    challengeId,
    completed: true,
    xpEarned: 40,
    bonusXp: 20,
  });
}
