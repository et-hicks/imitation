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

  // Get ALL cards, ordered by least recently studied first
  const result = await pool.query(
    `SELECT c.id, c.front, c.back,
            COALESCE(sq.status, 'new') AS status,
            COALESCE(sq.review_count, 0) AS review_count
     FROM cards c
     LEFT JOIN study_queue sq ON sq.card_id = c.id AND sq.user_id = $2
     WHERE c.deck_id = $1
     ORDER BY COALESCE(sq.last_reviewed_at, '1970-01-01') ASC`,
    [deckId, user.id]
  );

  const cards = result.rows.map((row) => ({
    id: row.id,
    front: row.front,
    back: row.back,
    status: row.status,
    review_count: row.review_count,
  }));

  return jsonResponse(cards);
}

export async function OPTIONS() {
  return corsOptions();
}
