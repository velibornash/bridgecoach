/**
 * Learning module integration tests (Sprint 58 §6, §22, §23).
 *
 * Route handlers are invoked directly rather than over HTTP: these tests are
 * about persistence, and calling the handler keeps them fast and free of a
 * running dev server. The E2E journey covers the real HTTP path.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma, resolveUserId } from "@/lib/db";
import { GET as getProgress, POST as postProgress } from "@/app/api/progress/route";
import { GET as getContent } from "@/app/api/content/route";

const req = (body?: unknown) =>
  new Request("http://localhost/api/progress", {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

async function callJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

let userId: string;
const TEST_LESSON = "l7";

beforeAll(async () => {
  userId = await resolveUserId();
});

afterAll(async () => {
  await prisma.lessonProgress.deleteMany({ where: { userId, lessonId: TEST_LESSON } });
  await prisma.xPEvent.deleteMany({ where: { userId, reference: `lesson:${TEST_LESSON}` } });
  const { recomputeProgression } = await import("@/lib/progression");
  await recomputeProgression(userId);
  await prisma.$disconnect();
});

describe("learning: content catalogue", () => {
  it("serves courses, episodes and lessons from the database", async () => {
    const response = await getContent(req());
    expect(response.status).toBe(200);
    const body = await callJson<{
      courses: unknown[];
      episodes: Array<{ id: string; lessonCount: number }>;
      lessons: Array<{ id: string; title: string; xpReward: number }>;
    }>(response);

    expect(body.lessons.length).toBeGreaterThan(0);
    expect(body.episodes.length).toBeGreaterThan(0);
    expect(body.lessons.every((l) => l.xpReward > 0)).toBe(true);
  });

  it("404s an unknown quiz", async () => {
    const response = await getContent(
      new Request("http://localhost/api/content?quizId=does-not-exist"),
    );
    expect(response.status).toBe(404);
  });
});

describe("learning: progress persists across re-reads", () => {
  it("records section progress, then survives a re-read", async () => {
    const response = await postProgress(
      req({
        lessonId: TEST_LESSON,
        completedSectionIds: ["sec-1", "sec-2"],
        currentSectionIndex: 2,
      }),
    );
    expect(response.status).toBe(200);
    const body = await callJson<{ completedSectionIds: string[]; completed: boolean }>(response);
    expect(body.completedSectionIds).toEqual(["sec-1", "sec-2"]);
    expect(body.completed).toBe(false);

    const stored = await prisma.lessonProgress.findUniqueOrThrow({
      where: { userId_lessonId: { userId, lessonId: TEST_LESSON } },
    });
    expect(stored.completedSectionIds).toEqual(["sec-1", "sec-2"]);
    expect(stored.currentSectionIndex).toBe(2);
  });

  it("a partial update does not erase recorded sections", async () => {
    await postProgress(
      req({
        lessonId: TEST_LESSON,
        completedSectionIds: ["sec-1", "sec-2", "sec-3"],
        currentSectionIndex: 3,
      }),
    );
    // Only `completed` is sent — the sections must survive. This is a regression
    // test for a real data-loss bug found in Sprint 58.
    await postProgress(req({ lessonId: TEST_LESSON, completed: true }));

    const stored = await prisma.lessonProgress.findUniqueOrThrow({
      where: { userId_lessonId: { userId, lessonId: TEST_LESSON } },
    });
    expect(stored.completedSectionIds).toEqual(["sec-1", "sec-2", "sec-3"]);
    expect(stored.completed).toBe(true);
    expect(stored.completedAt).not.toBeNull();
  });

  it("awards XP exactly once for the completion", async () => {
    const events = await prisma.xPEvent.findMany({
      where: { userId, reference: `lesson:${TEST_LESSON}` },
    });
    expect(events).toHaveLength(1);
    expect(events[0].status).toBe("applied");
  });

  it("completion is not undone by a later progress write", async () => {
    await postProgress(req({ lessonId: TEST_LESSON, completedSectionIds: ["sec-1"] }));
    const stored = await prisma.lessonProgress.findUniqueOrThrow({
      where: { userId_lessonId: { userId, lessonId: TEST_LESSON } },
    });
    expect(stored.completed).toBe(true);
  });
});

describe("learning: validation and error handling", () => {
  it("rejects a missing lessonId with 400", async () => {
    const response = await postProgress(req({ completed: true }));
    expect(response.status).toBe(400);
    const body = await callJson<{ code: string }>(response);
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("404s an unknown lesson", async () => {
    const response = await postProgress(req({ lessonId: "no-such-lesson", completed: true }));
    expect(response.status).toBe(404);
  });

  it("rejects malformed JSON with 400", async () => {
    const response = await postProgress(
      new Request("http://localhost/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not json",
      }),
    );
    expect(response.status).toBe(400);
  });
});

describe("learning: derived course progress", () => {
  it("derives completion from lesson rows, not a stored counter", async () => {
    const body = await callJson<{
      lessons: Array<{ lessonId: string; completed: boolean }>;
      courseSummary: Array<{ totalLessons: number; completedLessons: number; completionPercent: number }>;
    }>(await getProgress(req()));

    const completedIds = body.lessons.filter((l) => l.completed).map((l) => l.lessonId);
    const summaryTotalCompleted = body.courseSummary.reduce(
      (sum, c) => sum + c.completedLessons,
      0,
    );
    expect(summaryTotalCompleted).toBe(completedIds.length);
    for (const course of body.courseSummary) {
      expect(course.completionPercent).toBe(
        course.totalLessons === 0
          ? 0
          : Math.round((course.completedLessons / course.totalLessons) * 100),
      );
    }
  });
});
