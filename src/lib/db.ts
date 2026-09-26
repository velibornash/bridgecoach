/**
 * Bridge Coach — database client (Sprint 58 §2).
 *
 * SERVER-ONLY. Import this from route handlers and server code only, never from
 * a client component — it holds the database connection and reads DATABASE_URL.
 *
 * ARCHITECTURAL CONTRACT
 * ----------------------
 *  1. The database stores facts and events. It never implements bridge rules.
 *     Legality, auction state and contract stay in `src/bridge`.
 *  2. Every private row is owned by a `userId`. `resolveUserId()` below is the
 *     single place ownership is determined.
 *  3. DEVELOPMENT IDENTITY IS A TEMPORARY STAND-IN (Sprint 58 §27).
 *     `DEV_USER_EMAIL` selects a user from the database. Sprint 59 replaces
 *     this function with real session resolution; nothing else in the codebase
 *     needs to change, because all ownership flows through here.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { unauthorized } from "@/lib/errors";

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and point it at your PostgreSQL instance.",
    );
  }
  return url;
}

/**
 * Prisma 7 talks to PostgreSQL through an explicit driver adapter rather than a
 * bundled engine, which keeps the connection pool under our control.
 */
function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: connectionString() });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

/**
 * Cached on `globalThis` so Next.js hot reload in development does not open a
 * new connection pool on every request.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * The development identity.
 *
 * `DEV_USER_EMAIL` names the account used for local work. It is a SEED value,
 * not an architecture: production refuses to resolve it (see `resolveUserId`).
 * Set it in `.env` to whichever account you want to develop against.
 */
export const DEV_USER_EMAIL =
  process.env.DEV_USER_EMAIL ?? "dev@bridgecoach.local";

/** True when the development identity escape hatch is permitted. */
function devIdentityAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ALLOW_DEV_IDENTITY === "true";
}

/**
 * Resolves the owner for private records. THE SINGLE OWNERSHIP SEAM.
 *
 * Sprint 58 predicted that replacing this one function would be the whole of
 * authentication, and that is what happened: no route or service needed changing.
 *
 * Order:
 *  1. A real signed-in session wins, always — including in development.
 *  2. Outside production, the development identity is a fallback so local work
 *     does not require signing in on every request.
 *  3. In production the development identity is refused outright, and an
 *     unauthenticated request is an error rather than a silent fallback.
 */
export async function resolveUserId(): Promise<string> {
  // 1. Real session.
  const { getSessionUser } = await import("@/lib/session");
  const sessionUser = await getSessionUser();
  if (sessionUser) return sessionUser.id;

  // 2. Development fallback.
  if (devIdentityAllowed()) {
    const user = await prisma.user.findUnique({
      where: { email: DEV_USER_EMAIL },
      select: { id: true },
    });
    if (!user) {
      throw new Error(
        `Development user "${DEV_USER_EMAIL}" does not exist. ` +
          `Run \`npm run db:seed\` to create it, or set DEV_USER_EMAIL to a seeded user.`,
      );
    }
    return user.id;
  }

  // 3. No session, no development fallback: the caller is not authenticated.
  throw unauthorized();
}
