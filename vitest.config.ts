import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { resolveTestDatabaseUrl, readEnvFile } from "./scripts/test-db.mjs";

/**
 * Integration tests talk to a real PostgreSQL instance (Sprint 58).
 *
 * They run against a SEPARATE database from the development one. Sharing a
 * database meant parallel test files wrote to the same development user, which
 * produced genuinely flaky assertions — one E2E check had to become an
 * `expect.poll` because the persistence journey changed XP mid-assertion. An
 * isolated database removes that entire class of problem.
 *
 * Resolution order:
 *  1. TEST_DATABASE_URL, if set (CI).
 *  2. DATABASE_URL in `.env.test`, if present.
 *  3. The dev DATABASE_URL with the database name swapped to `*_test`.
 *  4. Fall back to the dev database, with a loud warning.
 */
const DB_ENV_KEYS = ["DATABASE_URL", "DEV_USER_EMAIL", "ALLOW_DEV_IDENTITY"] as const;

// Shared with the `db:test:setup` npm script so the two can never disagree about
// which database is the test database.
const testDatabaseUrl = resolveTestDatabaseUrl();
if (!testDatabaseUrl && existsSync(".env")) {
  console.warn(
    "[vitest] Could not derive a test database URL. Tests will run against the " +
      "DEVELOPMENT database, which means they can interfere with local data.",
  );
}
if (testDatabaseUrl) {
  process.env.DATABASE_URL = testDatabaseUrl;
}

/**
 * The test suite acts as the development identity when invoking route handlers
 * directly (there is no request scope, hence no session cookie). The isolation
 * tests in auth-sessions.test.ts create their own users and assert ownership
 * explicitly, so this fallback cannot mask a real ownership bug.
 *
 * Only ever set here, in the test runner — never in the application.
 */
process.env.ALLOW_DEV_IDENTITY = "true";

/**
 * Only the database keys are loaded from `.env`. AI provider variables are
 * deliberately NOT loaded: tests/unit/ai/gateway.test.ts depends on the AI
 * provider env being absent, so importing the whole file would break it.
 */
if (existsSync(".env")) {
  const devEnv: Record<string, string> = readEnvFile(".env");
  for (const key of DB_ENV_KEYS) {
    if (devEnv[key] && key !== "DATABASE_URL") {
      process.env[key] = devEnv[key];
    }
  }
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/helpers/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    globals: false,
    css: false,

    /**
     * Test FILES run one at a time, not in parallel.
     *
     * Every integration file talks to the same PostgreSQL database. Separate
     * databases per file would fix this properly, but that means N databases and
     * N migration runs in CI, and the suite has one service container.
     *
     * Serial execution is the cheaper correct answer. It also removes a class of
     * failure that is genuinely hard to debug: a file's `afterAll` deleting a
     * user cascades rows another file is mid-assertion on, and the symptom shows
     * up in a file that did nothing wrong. That produced intermittent failures
     * here — a bookmark test failing because an unrelated file cleaned up.
     *
     * `tests/unit/**` is unaffected in practice; it is already fast, and the
     * ordering cost is negligible at this suite size.
     */
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/bridge/**", "src/services/**", "src/components/bridge/**", "src/components/cardEngine/**", "src/components/replayEngine/**"],
    },
  },
});
