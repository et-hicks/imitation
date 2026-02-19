import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  getOrCreateUser,
  jsonResponse,
  corsOptions,
} from "@/lib/api-helpers";

type Params = { params: Promise<{ cardId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { cardId } = await params;
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);

  // Get card and verify ownership
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

  const body = await request.json();
  const { remind_value, remind_unit } = body;

  // Validate remind_value is a positive integer within bounds
  const parsedValue = Number(remind_value);
  if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 365) {
    return jsonResponse({ detail: "remind_value must be an integer between 1 and 365" }, { status: 400 });
  }

  // Validate remind_unit is one of the allowed values
  const intervalMap: Record<string, string> = {
    min: "minutes",
    hr: "hours",
    day: "days",
  };
  const intervalUnit = intervalMap[remind_unit];
  if (!intervalUnit) {
    return jsonResponse({ detail: "remind_unit must be min, hr, or day" }, { status: 400 });
  }

  // Check for existing study queue entry
  const existing = await pool.query(
    "SELECT * FROM study_queue WHERE card_id = $1 AND user_id = $2",
    [cardId, user.id]
  );

  let study;
  if (existing.rows.length > 0) {
    const newCount = existing.rows[0].review_count + 1;
    const newStatus = newCount < 3 ? "learning" : "reviewed";

    const updated = await pool.query(
      `UPDATE study_queue
       SET status = $1,
           next_review_at = NOW() + ($2 || ' ' || $3)::interval,
           last_reviewed_at = NOW(),
           review_count = $4
       WHERE card_id = $5 AND user_id = $6
       RETURNING *`,
      [newStatus, remind_value.toString(), intervalUnit, newCount, cardId, user.id]
    );
    study = updated.rows[0];
  } else {
    const inserted = await pool.query(
      `INSERT INTO study_queue (card_id, user_id, status, next_review_at, last_reviewed_at, review_count)
       VALUES ($1, $2, 'learning', NOW() + ($3 || ' ' || $4)::interval, NOW(), 1)
       RETURNING *`,
      [cardId, user.id, remind_value.toString(), intervalUnit]
    );
    study = inserted.rows[0];
  }

  return jsonResponse({
    card_id: parseInt(cardId as string),
    status: study.status,
    next_review_at: study.next_review_at,
    review_count: study.review_count,
  });
}

export async function OPTIONS() {
  return corsOptions();
}
