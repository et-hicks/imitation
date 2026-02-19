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
    // Get counts - only count cards as "due" if next_review_at <= NOW()
    const counts = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE sq.next_review_at <= NOW())::int AS due_count,
         COUNT(*)::int AS tracked_count
       FROM study_queue sq
       JOIN cards c ON c.id = sq.card_id
       WHERE c.deck_id = $1 AND sq.user_id = $2`,
      [deck.id, user.id]
    );

    const tracked = counts.rows[0]?.tracked_count || 0;
    const dueFromQueue = counts.rows[0]?.due_count || 0;
    const newCount = deck.card_count - tracked;
    const reviewedCount = tracked - dueFromQueue;

    result.push({
      id: deck.id,
      name: deck.name,
      description: deck.description,
      card_count: deck.card_count,
      new_count: newCount,
      learning_count: dueFromQueue,
      reviewed_count: reviewedCount,
    });
  }

  return jsonResponse(result);
}

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);
  const body = await request.json();

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 200) {
    return jsonResponse({ detail: "Deck name is required and must be under 200 characters" }, { status: 400 });
  }
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 1000) : null;

  const result = await pool.query(
    `INSERT INTO decks (user_id, name, description)
     VALUES ($1, $2, $3) RETURNING *`,
    [user.id, name, description || null]
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
