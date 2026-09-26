/**
 * Player Model — derived skill accuracy (Sprint 60 follow-up).
 *
 * `SkillRadar` used to render five invented percentages on a user who had
 * recorded nothing. The replacement is computed from the player's own auction
 * rows, which makes two properties worth protecting:
 *
 * 1. The number is derived from `engineLegal` — the engine's own verdict — and
 *    never re-judged.
 * 2. A percentage is not reported below a sample threshold, because a percentage
 *    of two attempts looks authoritative and means nothing. Returning `null`
 *    rather than a number is the difference between ignorance and a claim.
 */
import { describe, expect, it, beforeAll, afterAll, afterEach, vi } from "vitest";
import { prisma } from "@/lib/db";
import * as sessionModule from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { MIN_ATTEMPTS } from "@/app/api/statistics/skills/route";

let stamp: number;
let skilledId: string;
let blankId: string;
let courseId: string;
let lessonId: string;

beforeAll(async () => {
  stamp = Date.now();
  const make = async (handle: string) => {
    const user = await prisma.user.create({
      data: {
        email: `skills-${handle}-${stamp}@test.local`,
        passwordHash: await hashPassword("password123"),
        firstName: handle,
        lastName: "Test",
        role: "user",
        status: "active",
      },
    });
    return user.id;
  };
  skilledId = await make("skilled");
  blankId = await make("blank");

  const course = await prisma.course.create({
    data: { id: `skills-course-${stamp}`, slug: `skills-${stamp}`, title: "Skill Course" },
  });
  const lesson = await prisma.lesson.create({
    data: { id: `skills-lesson-${stamp}`, courseId: course.id, title: "Skill Lesson" },
  });
  courseId = course.id;
  lessonId = lesson.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [skilledId, blankId] } } });
  await prisma.lesson.deleteMany({ where: { id: lessonId } });
  await prisma.course.deleteMany({ where: { id: courseId } });
  await prisma.$disconnect();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function asUser(id: string) {
  vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue({
    id,
    email: "skills@test.local",
    firstName: "",
    lastName: "",
    role: "user",
    status: "active",
  });
}

const get = () => new Request("http://localhost/api/statistics/skills");

/**
 * Creates an auction with `count` opening calls, `legal` of which the engine
 * accepted. `sequence: 1` is what makes them openings.
 */
async function seedAuctions(count: number, legal: number): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    const hand = await prisma.hand.create({
      // `Hand` requires all four hands; the contents are irrelevant here because
      // only the auction actions are read.
      data: {
        userId: skilledId,
        dealer: "N",
        north: { "1": "SA" },
        east: { "1": "HK" },
        south: { "1": "DQ" },
        west: { "1": "CK" },
      },
    });
    const auction = await prisma.auction.create({
      data: {
        userId: skilledId,
        handId: hand.id,
        dealer: "N",
        isComplete: true,
        finalLevel: 3,
        finalStrain: "NT",
      },
    });
    await prisma.auctionAction.create({
      data: {
        auctionId: auction.id,
        player: "N",
        type: "bid",
        level: 3,
        strain: "NT",
        engineLegal: i < legal,
        sequence: 1,
      },
    });
  }
}

/**
 * Auctions are deleted explicitly: clearing the parent Hand is not enough,
 * because the relation does not cascade, so earlier tests' rows survived and
 * silently inflated every later count.
 */
async function clearAuctions(): Promise<void> {
  await prisma.auction.deleteMany({ where: { userId: skilledId } });
  await prisma.hand.deleteMany({ where: { userId: skilledId } });
}

