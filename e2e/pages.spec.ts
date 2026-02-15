import { test, expect } from "@playwright/test";

/**
 * E2E tests for page rendering.
 * Verifies that pages load and basic UI elements are present.
 */

test.describe("Page Navigation", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.*/, { timeout: 10_000 });
  });

  test("twitter page loads and shows feed", async ({ page }) => {
    await page.goto("/twitter");
    // The tweet composer should be present
    await expect(
      page.getByPlaceholder("What's happening?")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("flashcards page loads", async ({ page }) => {
    await page.goto("/flashcards");
    // Should show login prompt since we're not authenticated
    await expect(page.getByText("Flashcards")).toBeVisible({ timeout: 10_000 });
  });

  test("flashcards page shows login prompt when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/flashcards");
    await expect(
      page.getByText("Please log in to access your flashcards")
    ).toBeVisible({ timeout: 10_000 });
  });
});
