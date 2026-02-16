import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  getOrCreateUser,
  jsonResponse,
  corsOptions,
} from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);
  const body = await request.json();
  const { word_length, solution, guesses, statuses, did_win, num_guesses } = body;

  const result = await pool.query(
    `INSERT INTO sevodal_games (user_id, word_length, solution, guesses, statuses, did_win, num_guesses)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [user.id, word_length, solution, JSON.stringify(guesses), JSON.stringify(statuses), did_win, num_guesses]
  );

  return jsonResponse(result.rows[0], { status: 201 });
}

export async function GET() {
  const result = await pool.query(
    `SELECT
       word_length,
       COUNT(*)::int AS total_games,
       COUNT(*) FILTER (WHERE did_win)::int AS wins,
       ROUND(AVG(num_guesses) FILTER (WHERE did_win), 1) AS avg_guesses
     FROM sevodal_games
     GROUP BY word_length
     ORDER BY word_length`
  );

  return jsonResponse(result.rows);
}

export async function OPTIONS() {
  return corsOptions();
}
