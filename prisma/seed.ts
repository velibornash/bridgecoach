/**
 * Bridge Coach — development seed (Sprint 58 §18).
 *
 * Converts the useful parts of `src/services/mockData.ts` into deterministic,
 * repeatable development data.
 *
 * PROPERTIES
 *  - DETERMINISTIC: no `Date.now()` / `Math.random()` in stored values, so two
 *    seed runs produce the same rows. (mockData's XP entries and daily
 *    challenges ARE time-relative; those are deliberately not seeded.)
 *  - IDEMPOTENT: every write is an upsert keyed on a stable id, so `npm run db:seed`
 *    can be re-run safely.
 *  - DISTINGUISHABLE: static content is flagged `isSeed: true` so it can be told
 *    apart from production-created rows (and filtered out of real reporting).
 *
 * This creates the development identity that `src/lib/db.ts` resolves via
 * `DEV_USER_EMAIL`. Sprint 59 replaces that with real authentication.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  mockLessons,
  mockEpisodes,
  mockAchievements,
  mockMissions,
  mockQuizQuestions,
} from "../src/services/mockData";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DEV_USER_EMAIL = process.env.DEV_USER_EMAIL ?? "dev@bridgecoach.local";

/**
 * mockData's lesson content is a typed `LessonContent[]`, which TypeScript will
 * not accept directly as Prisma's `InputJsonValue`. Round-tripping through
 * JSON proves the value is actually serialisable, which is what the column
 * requires anyway.
 */
function toJson(value: unknown) {
  return value == null ? null : JSON.parse(JSON.stringify(value));
}

/** Fixed reference date keeps seeded timestamps reproducible. */
const SEED_JOINED_AT = new Date("2026-01-15T00:00:00.000Z");

/** mapMockCategory → AchievementCategory enum */
const ACHIEVEMENT_CATEGORY: Record<string, string> = {
  lessons: "learning",
  learning: "learning",
  bidding: "bidding",
  streak: "streak",
  practice: "practice",
  quizzes: "quiz",
  quiz: "quiz",
  social: "social",
  mastery: "milestone",
  special: "milestone",
  milestone: "milestone",
};

/**
 * Which real metric each achievement is measured against.
 *
 * mockData only carries a category, which is not specific enough to drive the
 * progression engine — "Perfect Score" is a `quizzes` achievement, so measuring
 * it by completed lessons would unlock it for the wrong reason.
 *
 * `mastery` / `special` / `bidding` achievements are mapped to "manual" on
 * purpose. Their original thresholds (e.g. 64/100, 12/30) are expressed in
 * undefined units, so there is no honest metric to evaluate them against.
 * Guessing "xp" would unlock them for the wrong reason. They stay locked until
 * the Player Model (Sprint 60) gives them a real definition; the achievements
 * route reports an unknown metric as 0, so a manual achievement is never
 * accidentally unlocked.
 */
const ACHIEVEMENT_METRIC: Record<string, string> = {
  lessons: "lessonsCompleted",
  learning: "lessonsCompleted",
  quizzes: "perfectQuizzes",
  quiz: "perfectQuizzes",
  streak: "streak",
  practice: "practiceSessions",
  mastery: "manual",
  special: "manual",
  bidding: "manual",
  milestone: "manual",
  social: "manual",
};

/** mapMockType → MissionType enum */
const MISSION_TYPE: Record<string, "daily" | "weekly" | "season" | "main" | "side" | "bonus"> = {
  main: "main",
  side: "side",
  bonus: "bonus",
  daily: "daily",
  weekly: "weekly",
  season: "season",
};

async function seedUser() {
  const user = await prisma.user.upsert({
    where: { email: DEV_USER_EMAIL },
    update: {},
    create: {
      id: "seed-user-dev",
      email: DEV_USER_EMAIL,
      // No passwordHash: this identity is not authenticatable (Sprint 59).
      firstName: "Dev",
      lastName: "User",
      country: "US",
      experienceLevel: "beginner",
      joinedAt: SEED_JOINED_AT,
      lastActiveAt: SEED_JOINED_AT,
      isSeed: true,
      // A fresh development user starts with a valid EMPTY state (Sprint 58 §11):
      // xp 0, level 1, no progress rows. Progression below is not seeded.
    },
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      bio: "Development user created by prisma/seed.ts.",
    },
  });

  return user;
}

