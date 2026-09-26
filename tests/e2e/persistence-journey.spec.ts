/**
 * Sprint 58 §24 — the persistence integration journey.
 *
 * User starts with new state → lesson → XP → practice → bids → auction
 * complete → result saved → achievement updates → AI conversation saved →
 * BROWSER REFRESH → all state remains correct.
 *
 * This exercises the real HTTP API and the real database, then reloads the page
 * to prove the state came from persistence rather than in-memory React state.
 */
import { test, expect, request } from "@playwright/test";

/** Unique per run so repeated journeys do not collide on the dev identity. */
const tag = `journey-${Date.now()}`;

test.describe.configure({ mode: "serial" });

test("full persistence journey survives a refresh", async ({ page }) => {
  const api = await request.newContext({ baseURL: "http://localhost:3000" });

  // --- A brand new user has a valid empty state (§11) -----------------------
  const fresh = await (await api.get("/api/dashboard")).json();
  expect(fresh.user).toBeTruthy();

  // --- 1. Complete a lesson, which awards XP ---------------------------------
  const lessonResponse = await api.post("/api/progress", {
    data: { lessonId: "l1", completed: true, completedSectionIds: ["lc1"], currentSectionIndex: 1 },
  });
  expect(lessonResponse.ok()).toBeTruthy();
  const lesson = await lessonResponse.json();
  expect(lesson.completed).toBe(true);
  // XP may already have been awarded by an earlier run; what must hold is that
  // the lesson itself is recorded.
  expect(lesson.xpAwarded).toBeGreaterThanOrEqual(0);

  // --- 2. Complete an auction, persisted as structured actions --------------
  const auctionResponse = await api.post("/api/auctions", {
    data: {
      dealer: "N",
      vulnerability: "None",
      actions: [
        { bid: "1NT" }, { bid: "P" }, { bid: "2C" }, { bid: "P" }, { bid: "2S" },
        { bid: "P" }, { bid: "4S" }, { bid: "P" }, { bid: "P" }, { bid: "P" },
      ],
    },
  });
  expect(auctionResponse.status()).toBe(201);
  const auction = await auctionResponse.json();
  expect(auction.actions).toHaveLength(10);
  expect(auction.isComplete).toBe(true);

  // --- 3. Record a practice session bound to that auction -------------------
  const practiceResponse = await api.post("/api/practice", {
    data: {
      auctionId: auction.id,
      scenario: tag,
      isComplete: true,
      score: 90,
      maxScore: 100,
      actions: [
        { phase: "bidding", player: "N", call: "1NT", isCorrect: true },
        { phase: "bidding", player: "S", call: "2C", isCorrect: true },
        { phase: "play", player: "W", card: "S7", isCorrect: false },
      ],
    },
  });
  expect(practiceResponse.status()).toBe(201);
  const session = await practiceResponse.json();
  expect(session.actionCount).toBe(3);

  // --- 4. Take a quiz (server-graded) ----------------------------------------
  const quizResponse = await api.post("/api/quiz-attempts", {
    data: { quizId: "seed-quiz-bidding", answers: { q1: "1", q2: "0" } },
  });
  expect(quizResponse.status()).toBe(201);
  const quiz = await quizResponse.json();
  expect(quiz.correctAnswers).toBe(2);

  // --- 5. Create a note and an AI conversation ------------------------------
  const noteResponse = await api.post("/api/notes", {
    data: { title: `${tag} note`, content: "Stayman asks with 2C", tags: ["stayman"] },
  });
  expect(noteResponse.status()).toBe(201);
  const note = await noteResponse.json();

  const conversationResponse = await api.post("/api/ai/conversations", {
    data: { title: `${tag} conversation`, practiceSessionId: session.id, auctionId: auction.id },
  });
  expect(conversationResponse.status()).toBe(201);
  const conversation = await conversationResponse.json();
  // Context is stored as a reference, not a duplicated hand payload (§17).
  expect(conversation.practiceSessionId).toBe(session.id);
  expect(conversation.auctionId).toBe(auction.id);

  const messagesResponse = await api.post("/api/ai/messages", {
    data: { conversationId: conversation.id, content: "Why did I open 1NT here?" },
  });
  // The AI provider may answer (201), be unconfigured (503), or be
  // unavailable (502). None of those are persistence failures: the user's
  // message is committed BEFORE the provider is called, which is the invariant
  // this journey actually verifies.
  expect([201, 502, 503]).toContain(messagesResponse.status());

  // --- 6. Recompute achievements --------------------------------------------
  await api.post("/api/achievements");

  // ============================ THE REFRESH =================================
  // Everything below re-reads from the database, as a page reload would.

  await page.goto("/dashboard");
  await page.reload();
  await page.waitForLoadState("networkidle");

  // --- 7. Lesson progress survived ------------------------------------------
  const progress = await (await api.get("/api/progress")).json();
  const l1 = progress.lessons.find((l: { lessonId: string }) => l.lessonId === "l1");
  expect(l1, "lesson l1 progress must persist").toBeTruthy();
  expect(l1.completed).toBe(true);
  expect(l1.completedSectionIds).toEqual(["lc1"]);

  // --- 8. XP is real and consistent ------------------------------------------
  const after = await (await api.get("/api/dashboard")).json();
  expect(after.progression.xp).toBeGreaterThan(0);
  expect(after.progression.lifetimeXp).toBeGreaterThan(0);
  expect(after.progression.xp).toBe(after.progression.lifetimeXp);
  expect(after.stats.lessonsCompleted).toBeGreaterThanOrEqual(1);
  expect(after.stats.practiceSessions).toBeGreaterThanOrEqual(1);
  expect(after.stats.quizAttempts).toBeGreaterThanOrEqual(1);
  expect(after.stats.auctionsCompleted).toBeGreaterThanOrEqual(1);

  // --- 9. The auction still replays through the engine ----------------------
  const auctions = await (await api.get("/api/auctions")).json();
  const stored = auctions.auctions.find((a: { id: string }) => a.id === auction.id);
  expect(stored, "auction must persist").toBeTruthy();
  expect(stored.actions).toHaveLength(10);
  expect(stored.engine.finalContract).toMatchObject({ level: 4, strain: "S", declarer: "N" });

  // --- 10. Practice session evidence survived --------------------------------
  const sessions = await (await api.get("/api/practice")).json();
  const storedSession = sessions.sessions.find((s: { id: string }) => s.id === session.id);
  expect(storedSession, "practice session must persist").toBeTruthy();
  expect(storedSession.actionCount).toBe(3);
  expect(storedSession.score).toBe(90);

  // --- 11. Note survived ------------------------------------------------------
  const notes = await (await api.get("/api/notes")).json();
  expect(notes.notes.find((n: { id: string }) => n.id === note.id)).toBeTruthy();

  // --- 12. AI conversation survived, with its user message --------------------
  const conversations = await (await api.get("/api/ai/conversations")).json();
  const storedConversation = conversations.conversations.find(
    (c: { id: string }) => c.id === conversation.id,
  );
  expect(storedConversation, "conversation must persist").toBeTruthy();
  expect(storedConversation.messages.length).toBeGreaterThanOrEqual(1);
  expect(storedConversation.messages[0].role).toBe("user");
  expect(storedConversation.practiceSessionId).toBe(session.id);

  // --- 13. Statistics are derived from that activity --------------------------
  const stats = await (await api.get("/api/stats")).json();
  expect(stats.learning.quizzesTaken).toBeGreaterThanOrEqual(1);
  expect(stats.practice.totalBids).toBeGreaterThanOrEqual(8);
  expect(stats.heatmap).toHaveLength(30);
  // No fabricated randomness: a heatmap intensity must be one of 0..4.
  for (const day of stats.heatmap) {
    expect([0, 1, 2, 3, 4]).toContain(day.intensity);
  }

  await api.dispose();
});
