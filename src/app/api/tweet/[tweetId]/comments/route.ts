import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { jsonResponse, corsOptions } from "@/lib/api-helpers";

type Params = { params: Promise<{ tweetId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { tweetId } = await params;

  // Verify parent tweet exists
  const parent = await pool.query(
    "SELECT id FROM tweets WHERE id = $1",
    [tweetId]
  );
  if (parent.rows.length === 0) {
    return jsonResponse({ detail: "Tweet not found" }, { status: 404 });
  }

  const result = await pool.query(
    `SELECT t.body, t.likes, t.replies,
            u.username, u.profile_url
     FROM tweets t
     LEFT JOIN users u ON u.id = t.user_id
     WHERE t.parent_tweet_id = $1 AND t.is_comment = true
     ORDER BY t.created_at ASC`,
    [tweetId]
  );

  const comments = result.rows.map((row) => ({
    userId: row.username || null,
    profileName: row.username || null,
    body: row.body,
    likes: row.likes,
    replies: row.replies,
    profileUrl: row.profile_url || null,
  }));

  return jsonResponse(comments);
}

export async function OPTIONS() {
  return corsOptions();
}
