import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { jsonResponse, corsOptions } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50") || 50, 1), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0") || 0, 0);

  const result = await pool.query(
    `SELECT t.id, t.body, t.likes, t.replies, t.restacks, t.saves,
            u.username, u.profile_url
     FROM tweets t
     LEFT JOIN users u ON u.id = t.user_id
     WHERE t.is_comment = false
     ORDER BY t.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const tweets = result.rows.map((row) => ({
    id: row.id,
    body: row.body,
    likes: row.likes,
    replies: row.replies,
    restacks: row.restacks,
    saves: row.saves,
    userId: row.username || "unknown",
    profileName: row.username || "Unknown User",
    profileUrl: row.profile_url || null,
  }));

  return jsonResponse(tweets);
}

export async function OPTIONS() {
  return corsOptions();
}