async function seedCoursesAndLessons() {
  // A single course holding every seeded episode keeps the schema simple while
  // preserving the episode → lesson relationship the UI already renders.
  const course = await prisma.course.upsert({
    where: { slug: "bridge-fundamentals" },
    update: {},
    create: {
      slug: "bridge-fundamentals",
      title: "Bridge Fundamentals",
      description: "Seeded development content: the bridge course graph.",
      position: 0,
      isSeed: true,
    },
  });

  for (const [index, ep] of mockEpisodes.entries()) {
    const episode = await prisma.episode.upsert({
      where: { id: ep.id },
      update: {},
      create: {
        id: ep.id,
        courseId: course.id,
        title: ep.title,
        description: ep.description,
        position: index,
        isSeed: true,
      },
    });

    for (const [lessonIndex, lesson] of mockLessons.entries()) {
      if (lesson.episodeId !== ep.id) continue;
      await prisma.lesson.upsert({
        where: { id: lesson.id },
        update: {},
        create: {
          id: lesson.id,
          courseId: course.id,
          episodeId: episode.id,
          title: lesson.title,
          description: lesson.description,
          category: lesson.category,
          subcategory: lesson.subcategory,
          duration: lesson.duration,
          xpReward: lesson.xpReward,
          position: lessonIndex,
          content: toJson(lesson.content),
          isSeed: true,
        },
      });
    }
  }

  // Any lesson without an episode still needs a course link.
  for (const [lessonIndex, lesson] of mockLessons.entries()) {
    if (lesson.episodeId) continue;
    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: {},
      create: {
        id: lesson.id,
        courseId: course.id,
        title: lesson.title,
        description: lesson.description,
        category: lesson.category,
        subcategory: lesson.subcategory,
        duration: lesson.duration,
        xpReward: lesson.xpReward,
        position: lessonIndex,
        content: toJson(lesson.content),
        isSeed: true,
      },
    });
  }
}

async function seedQuizzes() {
  const quiz = await prisma.quiz.upsert({
    where: { id: "seed-quiz-bidding" },
    update: {},
    create: {
      id: "seed-quiz-bidding",
      title: "Bidding Quiz",
      description: "Seeded development quiz covering openings, shape and balanced hands.",
      category: "bidding",
      isSeed: true,
    },
  });

  for (const [index, q] of mockQuizQuestions.entries()) {
    const type = q.type as "single" | "multiple";
    const supportsScoring = type === "single" || type === "multiple";
    await prisma.quizQuestion.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        quizId: quiz.id,
        type: q.type,
        question: q.question,
        options: JSON.stringify(q.options ?? []),
        correctIndex: supportsScoring ? (q.correctIndex ?? null) : null,
        correctIndices: supportsScoring ? (q.correctIndices ?? []) : [],
        correctCards: (q as { correctCards?: string[] }).correctCards ?? [],
        explanation: q.explanation ?? "",
        xpReward: q.xpReward ?? 20,
        position: index,
      },
    });
  }
}

async function seedAchievements() {
  for (const a of mockAchievements) {
    const category = ACHIEVEMENT_CATEGORY[a.category] ?? "milestone";
    await prisma.achievement.upsert({
      where: { id: a.id },
      // Seed rows are authoritative for static definitions, so re-seeding also
      // repairs a wrong metric/threshold from an earlier seed version.
      update: {
        title: a.title,
        description: a.description,
        icon: a.icon,
        category: category as never,
        xpReward: a.xpReward,
        metric: ACHIEVEMENT_METRIC[a.category] ?? "lessonsCompleted",
        threshold: a.maxProgress,
      },
      create: {
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        category: category as never,
        xpReward: a.xpReward,
        // Tracked metric drives the progression engine (58.3.5).
        metric: ACHIEVEMENT_METRIC[a.category] ?? "lessonsCompleted",
        threshold: a.maxProgress,
        isSeed: true,
      },
    });
  }
}

