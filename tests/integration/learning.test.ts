/**
 * Learning module integration tests — lesson/course service contract.
 */
import { describe, expect, it } from "vitest";
import {
  fetchLessons,
  fetchLessonById,
  fetchEpisodeById,
  completeLesson,
  saveLessonProgress,
  getEpisodeProgress,
  getCourseProgress,
  fetchEpisodes,
} from "@/services/lessonService";

describe("learning: lessons", () => {
  it("lists lessons and resolves a known lesson by id", async () => {
    const { data: lessons } = await fetchLessons();
    expect(lessons!.length).toBeGreaterThan(0);
    const first = lessons![0];
    const { data: found, error } = await fetchLessonById(first.id);
    expect(error).toBeNull();
    expect(found!.id).toBe(first.id);
  });

  it("returns 404 for an unknown lesson id", async () => {
    const { status, error } = await fetchLessonById("nope");
    expect(status).toBe(404);
    expect(error).toBe("Lesson not found");
  });
});

describe("learning: episodes", () => {
  it("lists episodes and resolves a known episode", async () => {
    const { data: episodes } = await fetchEpisodes();
    expect(episodes!.length).toBeGreaterThan(0);
    const { data: found } = await fetchEpisodeById(episodes![0].id);
    expect(found!.id).toBe(episodes![0].id);
  });
});

describe("learning: progress", () => {
  it("awards XP on lesson completion", async () => {
    const { data } = await completeLesson("l1");
    expect(data!.completed).toBe(true);
    expect(data!.xpEarned).toBeGreaterThan(0);
  });

  it("persists section progress", async () => {
    const { data } = await saveLessonProgress("l1", ["lc1", "lc2"], 2);
    expect(data!.lessonId).toBe("l1");
    expect(data!.completedSectionIds).toEqual(["lc1", "lc2"]);
    expect(data!.currentSectionIndex).toBe(2);
  });

  it("computes per-episode progress", () => {
    const progress = getEpisodeProgress("ep1");
    expect(progress.episodeId).toBe("ep1");
    expect(progress.totalLessons).toBeGreaterThan(0);
    expect(progress.completedLessons).toBeGreaterThanOrEqual(0);
  });

  it("computes overall course progress", () => {
    const progress = getCourseProgress();
    expect(progress.totalLessons).toBeGreaterThan(0);
    expect(progress.completionPercent).toBeGreaterThanOrEqual(0);
    expect(progress.completionPercent).toBeLessThanOrEqual(100);
  });
});
