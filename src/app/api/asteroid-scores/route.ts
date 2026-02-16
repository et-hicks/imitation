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
  const { score } = body;
  const playerName = user.username || "ANONYMOUS";

  const result = await pool.query(
    `INSERT INTO asteroid_scores (user_id, player_name, score)
     VALUES ($1, $2, $3) RETURNING *`,
    [user.id, playerName, score]
  );

  return jsonResponse(result.rows[0], { status: 201 });
}

export async function GET() {
  const result = await pool.query(
    `SELECT a.player_name, a.score, a.created_at
     FROM asteroid_scores a
     ORDER BY a.score DESC
     LIMIT 10`
  );

  return jsonResponse(result.rows);
}

export async function OPTIONS() {
  return corsOptions();
}
