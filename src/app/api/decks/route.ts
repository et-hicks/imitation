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

  const { rows } = await pool.query(
    `SELECT
       d.id,
       d.name,
       d.description,
       COUNT(c.id)::int                                                             AS card_count,
       COUNT(c.id) FILTER (WHERE sq.id IS NULL)::int                               AS new_count,
       COUNT(c.id) FILTER (WHERE sq.id IS NOT NULL AND sq.next_review_at <= NOW())::int AS learning_count,
       COUNT(c.id) FILTER (WHERE sq.id IS NOT NULL AND sq.next_review_at > NOW())::int  AS reviewed_count
     FROM decks d
     LEFT JOIN cards c ON c.deck_id = d.id
     LEFT JOIN study_queue sq ON sq.card_id = c.id AND sq.user_id = $2
     WHERE d.user_id = $1
     GROUP BY d.id, d.name, d.description, d.updated_at
     ORDER BY d.updated_at DESC`,
    [user.id, user.id]
  );

  return jsonResponse(rows);
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
