import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { jsonResponse, corsOptions } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const room = request.nextUrl.searchParams.get("room");
  if (!room) {
    return jsonResponse({ error: "room parameter required" }, { status: 400 });
  }

  const result = await pool.query(
    `SELECT nickname, SUM(points) as total_points, COUNT(*) as rounds_played
     FROM color_game_scores WHERE room_code = $1
     GROUP BY nickname ORDER BY total_points DESC`,
    [room]
  );

  return jsonResponse(result.rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { roomCode, nickname, role, points, guessNumber, targetCell } = body;

  if (!roomCode || !nickname || !role) {
    return jsonResponse(
      { error: "roomCode, nickname, and role are required" },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `INSERT INTO color_game_scores (room_code, nickname, role, points, guess_number, target_cell)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [roomCode, nickname, role, points ?? 0, guessNumber ?? null, targetCell ?? null]
  );

  return jsonResponse(result.rows[0], { status: 201 });
}

export async function OPTIONS() {
  return corsOptions();
}
