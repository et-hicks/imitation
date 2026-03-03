import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getOrCreateUser, jsonResponse, corsOptions } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);

  const result = await pool.query(
    `SELECT id, meal_type, created_at
     FROM meals
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [user.id]
  );

  return jsonResponse(result.rows, {}, request);
}

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);
  const body = await request.json();
  const { meal_type } = body;

  if (meal_type !== "lunch" && meal_type !== "dinner") {
    return jsonResponse(
      { error: "meal_type must be lunch or dinner" },
      { status: 400 },
      request
    );
  }

  const countResult = await pool.query(
    "SELECT COUNT(*) FROM meals WHERE user_id = $1",
    [user.id]
  );
  if (parseInt(countResult.rows[0].count) >= 100) {
    return jsonResponse(
      { error: "Meal limit of 100 reached" },
      { status: 400 },
      request
    );
  }

  const result = await pool.query(
    `INSERT INTO meals (user_id, meal_type)
     VALUES ($1, $2)
     RETURNING id, meal_type, created_at`,
    [user.id, meal_type]
  );

  return jsonResponse(result.rows[0], { status: 201 }, request);
}

export async function DELETE(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);

  const result = await pool.query(
    `DELETE FROM meals
     WHERE id = (
       SELECT id FROM meals
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1
     )
     RETURNING id`,
    [user.id]
  );

  if (result.rows.length === 0) {
    return jsonResponse({ error: "No meals to delete" }, { status: 404 }, request);
  }

  return jsonResponse({ deleted: result.rows[0].id }, {}, request);
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
