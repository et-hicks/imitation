import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

export type AuthUser = {
  uid: string;
  email?: string;
};

/**
 * Verify HMAC-SHA256 JWT signature against the Supabase JWT secret.
 */
function verifyJwtSignature(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const signatureInput = `${parts[0]}.${parts[1]}`;
  const expectedSig = createHmac("sha256", secret)
    .update(signatureInput)
    .digest("base64url");

  const actualSig = parts[2];

  // Use timing-safe comparison to prevent timing attacks
  try {
    const expected = Buffer.from(expectedSig, "utf-8");
    const actual = Buffer.from(actualSig, "utf-8");
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

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
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (jwtSecret) {
      // Verify signature before trusting any payload data
      if (!verifyJwtSignature(token, jwtSecret)) {
        return null;
      }
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    if (!payload.sub) return null;

    return {
      uid: payload.sub,
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
