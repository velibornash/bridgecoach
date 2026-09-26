/**
 * Playwright global setup (Sprint 60 follow-up).
 *
 * Re-migrates and re-seeds the test database before the browser suite runs.
 *
 * Without this the suite is not reproducible: `persistence-journey.spec.ts`
 * completes lessons and moves XP, and `dashboard-real-data.spec.ts` asserts on
 * the same seeded account. Whichever ran first decided the outcome, which is
 * the flakiness Sprint 58 already hit once — except that isolating the database
 * did not solve it, because two browser specs still share one user.
 *
 * The alternative, giving each spec its own user, would mean every assertion
 * about "the development account" becomes "the account this spec created", which
 * is a large rewrite of tests whose whole point is that they exercise the real
 * development identity.
 *
 * So: one worker, serial, with the seed re-applied first. Reproducible beats
 * parallel, and non-destructive beats reproducible.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

// Resolved from the repository root, not this file's directory: a relative
// require resolves against the requiring module, and this file lives in
// tests/e2e/.
const require = createRequire(`${__dirname}/../../package.json`);
const { resolveTestDatabaseUrl } = require("./scripts/test-db.mjs") as {
  resolveTestDatabaseUrl: () => string | undefined;
};

function devUserEmail(): string {
  const read = (path: string) =>
    existsSync(path)
      ? /DEV_USER_EMAIL="?([^"\n]+)"?/.exec(readFileSync(path, "utf8"))?.[1]
      : undefined;
  return read(".env.test") ?? read(".env") ?? "dev@bridgecoach.local";
}

export default function globalSetup(): void {
  const databaseUrl = resolveTestDatabaseUrl();
  if (!databaseUrl) {
    throw new Error(
      "Cannot resolve the test database URL. Refusing to run browser tests against " +
        "the development database.",
    );
  }

  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DEV_USER_EMAIL: devUserEmail(),
    ALLOW_DEV_IDENTITY: "true",
  };

  const run = (args: string[]) =>
    execFileSync("npx", args, {
      stdio: "inherit",
      env,
      // `prisma` and `prisma db seed` are separate binaries, so each needs its
      // own invocation rather than a chained shell command.
      shell: false,
    });

  if (!/_test(\?|$)/.test(databaseUrl)) {
    throw new Error(
      `Refusing to prepare "${databaseUrl}": the browser suite may only prepare a ` +
        "database whose name ends in _test.",
    );
  }

  // `migrate deploy`, not `migrate reset`. Reset drops and recreates the schema,
  // which is irreversible, and Prisma blocks AI agents from invoking it without
  // explicit human consent. Deploy plus the seed is non-destructive and
  // idempotent, and it is enough: determinism here comes from the specs running
  // serially against one account, not from an empty database.
  console.log(`\n[playwright] preparing test database for a reproducible run\n`);
  run(["prisma", "migrate", "deploy"]);
  run(["prisma", "db", "seed"]);

  console.log(`[playwright] test database ready\n`);
}
