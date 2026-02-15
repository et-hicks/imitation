import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Next.js API routes.
 * These run against the dev server and verify the full stack
 * (Next.js -> API route -> PostgreSQL -> response).
 */

test.describe("API Health", () => {
  test("GET /api/health returns healthy", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.status).toBe("healthy");
  });
});

test.describe("Tweets API", () => {
  test("GET /api/home returns tweet list", async ({ request }) => {
    const response = await request.get("/api/home");
    expect(response.ok()).toBe(true);
    const tweets = await response.json();
    expect(Array.isArray(tweets)).toBe(true);
  });

  test("GET /api/home tweets have correct shape", async ({ request }) => {
    const response = await request.get("/api/home");
    const tweets = await response.json();
    if (tweets.length > 0) {
      const tweet = tweets[0];
      expect(tweet).toHaveProperty("body");
      expect(tweet).toHaveProperty("likes");
      expect(tweet).toHaveProperty("replies");
      expect(tweet).toHaveProperty("userId");
      expect(tweet).toHaveProperty("profileName");
    }
  });

  test("GET /api/tweet/:id returns 404 for missing tweet", async ({
    request,
  }) => {
    const response = await request.get("/api/tweet/99999");
    expect(response.status()).toBe(404);
  });

  test("POST /api/create-tweet requires auth", async ({ request }) => {
    const response = await request.post("/api/create-tweet/user/1", {
      data: { body: "test", is_comment: false, parent_tweet_id: null },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe("Users API", () => {
  test("GET /api/user/:id returns 404 for missing user", async ({
    request,
  }) => {
    const response = await request.get("/api/user/99999");
    expect(response.status()).toBe(404);
  });
});

test.describe("Flashcard API", () => {
  test("GET /api/decks requires auth", async ({ request }) => {
    const response = await request.get("/api/decks");
    expect(response.status()).toBe(401);
  });

  test("POST /api/decks requires auth", async ({ request }) => {
    const response = await request.post("/api/decks", {
      data: { name: "Test", description: "Test deck" },
    });
    expect(response.status()).toBe(401);
  });

  test("POST /api/cards/:id/review requires auth", async ({ request }) => {
    const response = await request.post("/api/cards/1/review", {
      data: { remind_value: 1, remind_unit: "day" },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe("CORS Headers", () => {
  test("OPTIONS /api/home returns CORS headers", async ({ request }) => {
    const response = await request.fetch("/api/home", { method: "OPTIONS" });
    expect([200, 204]).toContain(response.status());
    expect(response.headers()["access-control-allow-origin"]).toBeDefined();
  });

  test("GET responses include CORS headers", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.headers()["access-control-allow-origin"]).toBeDefined();
  });
});
