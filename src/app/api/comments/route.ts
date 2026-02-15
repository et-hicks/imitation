import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { jsonResponse, corsOptions } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tweetIdParam = searchParams.get("tweetId");

  if (!tweetIdParam) {
    return jsonResponse([], { status: 200 });
  }

  // Support PostgREST-style "eq.123" or plain "123"
  const tweetId = tweetIdParam.startsWith("eq.")
    ? tweetIdParam.slice(3)
    : tweetIdParam;

  const parsedId = parseInt(tweetId, 10);
  if (isNaN(parsedId)) {
    return jsonResponse([], { status: 200 });
  }

  const result = await pool.query(
    `SELECT t.id, t.body, t.likes, t.replies,
            u.username, u.profile_url
     FROM tweets t
     LEFT JOIN users u ON u.id = t.user_id
     WHERE t.parent_tweet_id = $1 AND t.is_comment = true
     ORDER BY t.created_at ASC`,
    [parsedId]
  );

  const comments = result.rows.map((row) => ({
    id: row.id,
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
