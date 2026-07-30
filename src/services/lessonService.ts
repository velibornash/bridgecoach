import { mockLessons, mockEpisodes, mockUser } from "./mockData";
import { mockApiCall, simulateDelay } from "./api";
import type { Lesson, Episode, ChapterProgress } from "@/types";

export async function fetchLessons() {
  await simulateDelay();
  return mockApiCall(mockLessons);
}

export async function fetchLessonById(id: string) {
  await simulateDelay();
  const lesson = mockLessons.find((l) => l.id === id);
  if (!lesson) {
    return { data: null, error: "Lesson not found", status: 404 };
  }
  return mockApiCall(lesson);
}

export async function fetchLessonsByEpisode(episodeId: string) {
  await simulateDelay();
  const lessons = mockLessons.filter((l) => l.episodeId === episodeId);
  return mockApiCall(lessons);
}

export async function fetchEpisodes() {
  await simulateDelay();
  return mockApiCall(mockEpisodes);
}

export async function fetchEpisodeById(id: string) {
  await simulateDelay();
  const episode = mockEpisodes.find((e) => e.id === id);
  if (!episode) {
    return { data: null, error: "Episode not found", status: 404 };
  }
  return mockApiCall(episode);
}

export async function completeLesson(lessonId: string) {
  await simulateDelay(300);
  const lesson = mockLessons.find((l) => l.id === lessonId);
  const xpEarned = lesson?.xpReward ?? 70;
  return mockApiCall({ lessonId, completed: true, xpEarned });
}

export async function saveLessonProgress(
  lessonId: string,
  completedSectionIds: string[],
  currentSectionIndex: number,
) {
  await simulateDelay(100);
  return mockApiCall({ lessonId, completedSectionIds, currentSectionIndex });
}

export async function getCurrentLesson() {
  await simulateDelay(200);
  const lessonId = mockUser.currentLessonId;
  if (!lessonId) {
    const next = mockLessons.find((l) => !l.completed && !l.locked);
    return mockApiCall(next ?? null);
  }
  const lesson = mockLessons.find((l) => l.id === lessonId);
  return mockApiCall(lesson ?? null);
}

export function getEpisodeProgress(episodeId: string): ChapterProgress {
  const episode = mockEpisodes.find((e) => e.id === episodeId);
  if (!episode) {
    return { episodeId, completedLessons: 0, totalLessons: 0, currentLessonId: null, completedLessonIds: [] };
  }
  const epLessons = mockLessons.filter((l) => l.episodeId === episodeId);
  const completed = epLessons.filter((l) => l.completed);
  const current = epLessons.find((l) => !l.completed && !l.locked);
  return {
    episodeId,
    completedLessons: completed.length,
    totalLessons: epLessons.length,
    currentLessonId: current?.id ?? null,
    completedLessonIds: completed.map((l) => l.id),
  };
}

export function getCourseProgress() {
  const total = mockLessons.length;
  const completed = mockLessons.filter((l) => l.completed).length;
  const locked = mockLessons.filter((l) => l.locked).length;
  const inProgress = total - completed - locked;
  const episodesCompleted = mockEpisodes.filter((e) => e.completion === 100).length;
  const episodesTotal = mockEpisodes.length;
  return {
    totalLessons: total,
    completedLessons: completed,
    lockedLessons: locked,
    inProgressLessons: inProgress,
    completionPercent: Math.round((completed / total) * 100),
    episodesCompleted,
    episodesTotal,
  };
}
