/**
 * Skill profile client (Sprint 60 follow-up).
 */
import { apiFetchSafe } from "./api";
import type { SkillProfile } from "@/components/statistics/SkillRadar";

export interface SkillsData {
  skills: (SkillProfile & { id: string; correct: number; note?: string })[];
  overall: number | null;
  skillsReported: number;
  skillsTotal: number;
  practiceActions: number;
  minAttempts: number;
}

export async function fetchSkills(): Promise<{
  data: SkillsData | null;
  error: string | null;
  status: number;
}> {
  const result = await apiFetchSafe<SkillsData>("/api/statistics/skills");
  return { data: result.data, error: result.data ? null : result.error, status: result.status };
}
