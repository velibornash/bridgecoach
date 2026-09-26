import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { parse as parseEnv } from "dotenv";

/**
 * Integration tests talk to a real PostgreSQL instance (Sprint 58). Vite only
 * exposes VITE_-prefixed .env values, so the database connection has to be put
 * into process.env explicitly.
 *
 * Only the database keys are loaded, deliberately. tests/unit/ai/gateway.test.ts
 * depends on the AI provider env being absent, so importing the whole .env here
 * would break Sprint 57's AI gateway suite.
 */
const DB_ENV_KEYS = ["DATABASE_URL", "DEV_USER_EMAIL"] as const;

if (existsSync(".env")) {
  const fileEnv = parseEnv(readFileSync(".env"));
  for (const key of DB_ENV_KEYS) {
    if (fileEnv[key]) process.env[key] = fileEnv[key];
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
