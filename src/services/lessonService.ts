/**
 * Learning content and progress (Sprint 58 §19, §22).
 *
 * Static content (courses, episodes, lessons) comes from the seeded database via
 * /api/content. User progress is written through /api/progress — previously
 * `saveLessonProgress` accepted a payload and discarded it, so nothing persisted.
 */
import { apiFetch, apiFetchSafe, type ApiResponse } from "./api";
import type { ChapterProgress, Episode, Lesson, LessonNote } from "@/types";

interface ContentLesson {
  id: string;
  courseId: string | null;
  episodeId: string | null;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  duration: string;
  xpReward: number;
  position: number;
}

interface ContentResponse {
  courses: Array<{ id: string; slug: string; title: string; description: string; position: number }>;
  episodes: Array<{
    id: string;
    courseId: string;
    title: string;
    description: string;
    position: number;
    lessonCount: number;
  }>;
  lessons: ContentLesson[];
}

interface ProgressLesson {
  lessonId: string;
  completed: boolean;
  completedSectionIds: string[];
  currentSectionIndex: number;
  completedAt: string | null;
}

interface ProgressResponse {
  lessons: ProgressLesson[];
  courseSummary: Array<{
    courseId: string;
    totalLessons: number;
    completedLessons: number;
    completionPercent: number;
  }>;
}

/** Cached catalogue so a page showing many lessons does not refetch per card. */
let contentCache: ContentResponse | null = null;
let progressCache: ProgressResponse | null = null;

async function loadContent(): Promise<ContentResponse> {
  contentCache ??= await apiFetch<ContentResponse>("/api/content");
  return contentCache;
}

async function loadProgress(): Promise<ProgressResponse> {
  progressCache ??= await apiFetch<ProgressResponse>("/api/progress");
  return progressCache;
}

/** Cached data goes stale when a mutation succeeds. */
export function invalidateContentCache(): void {
  contentCache = null;
  progressCache = null;
}

/**
 * Lessons with the user's real progress merged in.
 *
 * `locked` is a RULE, not stored state: a lesson is locked while an earlier
 * lesson in the same episode is still incomplete.
 */
export async function fetchLessons(): Promise<ApiResponse<Lesson[]>> {
  try {
    const [content, progress] = await Promise.all([loadContent(), loadProgress()]);
    const byLesson = new Map(progress.lessons.map((p) => [p.lessonId, p]));

    const lessons: Lesson[] = content.lessons.map((lesson) => {
      const state = byLesson.get(lesson.id);
      const blocked = content.lessons.some(
        (other) =>
          other.episodeId === lesson.episodeId &&
          other.position < lesson.position &&
          !byLesson.get(other.id)?.completed,
      );
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        xpReward: lesson.xpReward,
        completed: state?.completed ?? false,
        locked: blocked,
        category: lesson.category,
        subcategory: lesson.subcategory,
        episodeId: lesson.episodeId ?? "",
        content: [],
        hasCards: false,
        sectionsCompleted: state?.completedSectionIds ?? [],
        currentSectionIndex: state?.currentSectionIndex ?? 0,
      };
    });

    return { data: lessons, error: null, status: 200 };
  } catch (error) {
    return { data: null, error: messageOf(error), status: 0 };
  }
}

export async function fetchLessonById(id: string): Promise<ApiResponse<Lesson>> {
  const result = await fetchLessons();
  if (!result.data) return { data: null, error: result.error, status: result.status };
  const lesson = result.data.find((l) => l.id === id);
  return lesson
    ? { data: lesson, error: null, status: 200 }
    : { data: null, error: "Lesson not found", status: 404 };
}

export async function fetchLessonsByEpisode(
  episodeId: string,
): Promise<ApiResponse<Lesson[]>> {
  const result = await fetchLessons();
  if (!result.data) return { data: null, error: result.error, status: result.status };
  return {
    data: result.data.filter((l) => l.episodeId === episodeId),
    error: null,
    status: 200,
  };
}

