import { mockLearningStats } from "./mockData";
import type { LearningStats } from "@/types";

export async function getLearningStats(): Promise<LearningStats> {
  await new Promise((r) => setTimeout(r, 300));
  return mockLearningStats;
}
