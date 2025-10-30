import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserForSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const token = cookies().get("session_token")?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    const user = getUserForSession(token);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("session check failed", error);
    return NextResponse.json({ error: "unable to process request" }, { status: 500 });
  }
}
