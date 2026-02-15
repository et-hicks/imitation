import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  getOrCreateUser,
  jsonResponse,
  corsOptions,
} from "@/lib/api-helpers";

type Params = { params: Promise<{ userId: string }> };

export async function POST(request: NextRequest, { params: _params }: Params) {
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);
  const body = await request.json();
  const { body: tweetBody, is_comment = false, parent_tweet_id = null } = body;

  // If comment, verify parent exists and increment reply count
  if (is_comment && parent_tweet_id) {
    const parent = await pool.query(
      "SELECT id FROM tweets WHERE id = $1",
      [parent_tweet_id]
    );
    if (parent.rows.length === 0) {
      return jsonResponse(
        { detail: "Parent tweet not found" },
        { status: 404 }
      );
    }
    await pool.query(
      "UPDATE tweets SET replies = replies + 1 WHERE id = $1",
      [parent_tweet_id]
    );
  }

  const result = await pool.query(
    `INSERT INTO tweets (body, is_comment, parent_tweet_id, user_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [tweetBody, is_comment, parent_tweet_id, user.id]
  );

  const tweet = result.rows[0];
  return jsonResponse(
    {
      id: tweet.id,
      body: tweet.body,
      likes: tweet.likes,
      replies: tweet.replies,
      restacks: tweet.restacks,
      saves: tweet.saves,
      userId: user.username,
      profileName: user.username,
      profileUrl: user.profile_url,
      is_comment: tweet.is_comment,
      parent_tweet_id: tweet.parent_tweet_id,
    },
    { status: 201 }
  );
}

export async function OPTIONS() {
  return corsOptions();
}
