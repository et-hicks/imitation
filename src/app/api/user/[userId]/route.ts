import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { jsonResponse, corsOptions } from "@/lib/api-helpers";

type Params = { params: Promise<{ userId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { userId } = await params;

  const result = await pool.query(
    "SELECT id, username, bio, profile_url FROM users WHERE id = $1",
    [userId]
  );

  if (result.rows.length === 0) {
    return jsonResponse({ detail: "User not found" }, { status: 404 });
  }

  const user = result.rows[0];
  return jsonResponse({
    id: user.id,
    username: user.username,
    bio: user.bio,
    profile_url: user.profile_url,
  });
}

export async function OPTIONS() {
  return corsOptions();
}
