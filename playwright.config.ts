import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

/**
 * Browser tests (Sprint 60 follow-up).
 *
 * ## These run against the TEST database, not the development one
 *
 * Until now the E2E suite shared `bridgecoach` with local development, so
 * `persistence-journey.spec.ts` — which completes lessons and changes XP — was
 * mutating the owner's real progression every time it ran. The documentation
 * claimed test isolation; only the Vitest half of it was true.
 *
 * The URL is resolved by the same module Vitest uses, so there is one answer to
 * "which database is the test database" rather than two that can drift. If it
 * cannot be resolved the suite **fails** rather than falling back to development:
 * a browser test that quietly runs against real data is worse than no test,
 * because it destroys data and reports success.
 */
// Playwright loads this config as CommonJS, so `import.meta.url` is unavailable.
// `__filename` is the equivalent here, and the createRequire wrapper keeps the
// project's no-require-imports lint rule satisfied.
const require = createRequire(__filename);
const { resolveTestDatabaseUrl } = require("./scripts/test-db.mjs") as {
  resolveTestDatabaseUrl: () => string | undefined;
};

const testDatabaseUrl = resolveTestDatabaseUrl();

if (!testDatabaseUrl) {
  throw new Error(
    "Could not resolve the test database URL for Playwright.\n" +
      "Set TEST_DATABASE_URL, put DATABASE_URL in .env.test, or make sure .env has a\n" +
      "DATABASE_URL whose name can be suffixed with _test. Refusing to run browser\n" +
      "tests against the development database: they would destroy real data and\n" +
      "still report success.",
  );
}

const isCi = !!process.env.CI;

export default defineConfig({
  testDir: "tests/e2e",
  // Serial by design. Two specs act as the same seeded development account —
  // one completes lessons, the other asserts on that account's progression — so
  // running them in parallel means the order decides the result. globalSetup
  // resets the database, which makes the sequential run reproducible.
  fullyParallel: false,
  workers: 1,
  globalSetup: "./tests/e2e/global-setup.ts",
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  reporter: isCi ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // The dev server is started with the test database already exported, so the
    // app under test points at it for the whole run.
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      // The E2E journey acts as the seeded user without signing in, so the
      // browser suite does not need a session cookie for every test.
      ALLOW_DEV_IDENTITY: "true",
      DEV_USER_EMAIL:
        (existsSync(".env.test")
          ? /DEV_USER_EMAIL="?([^"\n]+)"?/.exec(readFileSync(".env.test", "utf8"))?.[1]
          : undefined) ??
        /DEV_USER_EMAIL="?([^"\n]+)"?/.exec(readFileSync(".env", "utf8"))?.[1] ??
        "dev@bridgecoach.local",
    },
  },
});
