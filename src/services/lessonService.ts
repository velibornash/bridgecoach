import { mockLessons, mockEpisodes } from "./mockData";
import { mockApiCall, simulateDelay } from "./api";
import type { Lesson, Episode } from "@/types";

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
  return mockApiCall({ lessonId, completed: true, xpEarned: 70 });
}
