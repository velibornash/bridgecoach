#!/usr/bin/env node
/**
 * Prints the test database URL, resolved the same way the test runner resolves
 * it, and fails loudly rather than printing nothing.
 *
 * The empty `Connection url is empty` error from Prisma gave no hint that the
 * npm script was the thing at fault, so the failure mode is stated here.
 */
import { resolveTestDatabaseUrl } from "./test-db.mjs";

const url = resolveTestDatabaseUrl();
if (!url) {
  console.error(
    "Could not resolve a test database URL.\n" +
      "Set TEST_DATABASE_URL, or put DATABASE_URL in .env.test, " +
      "or make sure .env has a DATABASE_URL whose name can be suffixed with _test.",
  );
  process.exit(1);
}
process.stdout.write(url);
