import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  getOrCreateUser,
  jsonResponse,
  corsOptions,
} from "@/lib/api-helpers";

type Params = { params: Promise<{ deckId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { deckId } = await params;
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);

  // Verify user owns deck
  const deck = await pool.query(
    "SELECT id FROM decks WHERE id = $1 AND user_id = $2",
    [deckId, user.id]
  );
  if (deck.rows.length === 0) {
    return jsonResponse({ detail: "Deck not found" }, { status: 404 });
  }

  const cards = await pool.query(
    `SELECT c.id, c.deck_id, c.front, c.back, c.created_at, c.updated_at,
            sq.status, sq.next_review_at
     FROM cards c
     LEFT JOIN study_queue sq ON sq.card_id = c.id AND sq.user_id = $2
     WHERE c.deck_id = $1
     ORDER BY c.created_at`,
    [deckId, user.id]
  );

  const result = cards.rows.map((card) => ({
    id: card.id,
    deck_id: card.deck_id,
    front: card.front,
    back: card.back,
    created_at: card.created_at,
    updated_at: card.updated_at,
    status: card.status || "new",
    next_review_at: card.next_review_at || null,
  }));

  return jsonResponse(result);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { deckId } = await params;
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);

  // Verify user owns deck
  const deck = await pool.query(
    "SELECT id FROM decks WHERE id = $1 AND user_id = $2",
    [deckId, user.id]
  );
  if (deck.rows.length === 0) {
    return jsonResponse({ detail: "Deck not found" }, { status: 404 });
  }

  const body = await request.json();
  const result = await pool.query(
    `INSERT INTO cards (deck_id, front, back)
     VALUES ($1, $2, $3) RETURNING *`,
    [deckId, body.front, body.back]
  );

  const card = result.rows[0];
  return jsonResponse(
    {
      id: card.id,
      deck_id: card.deck_id,
      front: card.front,
      back: card.back,
      created_at: card.created_at,
      updated_at: card.updated_at,
      status: "new",
      next_review_at: null,
    },
    { status: 201 }
  );
}

export async function OPTIONS() {
  return corsOptions();
}
