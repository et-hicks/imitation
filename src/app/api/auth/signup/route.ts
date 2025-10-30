import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByUsername } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "username and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = findUserByUsername(username);
    if (existing) {
      return NextResponse.json(
        { error: "username already exists" },
        { status: 409 }
      );
    }

    const user = await createUser(username, password);

    return NextResponse.json(
      {
        message: "account created",
        user: user ? { id: user.id, username: user.username, created_at: user.created_at } : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("signup failed", error);
    return NextResponse.json({ error: "unable to process request" }, { status: 500 });
  }
}
