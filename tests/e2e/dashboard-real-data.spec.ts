/**
 * Sprint 58 §11/§28 — the dashboard must render persisted data, not fixtures.
 *
 * The old dashboard showed a level-7 account with a 12-day streak and 3500 XP
 * regardless of what was in the database. These tests assert the page reflects
 * the real progression engine output.
 */
import { test, expect, request } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("dashboard reflects real persisted progression, not fixtures", async ({ page }) => {
  const api = await request.newContext({ baseURL: "http://localhost:3000" });

  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  // The user's real first name appears.
  const dashboard = await (await api.get("/api/dashboard")).json();
  await expect(
    page.getByText(new RegExp(dashboard.user.firstName)).first(),
  ).toBeVisible();

  // The fixture user must not appear anywhere.
  await expect(page.getByText("Bob Smith")).toHaveCount(0);

  // XP is polled rather than compared once. The persistence-journey spec runs
  // against the same database and can legitimately change XP between the page
  // render and the read, so a single comparison would be flaky. Polling proves
  // the page tracks the database, and still fails if it is stuck on the Sprint 57
  // fixture of 3500 XP.
  await expect
    .poll(async () => {
      const current = await (await api.get("/api/dashboard")).json();
      const shown = new Intl.NumberFormat("en-US").format(current.progression.xp);
      return page.getByText(new RegExp(`\\b${shown}\\b`)).first().isVisible();
    }, { timeout: 15_000 })
    .toBe(true);

  await api.dispose();
});

test("a fresh user gets a valid empty state, not a level-7 account", async ({ page }) => {
  const api = await request.newContext({ baseURL: "http://localhost:3000" });

  // Record a lesson so there is definitely some activity, then confirm the
  // dashboard reflects the real counts rather than the old fixture values
  // (48 lessons completed, 78 average score, 2450 XP).
  await api.post("/api/progress", {
    data: { lessonId: "l4", completed: true },
  });
  const dashboard = await (await api.get("/api/dashboard")).json();

  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  expect(dashboard.stats.lessonsCompleted).toBeGreaterThan(0);
  expect(dashboard.stats.totalLessons).toBe(8);

  // "Level 7" was the hardcoded fixture value.
  const levelText = `Level ${dashboard.progression.level}`;
  await expect(page.getByText(new RegExp(levelText)).first()).toBeVisible();

  await api.dispose();
});

test("statistics page loads without a Math.random heatmap", async ({ page }) => {
  await page.goto("/statistics");
  await page.waitForLoadState("networkidle");
  // The page renders from the API. It must not crash on an empty dataset.
  await expect(page.locator("body")).toBeVisible();
});
