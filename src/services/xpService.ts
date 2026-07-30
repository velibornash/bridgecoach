import type { LevelInfo, XpEntry, XpSource } from "@/types";

const LEVEL_THRESHOLDS: LevelInfo[] = [
  { level: 1, minXp: 0, maxXp: 300, title: "Novice" },
  { level: 2, minXp: 300, maxXp: 700, title: "Beginner" },
  { level: 3, minXp: 700, maxXp: 1200, title: "Apprentice" },
  { level: 4, minXp: 1200, maxXp: 1800, title: "Student" },
  { level: 5, minXp: 1800, maxXp: 2500, title: "Player" },
  { level: 6, minXp: 2500, maxXp: 3300, title: "Competitor" },
  { level: 7, minXp: 3300, maxXp: 4200, title: "Strategist" },
  { level: 8, minXp: 4200, maxXp: 5200, title: "Tactician" },
  { level: 9, minXp: 5200, maxXp: 6300, title: "Expert" },
  { level: 10, minXp: 6300, maxXp: 7500, title: "Master" },
  { level: 11, minXp: 7500, maxXp: 8800, title: "Grandmaster" },
  { level: 12, minXp: 8800, maxXp: 10200, title: "Legend" },
];

export function getLevelInfo(xp: number): LevelInfo {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].minXp) return LEVEL_THRESHOLDS[i];
  }
  return LEVEL_THRESHOLDS[0];
}

export function getXpForLevel(level: number): LevelInfo | undefined {
  return LEVEL_THRESHOLDS.find((l) => l.level === level);
}

export function getXpToNextLevel(currentXp: number, currentLevel: number): number {
  const current = getXpForLevel(currentLevel);
  const next = getXpForLevel(currentLevel + 1);
  if (!current || !next) {
    if (current) return current.maxXp - currentXp;
    return 0;
  }
  return next.minXp - currentXp;
}

export function getDailyXpGoal(): number {
  return 200;
}

export function getWeeklyXpGoal(): number {
  return 1000;
}

export function getXpSourceInfo(source: XpSource): { label: string; color: string } {
  const map: Record<XpSource, { label: string; color: string }> = {
    lesson: { label: "Lesson", color: "text-blue-400" },
    quiz: { label: "Quiz", color: "text-emerald-400" },
    challenge: { label: "Challenge", color: "text-amber-400" },
    achievement: { label: "Achievement", color: "text-purple-400" },
    streak_bonus: { label: "Streak Bonus", color: "text-rose-400" },
    daily_bonus: { label: "Daily Bonus", color: "text-cyan-400" },
  };
  return map[source] || { label: source, color: "text-text-secondary" };
}

export function generateXpEntries(): XpEntry[] {
  const now = Date.now();
  const day = 86400000;
  const entries: XpEntry[] = [
    { id: "xp1", amount: 70, source: "lesson", description: "Completed 'NT Opening Bids'", timestamp: new Date(now - 2 * 3600000).toISOString() },
    { id: "xp2", amount: 40, source: "quiz", description: "Scored 90% on Bidding Quiz", timestamp: new Date(now - 6 * 3600000).toISOString() },
    { id: "xp3", amount: 25, source: "challenge", description: "Daily Bridge Puzzle", timestamp: new Date(now - 12 * 3600000).toISOString() },
    { id: "xp4", amount: 50, source: "achievement", description: "Unlocked 'Bidder' achievement", timestamp: new Date(now - day).toISOString() },
    { id: "xp5", amount: 15, source: "streak_bonus", description: "12-day streak bonus", timestamp: new Date(now - day).toISOString() },
    { id: "xp6", amount: 30, source: "quiz", description: "Scored 80% on Defense Quiz", timestamp: new Date(now - 1.5 * day).toISOString() },
    { id: "xp7", amount: 60, source: "lesson", description: "Completed 'Opening Leads'", timestamp: new Date(now - 2 * day).toISOString() },
    { id: "xp8", amount: 10, source: "daily_bonus", description: "Daily login bonus", timestamp: new Date(now - 2 * day).toISOString() },
    { id: "xp9", amount: 100, source: "challenge", description: "Weekly Challenge completed", timestamp: new Date(now - 3 * day).toISOString() },
    { id: "xp10", amount: 20, source: "quiz", description: "Scored 70% on Play Quiz", timestamp: new Date(now - 4 * day).toISOString() },
    { id: "xp11", amount: 55, source: "lesson", description: "Completed 'Basic Scoring'", timestamp: new Date(now - 5 * day).toISOString() },
    { id: "xp12", amount: 35, source: "achievement", description: "Unlocked 'Streak Starter'", timestamp: new Date(now - 6 * day).toISOString() },
    { id: "xp13", amount: 10, source: "daily_bonus", description: "Daily login bonus", timestamp: new Date(now - 6 * day).toISOString() },
    { id: "xp14", amount: 45, source: "lesson", description: "Completed 'Trick-Taking'", timestamp: new Date(now - 7 * day).toISOString() },
  ];
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getDailyXpTotal(entries: XpEntry[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return entries
    .filter((e) => new Date(e.timestamp) >= today)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getWeeklyXpTotal(entries: XpEntry[]): number {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return entries
    .filter((e) => new Date(e.timestamp) >= weekAgo)
    .reduce((sum, e) => sum + e.amount, 0);
}
