import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { parse as parseEnv } from "dotenv";

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

function resolveTestDatabaseUrl(): string | undefined {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;

  if (existsSync(".env.test")) {
    const testEnv = parseEnv(readFileSync(".env.test"));
    if (testEnv.DATABASE_URL) return testEnv.DATABASE_URL;
  }

  if (existsSync(".env")) {
    const devEnv = parseEnv(readFileSync(".env"));
    const devUrl = devEnv.DATABASE_URL;
    if (devUrl) {
      // postgresql://user:pass@host:5432/name?params -> name_test
      const swapped = devUrl.replace(/\/([^/?]+)(\?|$)/, "/$1_test$2");
      if (swapped !== devUrl) return swapped;
    }
  }
  return undefined;
}

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
  const devEnv = parseEnv(readFileSync(".env"));
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
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/bridge/**", "src/services/**", "src/components/bridge/**", "src/components/cardEngine/**", "src/components/replayEngine/**"],
    },
  },
});
