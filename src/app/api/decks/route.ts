import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  getOrCreateUser,
  jsonResponse,
  corsOptions,
} from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);

  const decks = await pool.query(
    `SELECT d.id, d.name, d.description,
            (SELECT COUNT(*) FROM cards c WHERE c.deck_id = d.id)::int AS card_count
     FROM decks d
     WHERE d.user_id = $1
     ORDER BY d.updated_at DESC`,
    [user.id]
  );

  const result = [];
  for (const deck of decks.rows) {
    // Get status counts from study_queue
    const counts = await pool.query(
      `SELECT sq.status, COUNT(*)::int AS count
       FROM study_queue sq
       JOIN cards c ON c.id = sq.card_id
       WHERE c.deck_id = $1 AND sq.user_id = $2
       GROUP BY sq.status`,
      [deck.id, user.id]
    );

    const statusCounts: Record<string, number> = {
      new: 0,
      learning: 0,
      reviewed: 0,
    };
    let tracked = 0;
    for (const row of counts.rows) {
      statusCounts[row.status] = row.count;
      tracked += row.count;
    }
    // Cards not in study queue are "new"
    statusCounts.new = deck.card_count - tracked + statusCounts.new;

    result.push({
      id: deck.id,
      name: deck.name,
      description: deck.description,
      card_count: deck.card_count,
      new_count: statusCounts.new,
      learning_count: statusCounts.learning,
      reviewed_count: statusCounts.reviewed,
    });
  }

  return jsonResponse(result);
}

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);
  const body = await request.json();

  const result = await pool.query(
    `INSERT INTO decks (user_id, name, description)
     VALUES ($1, $2, $3) RETURNING *`,
    [user.id, body.name, body.description || null]
  );

  const deck = result.rows[0];
  return jsonResponse(
    {
      id: deck.id,
      user_id: deck.user_id,
      name: deck.name,
      description: deck.description,
      created_at: deck.created_at,
      updated_at: deck.updated_at,
      card_count: 0,
      new_count: 0,
      learning_count: 0,
      reviewed_count: 0,
    },
    { status: 201 }
  );
}

export async function OPTIONS() {
  return corsOptions();
}
