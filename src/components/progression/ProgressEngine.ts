"use client";

export interface ProgressionStats {
  lessonsCompleted: number;
  coursesCompleted: number;
  handsSolved: number;
  accuracy: number; // percentage
  averageThinkingTime: number; // in seconds
  weakAreas: string[];
  strongAreas: string[];
  streak: number;
  confidenceScore: number; // 0 to 100
  bridgeRating: number; // e.g. 1540 (Elo rating)
}

export interface SkillMastery {
  name: string;
  percentage: number;
  description: string;
}

export class ProgressEngine {
  public static calculateMastery(stats: ProgressionStats): SkillMastery[] {
    // Generate calculated skills based on progression stats
    const openingBidsProgress = Math.min(100, Math.round(stats.accuracy * 0.95 + stats.lessonsCompleted * 2));
    const takeoutDoublesProgress = Math.min(100, Math.round(stats.accuracy * 0.85 + stats.handsSolved * 1.5));
    const defenseProgress = Math.min(100, Math.round(stats.accuracy * 0.88 + stats.lessonsCompleted * 1.2));
    const slamsProgress = Math.min(100, Math.round(stats.accuracy * 0.65 + stats.handsSolved * 0.8));
    const signalsProgress = Math.min(100, Math.round(stats.accuracy * 0.78 + stats.lessonsCompleted * 1.5));

    return [
      {
        name: "Opening Bids",
        percentage: openingBidsProgress,
        description: "Evaluating hands, choosing correct suits, and determining standard limits.",
      },
      {
        name: "Takeout Doubles",
        percentage: takeoutDoublesProgress,
        description: "Contesting opponents' bids and communicating shape to partner.",
      },
      {
        name: "Defense",
        percentage: defenseProgress,
        description: "Leading cards, managing trick flow, and executing strategic drops.",
      },
      {
        name: "Slams",
        percentage: slamsProgress,
        description: "Blackwood, Gerber, cue bidding, and high-level grand slam attempts.",
      },
      {
        name: "Signals",
        percentage: signalsProgress,
        description: "Partner communication, attitude signals, count signals, and suit preference.",
      },
    ];
  }

  public static calculateConfidence(stats: ProgressionStats): number {
    const accuracyFactor = stats.accuracy * 0.5;
    const completionFactor = Math.min(50, stats.lessonsCompleted * 2.5);
    return Math.round(accuracyFactor + completionFactor);
  }

  public static calculateBridgeRating(stats: ProgressionStats): number {
    const base = 1000;
    const accuracyBonus = Math.max(0, (stats.accuracy - 50) * 12);
    const activityBonus = stats.lessonsCompleted * 15 + stats.handsSolved * 8;
    return Math.round(base + accuracyBonus + activityBonus);
  }
}
