import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = new Set([
  "https://imitation-broken-dawn-9001.fly.dev",
  "https://ethanhicks.com",
  ...(process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()) || []),
]);

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (origin.startsWith("moz-extension://")) return true;
  if (origin.startsWith("chrome-extension://")) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    const headers: Record<string, string> = {
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    if (origin && isAllowedOrigin(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Vary"] = "Origin";
    }
    return new NextResponse(null, { status: 204, headers });
  }

  // For actual requests, add CORS headers to the response
  const response = NextResponse.next();
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
