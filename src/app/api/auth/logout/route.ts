import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteSessionByToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("session_token")?.value;
    if (token) {
      deleteSessionByToken(token);
      cookieStore.set({
        name: "session_token",
        value: "",
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
      });
    }
    return NextResponse.json({ message: "logged out" });
  } catch (error) {
    console.error("logout failed", error);
    return NextResponse.json({ error: "unable to process request" }, { status: 500 });
  }
}
