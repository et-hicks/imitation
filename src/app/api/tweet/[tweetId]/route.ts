import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { jsonResponse, corsOptions } from "@/lib/api-helpers";

type Params = { params: Promise<{ tweetId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { tweetId } = await params;

  const result = await pool.query(
    `SELECT t.id, t.body, t.likes, t.replies, t.restacks, t.saves,
            t.is_comment, t.parent_tweet_id,
            u.username, u.profile_url
     FROM tweets t
     LEFT JOIN users u ON u.id = t.user_id
     WHERE t.id = $1`,
    [tweetId]
  );

  if (result.rows.length === 0) {
    return jsonResponse({ detail: "Tweet not found" }, { status: 404 });
  }

  const row = result.rows[0];
  return jsonResponse({
    id: row.id,
    body: row.body,
    likes: row.likes,
    replies: row.replies,
    restacks: row.restacks,
    saves: row.saves,
    userId: row.username || "unknown",
    profileName: row.username || "Unknown User",
    profileUrl: row.profile_url || null,
    is_comment: row.is_comment,
    parent_tweet_id: row.parent_tweet_id,
  });
}

export async function OPTIONS() {
  return corsOptions();
}
