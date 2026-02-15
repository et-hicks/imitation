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

/** CORS headers for browser extension and cross-origin requests. */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/** Return a JSON response with CORS headers. */
export function jsonResponse(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: { ...corsHeaders, ...init?.headers },
  });
}

/** Return a CORS preflight response. */
export function corsOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