async function seedMissions() {
  for (const m of mockMissions) {
    await prisma.mission.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        title: m.title,
        description: m.description,
        type: MISSION_TYPE[m.type] ?? "daily",
        category: m.category,
        // Missions are counted in completed lessons unless stated otherwise.
        metric: "lessonsCompleted",
        target: m.maxProgress,
        xpReward: m.xpReward,
        icon: m.icon,
        isSeed: true,
      },
    });
  }
}

/**
 * A sample hand + structured auction so Sprint 58 persistence work has real
 * bridge data to replay through the AuctionStateMachine.
 */
async function seedSampleHandAndAuction(userId: string) {
  const hand = await prisma.hand.upsert({
    where: { id: "seed-hand-1" },
    update: {},
    create: {
      id: "seed-hand-1",
      label: "Sample 1NT opening with Stayman",
      dealer: "N",
      vulnerability: "None",
      north: JSON.stringify(["SA", "SK", "S8", "S3", "HA", "HJ", "H5", "DA", "D8", "D3", "CQ", "C5", "C4"]),
      east: JSON.stringify(["S9", "S7", "S6", "H10", "H8", "H4", "H2", "DQ", "DJ", "D9", "D7", "C10", "C6"]),
      south: JSON.stringify(["SQ", "S5", "S2", "HK", "HQ", "H3", "DK", "D6", "D2", "CJ", "C8", "C3", "C2"]),
      west: JSON.stringify(["S10", "S4", "H9", "H7", "H6", "D10", "D5", "D4", "CA", "CK", "C9", "C7", "C6"]),
      isSeed: true,
    },
  });

  // Persisted as STRUCTURED actions, not "1NT P 2C P 2S P 4S P P P".
  // The seats follow the dealer (N) clockwise: N, E, S, W.
  const actions: Array<{
    sequence: number;
    player: "N" | "E" | "S" | "W";
    type: "bid" | "pass";
    level: number | null;
    strain: "C" | "D" | "H" | "S" | "NT" | null;
  }> = [
    { sequence: 0, player: "N", type: "bid", level: 1, strain: "NT" },
    { sequence: 1, player: "E", type: "pass", level: null, strain: null },
    { sequence: 2, player: "S", type: "bid", level: 2, strain: "C" },
    { sequence: 3, player: "W", type: "pass", level: null, strain: null },
    { sequence: 4, player: "N", type: "bid", level: 2, strain: "S" },
    { sequence: 5, player: "E", type: "pass", level: null, strain: null },
    { sequence: 6, player: "S", type: "bid", level: 4, strain: "S" },
    { sequence: 7, player: "W", type: "pass", level: null, strain: null },
    { sequence: 8, player: "N", type: "pass", level: null, strain: null },
    { sequence: 9, player: "E", type: "pass", level: null, strain: null },
  ];

  await prisma.auction.upsert({
    where: { id: "seed-auction-1" },
    update: {},
    create: {
      id: "seed-auction-1",
      userId,
      handId: hand.id,
      dealer: "N",
      vulnerability: "None",
      finalLevel: 4,
      finalStrain: "S",
      finalDoubled: false,
      finalRedoubled: false,
      declarer: "N",
      passedOut: false,
      isComplete: true,
      startedAt: SEED_JOINED_AT,
      completedAt: SEED_JOINED_AT,
      actions: {
        create: actions.map((a) => ({ ...a, engineLegal: true })),
      },
    },
  });
}

async function main() {
  console.log("Seeding Bridge Coach development data...");

  const user = await seedUser();
  console.log(`  user            ${user.email} (${user.id})`);

  await seedCoursesAndLessons();
  console.log(`  lessons         ${mockLessons.length} across ${mockEpisodes.length} episodes`);

  await seedQuizzes();
  console.log(`  quiz questions  ${mockQuizQuestions.length}`);

  await seedAchievements();
  console.log(`  achievements    ${mockAchievements.length}`);

  await seedMissions();
  console.log(`  missions        ${mockMissions.length}`);

  await seedSampleHandAndAuction(user.id);
  console.log("  sample hand     seed-hand-1 + seed-auction-1 (10 structured actions)");

  console.log("\nSeed complete. Sign in as the development identity:");
  console.log(`  DEV_USER_EMAIL=${DEV_USER_EMAIL}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
