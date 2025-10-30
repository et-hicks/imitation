import { NextRequest, NextResponse } from "next/server";
import { createSession, findUserByUsername, verifyPassword } from "@/lib/auth";

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

    const user = findUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }

    const token = createSession(user.id);

    const response = NextResponse.json({ message: "login successful", user: { id: user.id, username: user.username } });
    response.cookies.set({
      name: "session_token",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error("login failed", error);
    return NextResponse.json({ error: "unable to process request" }, { status: 500 });
  }
}