export async function fetchEpisodes(): Promise<ApiResponse<Episode[]>> {
  try {
    const [content, lessons] = await Promise.all([loadContent(), fetchLessons()]);
    const byId = new Map((lessons.data ?? []).map((l) => [l.id, l]));

    const episodes: Episode[] = content.episodes.map((e) => {
      const inEpisode = content.lessons
        .filter((l) => l.episodeId === e.id)
        .map((l) => byId.get(l.id))
        .filter((l): l is Lesson => Boolean(l));
      const completed = inEpisode.filter((l) => l.completed).length;
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        episodeNumber: e.position + 1,
        difficulty: "beginner",
        // Episode rewards are derived from the lessons actually in it.
        xpReward: inEpisode.reduce((sum, l) => sum + l.xpReward, 0),
        totalXp: inEpisode.reduce((sum, l) => sum + l.xpReward, 0),
        duration: `${inEpisode.length * 8} min`,
        lessonCount: inEpisode.length,
        completedLessons: completed,
        completion:
          inEpisode.length === 0 ? 0 : Math.round((completed / inEpisode.length) * 100),
        locked: inEpisode.some((l) => l.locked),
        gradient: "",
        icon: "♠",
        lessons: inEpisode.map((l) => l.title),
      };
    });

    return { data: episodes, error: null, status: 200 };
  } catch (error) {
    return { data: null, error: messageOf(error), status: 0 };
  }
}

export async function fetchEpisodeById(id: string): Promise<ApiResponse<Episode>> {
  const result = await fetchEpisodes();
  if (!result.data) return { data: null, error: result.error, status: result.status };
  const episode = result.data.find((e) => e.id === id);
  return episode
    ? { data: episode, error: null, status: 200 }
    : { data: null, error: "Episode not found", status: 404 };
}

export interface SaveProgressResult {
  lessonId: string;
  completed: boolean;
  completedSectionIds: string[];
  currentSectionIndex: number;
  completedAt: string | null;
  xpAwarded: number;
}

export interface SaveProgressInput {
  lessonId: string;
  completed?: boolean;
  completedSectionIds?: string[];
  currentSectionIndex?: number;
}

/** Persists lesson progress. This now actually writes to the database. */
export async function saveLessonProgress(input: SaveProgressInput) {
  const result = await apiFetchSafe<SaveProgressResult>("/api/progress", {
    method: "POST",
    body: input,
  });
  invalidateContentCache();
  return result;
}

export async function completeLesson(lessonId: string) {
  const result = await apiFetchSafe<SaveProgressResult>("/api/progress", {
    method: "POST",
    body: { lessonId, completed: true },
  });
  invalidateContentCache();
  return result;
}

/** The next lesson the user has not completed, from real progress. */
export async function getCurrentLesson(): Promise<ApiResponse<Lesson | null>> {
  const result = await fetchLessons();
  if (!result.data) return { data: null, error: result.error, status: result.status };
  return { data: result.data.find((l) => !l.completed && !l.locked) ?? null, error: null, status: 200 };
}

/** Episode progress derived from the lessons that belong to it. */
export function getEpisodeProgressSync(episodeId: string, lessons: Lesson[]): ChapterProgress {
  const inEpisode = lessons.filter((l) => l.episodeId === episodeId);
  const completed = inEpisode.filter((l) => l.completed);
  return {
    episodeId,
    completedLessons: completed.length,
    totalLessons: inEpisode.length,
    currentLessonId: inEpisode.find((l) => !l.completed)?.id ?? null,
    completedLessonIds: completed.map((l) => l.id),
  };
}

/** Async variant for pages that do not already hold the lesson list. */
export async function getEpisodeProgress(episodeId: string): Promise<ChapterProgress> {
  const result = await fetchLessons();
  return getEpisodeProgressSync(
    episodeId,
    result.data ?? [],
  );
}

export function getCourseProgressSync(lessons: Lesson[]) {
  const total = lessons.length;
  const completed = lessons.filter((l) => l.completed).length;
  const locked = lessons.filter((l) => l.locked).length;
  return {
    totalLessons: total,
    completedLessons: completed,
    lockedLessons: locked,
    inProgressLessons: total - completed - locked,
    completionPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
    episodesCompleted: 0,
    episodesTotal: 0,
  };
}

/** Async variant for pages that do not already hold the lesson list. */
export async function getCourseProgress() {
  const result = await fetchLessons();
  return getCourseProgressSync(result.data ?? []);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}
