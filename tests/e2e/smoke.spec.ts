import { test, expect } from "@playwright/test";

test("homepage renders the hero", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1 }).filter({ hasText: "Master Contract Bridge" }),
  ).toBeVisible();
});

test("tactical engine page renders the drill", async ({ page }) => {
  await page.goto("/tactical");
  await expect(
    page.getByRole("heading", { level: 1 }).filter({ hasText: "Bidding Tactical Engine" }),
  ).toBeVisible();
});

test("author studio page renders the builder", async ({ page }) => {
  await page.goto("/author-studio");
  await expect(
    page.getByRole("heading", { level: 1 }).filter({ hasText: "Content Author Studio" }),
  ).toBeVisible();
});
