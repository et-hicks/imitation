import { NextRequest } from "next/server";
import pool from "./db";
import type { AuthUser } from "./auth";

/**
 * Get existing user or create new one from Supabase auth.
 */
export async function getOrCreateUser(authUser: AuthUser) {
  const existing = await pool.query(
    "SELECT * FROM users WHERE supabase_uid = $1",
    [authUser.uid]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const username = authUser.email
    ? authUser.email.split("@")[0]
    : `user_${authUser.uid.slice(0, 8)}`;

  const result = await pool.query(
    "INSERT INTO users (username, supabase_uid) VALUES ($1, $2) RETURNING *",
    [username, authUser.uid]
  );

  return result.rows[0];
}

/** Allowed CORS origins. Extensions use moz-extension:// scheme. */
const ALLOWED_ORIGINS = new Set([
  "https://imitation-broken-dawn-9001.fly.dev",
  ...(process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()) || []),
]);

function getAllowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  // Allow Firefox extension origins (moz-extension://*)
  if (origin.startsWith("moz-extension://")) return origin;
  return null;
}

/** Build CORS headers for a given request origin. */
export function getCorsHeaders(origin: string | null) {
  const allowedOrigin = getAllowedOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowedOrigin || "",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...(allowedOrigin ? { Vary: "Origin" } : {}),
  };
}

/** Return a JSON response with CORS headers. */
export function jsonResponse(
  data: unknown,
  init?: ResponseInit,
  request?: NextRequest
) {
  const origin = request?.headers.get("origin") ?? null;
  const cors = getCorsHeaders(origin);
  return Response.json(data, {
    ...init,
    headers: { ...cors, ...init?.headers },
  });
}

/** Return a CORS preflight response. */
export function corsOptions(request?: NextRequest) {
  const origin = request?.headers.get("origin") ?? null;
  return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
}
