import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  getOrCreateUser,
  jsonResponse,
  corsOptions,
} from "@/lib/api-helpers";

type Params = { params: Promise<{ deckId: string }> };

async function getDeckCounts(deckId: number, userId: number) {
  const cardCount = await pool.query(
    "SELECT COUNT(*)::int AS count FROM cards WHERE deck_id = $1",
    [deckId]
  );

  // Only count cards as "due" if next_review_at <= NOW()
  const counts = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE sq.next_review_at <= NOW())::int AS due_count,
       COUNT(*)::int AS tracked_count
     FROM study_queue sq
     JOIN cards c ON c.id = sq.card_id
     WHERE c.deck_id = $1 AND sq.user_id = $2`,
    [deckId, userId]
  );

  const total = cardCount.rows[0].count;
  const tracked = counts.rows[0]?.tracked_count || 0;
  const dueFromQueue = counts.rows[0]?.due_count || 0;

  const statusCounts: Record<string, number> = {
    new: total - tracked,
    learning: dueFromQueue,
    reviewed: tracked - dueFromQueue,
  };

  return { total, statusCounts };
}

export async function GET(request: NextRequest, { params }: Params) {
  const { deckId } = await params;
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);
  const result = await pool.query(
    "SELECT * FROM decks WHERE id = $1 AND user_id = $2",
    [deckId, user.id]
  );

  if (result.rows.length === 0) {
    return jsonResponse({ detail: "Deck not found" }, { status: 404 });
  }

  const deck = result.rows[0];
  const { total, statusCounts } = await getDeckCounts(deck.id, user.id);

  return jsonResponse({
    id: deck.id,
    user_id: deck.user_id,
    name: deck.name,
    description: deck.description,
    created_at: deck.created_at,
    updated_at: deck.updated_at,
    card_count: total,
    new_count: statusCounts.new,
    learning_count: statusCounts.learning,
    reviewed_count: statusCounts.reviewed,
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { deckId } = await params;
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);
  const existing = await pool.query(
    "SELECT * FROM decks WHERE id = $1 AND user_id = $2",
    [deckId, user.id]
  );

  if (existing.rows.length === 0) {
    return jsonResponse({ detail: "Deck not found" }, { status: 404 });
  }

  const body = await request.json();
  const deck = existing.rows[0];
  const name = body.name ?? deck.name;
  const description = body.description ?? deck.description;

  const updated = await pool.query(
    `UPDATE decks SET name = $1, description = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [name, description, deckId]
  );

  const updatedDeck = updated.rows[0];
  const { total, statusCounts } = await getDeckCounts(
    updatedDeck.id,
    user.id
  );

  return jsonResponse({
    id: updatedDeck.id,
    user_id: updatedDeck.user_id,
    name: updatedDeck.name,
    description: updatedDeck.description,
    created_at: updatedDeck.created_at,
    updated_at: updatedDeck.updated_at,
    card_count: total,
    new_count: statusCounts.new,
    learning_count: statusCounts.learning,
    reviewed_count: statusCounts.reviewed,
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { deckId } = await params;
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);
  const result = await pool.query(
    "DELETE FROM decks WHERE id = $1 AND user_id = $2 RETURNING id",
    [deckId, user.id]
  );

  if (result.rows.length === 0) {
    return jsonResponse({ detail: "Deck not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}

export async function OPTIONS() {
  return corsOptions();
}
