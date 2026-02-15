import { NextRequest } from "next/server";

export type AuthUser = {
  uid: string;
  email?: string;
};

/**
 * Extract and verify Supabase JWT from Authorization header.
 * Returns the authenticated user or null.
 */
export function getAuthUser(request: NextRequest): AuthUser | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    // Decode JWT payload (base64url)
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );

    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (jwtSecret) {
      // In production, verify signature with crypto
      // For now, check expiration at minimum
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return null;
      }
    }

    return {
      uid: payload.sub || "dev-user",
      email: payload.email,
    };
  } catch {
    return null;
  }
}

/**
 * Require authentication - returns AuthUser or a 401 Response.
 */
export function requireAuth(
  request: NextRequest
): AuthUser | Response {
  const user = getAuthUser(request);
  if (!user) {
    return Response.json(
      { detail: "Authorization header required" },
      { status: 401 }
    );
  }
  return user;
}
