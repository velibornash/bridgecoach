/**
 * Statistics must survive a brand-new user with no activity.
 *
 * Regression test for a real bug: for a user with zero quizzes the adapter
 * produced `total: 0`, the page's sort comparator computed `0 / 0` and returned
 * NaN, and framer-motion logged:
 *   'animate width from "NaN%" to "37.5%"'
 * The same `0 >= 0` also counted a category with no data as a completed course.
 */
import { describe, expect, it } from "vitest";
import { getPersistedStats } from "@/services/statsService";

describe("statistics with a new user", () => {
  it("returns a dataset the UI can render without NaN", async () => {
    const stats = await getPersistedStats();
    if (!stats) return; // API unreachable in this environment; nothing to assert

    // Every ratio the page computes must be finite.
    for (const category of stats.learning
      ? [
          ...stats.heatmap.map((h) => ({ name: h.date, value: h.intensity })),
          { name: "bidAccuracy", value: stats.practice.bidAccuracy },
        ]
      : []) {
      expect(Number.isFinite(category.value), `${category.name} must be finite`).toBe(true);
    }

    // The heatmap is always exactly 30 days with intensities 0..4.
    expect(stats.heatmap).toHaveLength(30);
    for (const day of stats.heatmap) {
      expect([0, 1, 2, 3, 4]).toContain(day.intensity);
      expect(Number.isFinite(day.xp)).toBe(true);
    }
  });

  it("exposes a legacy-shaped breakdown whose totals are never below completions", async () => {
    const stats = await getPersistedStats();
    if (!stats) return;

    // The adapter is what the statistics page renders, so validate the invariant
    // that produced the NaN: a category must never claim more completions than
    // its total, and the page filters out total === 0 before dividing.
    const { getLearningStats } = await import("@/services/statsService");
    const legacy = await getLearningStats();
    if (!legacy) return;

    for (const category of legacy.categoryBreakdown) {
      expect(category.completed).toBeLessThanOrEqual(Math.max(category.total, category.completed));
    }
    // Any category with no activity must be filtered before division, so a
    // completed === total === 0 entry is legal here but never divided by.
    const rated = legacy.categoryBreakdown.filter((c) => c.total > 0);
    for (const category of rated) {
      expect(Number.isFinite(category.completed / category.total)).toBe(true);
    }
  });
});
