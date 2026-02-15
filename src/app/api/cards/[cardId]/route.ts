import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  getOrCreateUser,
  jsonResponse,
  corsOptions,
} from "@/lib/api-helpers";

type Params = { params: Promise<{ cardId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { cardId } = await params;
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);

  // Get card and verify ownership through deck
  const card = await pool.query(
    `SELECT c.*, d.user_id AS deck_user_id
     FROM cards c
     JOIN decks d ON d.id = c.deck_id
     WHERE c.id = $1`,
    [cardId]
  );

  if (card.rows.length === 0) {
    return jsonResponse({ detail: "Card not found" }, { status: 404 });
  }
  if (card.rows[0].deck_user_id !== user.id) {
    return jsonResponse({ detail: "Not authorized" }, { status: 403 });
  }

  const body = await request.json();
  const front = body.front ?? card.rows[0].front;
  const back = body.back ?? card.rows[0].back;

  const updated = await pool.query(
    `UPDATE cards SET front = $1, back = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [front, back, cardId]
  );

  // Get study status
  const study = await pool.query(
    "SELECT status, next_review_at FROM study_queue WHERE card_id = $1 AND user_id = $2",
    [cardId, user.id]
  );

  const c = updated.rows[0];
  return jsonResponse({
    id: c.id,
    deck_id: c.deck_id,
    front: c.front,
    back: c.back,
    created_at: c.created_at,
    updated_at: c.updated_at,
    status: study.rows[0]?.status || "new",
    next_review_at: study.rows[0]?.next_review_at || null,
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { cardId } = await params;
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);

  // Get card and verify ownership through deck
  const card = await pool.query(
    `SELECT c.id, d.user_id AS deck_user_id
     FROM cards c
     JOIN decks d ON d.id = c.deck_id
     WHERE c.id = $1`,
    [cardId]
  );

  if (card.rows.length === 0) {
    return jsonResponse({ detail: "Card not found" }, { status: 404 });
  }
  if (card.rows[0].deck_user_id !== user.id) {
    return jsonResponse({ detail: "Not authorized" }, { status: 403 });
  }

  await pool.query("DELETE FROM cards WHERE id = $1", [cardId]);
  return new Response(null, { status: 204 });
}

export async function OPTIONS() {
  return corsOptions();
}
