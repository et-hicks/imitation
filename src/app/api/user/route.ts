import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { jsonResponse, corsOptions } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, bio, supabase_uid } = body;

  // Check if username already exists
  const existing = await pool.query(
    "SELECT id FROM users WHERE username = $1",
    [username]
  );
  if (existing.rows.length > 0) {
    return jsonResponse(
      { detail: "Username already taken" },
      { status: 400 }
    );
  }

  const result = await pool.query(
    "INSERT INTO users (username, bio, supabase_uid) VALUES ($1, $2, $3) RETURNING *",
    [username, bio || null, supabase_uid || null]
  );

  const user = result.rows[0];
  return jsonResponse(
    {
      id: user.id,
      username: user.username,
      bio: user.bio,
      profile_url: user.profile_url,
    },
    { status: 201 }
  );
}

export async function OPTIONS() {
  return corsOptions();
}
