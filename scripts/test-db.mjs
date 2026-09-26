/**
 * Resolves the URL of the test database.
 *
 * This lives in its own module because two callers need the exact same answer
 * and had drifted apart: `vitest.config.ts` derived the URL, while the
 * `db:test:setup` npm script read an unset `TEST_DATABASE_URL` and therefore ran
 * migrations against an empty URL. The tests then failed on missing seed data
 * and the cause was nowhere near the script. One implementation, one answer.
 *
 * Plain CommonJS with no build step, so `node` can run it directly from a script.
 */
import { existsSync, readFileSync } from "node:fs";
import { parse as parseEnv } from "dotenv";

/** Minimal `.env` reader. Handles `KEY=value`, quotes, and `#` comments. */
function parse(text) {
  const result = {};
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

export function readEnvFile(path) {
  if (!existsSync(path)) return {};
  return parse(readFileSync(path, "utf8"));
}

export function resolveTestDatabaseUrl() {
  // 1. Explicit, for CI.
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;

  // 2. A dedicated file.
  const testEnv = readEnvFile(".env.test");
  if (testEnv.DATABASE_URL) return testEnv.DATABASE_URL;
  if (testEnv.TEST_DATABASE_URL) return testEnv.TEST_DATABASE_URL;

  // 3. Derive from development by swapping the database name.
  const devUrl = readEnvFile(".env").DATABASE_URL ?? process.env.DATABASE_URL;
  if (devUrl) {
    const swapped = devUrl.replace(/\/([^/?]+)(\?|$)/, "/$1_test$2");
    if (swapped !== devUrl) return swapped;
  }
  return undefined;
}

