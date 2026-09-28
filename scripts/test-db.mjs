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

/**
 * Minimal `.env` reader. Handles `KEY=value`, quotes, and `#` comments.
 *
 * The return type is declared rather than left to inference. `result` starts life
 * as `const result = {}`, so an inferred return type is the empty object type,
 * and `readEnvFile` - which returns either that or `{}` for a missing file -
 * infers `{}` as well. An empty object type has no index signature, so
 * assigning the result to `Record<string, string>` is an error: "Type '{}' is not
 * assignable to type 'Record<string, string>'".
 *
 * Whether that inference is what TypeScript lands on depends on which files the
 * program pulled in, so the same `vitest.config.ts` typechecked locally and failed
 * on a clean CI checkout. The type is now stated, so it cannot vary.
 *
 * @param {string} text
 * @returns {Record<string, string>}
 */
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

/**
 * Read a `.env` file into a plain object.
 *
 * @param {string} path
 * @returns {Record<string, string>} empty when the file does not exist
 */
export function readEnvFile(path) {
  if (!existsSync(path)) return {};
  return parse(readFileSync(path, "utf8"));
}

/**
 * The test database URL, or undefined when none can be worked out.
 *
 * Declared for the same reason as readEnvFile: the answer is used as a string by
 * callers, and leaving the return type to inference makes that depend on which
 * files the program happened to include.
 *
 * @returns {string | undefined}
 */
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