describe("skill accuracy is derived, not invented", () => {
  it("reports no percentage for a user who has played nothing", async () => {
    await clearAuctions();
    asUser(blankId);
    const { GET } = await import("@/app/api/statistics/skills/route");
    const body = await (await GET(get())).json();

    expect(body.overall).toBeNull();
    expect(body.skillsReported).toBe(0);
    for (const skill of body.skills) {
      expect(skill.value).toBeNull();
      expect(skill.attempts).toBe(0);
      // The reason is stated, not left for the page to guess.
      expect(skill.note).toMatch(/needed for a percentage/);
    }
  });

  it("still withholds a percentage below the sample threshold", async () => {
    await clearAuctions();
    await seedAuctions(MIN_ATTEMPTS - 1, MIN_ATTEMPTS - 1);
    asUser(skilledId);
    const { GET } = await import("@/app/api/statistics/skills/route");
    const body = await (await GET(get())).json();

    const opening = body.skills.find((s: { id: string }) => s.id === "opening");
    // Four perfect openings is a 100% — and reporting it would be noise dressed
    // as a result.
    expect(opening.attempts).toBe(MIN_ATTEMPTS - 1);
    expect(opening.value).toBeNull();
  });

  it("reports accuracy once there is enough evidence", async () => {
    await clearAuctions();
    await seedAuctions(8, 6);
    asUser(skilledId);
    const { GET } = await import("@/app/api/statistics/skills/route");
    const body = await (await GET(get())).json();

    const opening = body.skills.find((s: { id: string }) => s.id === "opening");
    expect(opening.attempts).toBe(8);
    expect(opening.correct).toBe(6);
    expect(opening.value).toBe(75);
    expect(opening.note).toBeUndefined();
  });

  it("never returns a value above 100 or below 0", async () => {
    await clearAuctions();
    await seedAuctions(MIN_ATTEMPTS, 0);
    asUser(skilledId);
    const { GET } = await import("@/app/api/statistics/skills/route");
    const body = await (await GET(get())).json();

    for (const skill of body.skills) {
      if (skill.value !== null) {
        expect(skill.value).toBeGreaterThanOrEqual(0);
        expect(skill.value).toBeLessThanOrEqual(100);
      }
    }
    // All attempts wrong is a real 0%, which is different from "unknown".
    const opening = body.skills.find((s: { id: string }) => s.id === "opening");
    expect(opening.value).toBe(0);
  });

  it("averages only the skills that had enough data", async () => {
    await clearAuctions();
    // Openings only. Doubles, slams and defence have zero attempts.
    await seedAuctions(6, 6);
    asUser(skilledId);
    const { GET } = await import("@/app/api/statistics/skills/route");
    const body = await (await GET(get())).json();

    expect(body.skillsReported).toBe(1);
    expect(body.skillsTotal).toBe(4);
    // Averaging in the unreported skills as zeros would report 25% for a player
    // who has never doubled, bid a slam, or defended.
    expect(body.overall).toBe(100);
  });

  it("separates doubles from plain bids", async () => {
    await clearAuctions();
    const hand = await prisma.hand.create({
      // `Hand` requires all four hands; the contents are irrelevant here because
      // only the auction actions are read.
      data: {
        userId: skilledId,
        dealer: "N",
        north: { "1": "SA" },
        east: { "1": "HK" },
        south: { "1": "DQ" },
        west: { "1": "CK" },
      },
    });
    const auction = await prisma.auction.create({
      data: { userId: skilledId, handId: hand.id, dealer: "N", isComplete: true },
    });
    for (let i = 0; i < MIN_ATTEMPTS; i += 1) {
      await prisma.auctionAction.create({
        data: {
          auctionId: auction.id,
          player: "E",
          type: "double",
          engineLegal: false,
          sequence: 2 + i,
        },
      });
    }
    asUser(skilledId);
    const { GET } = await import("@/app/api/statistics/skills/route");
    const body = await (await GET(get())).json();
    expect(body.skills.find((s: { id: string }) => s.id === "doubles").attempts).toBe(
      MIN_ATTEMPTS,
    );
  });

  it("does not leak one user's auctions into another's profile", async () => {
    await clearAuctions();
    await seedAuctions(6, 6);
    asUser(blankId);
    const { GET } = await import("@/app/api/statistics/skills/route");
    const body = await (await GET(get())).json();
    expect(body.overall).toBeNull();
    for (const skill of body.skills) expect(skill.attempts).toBe(0);
  });
});
