import crypto from "node:crypto";
import { execute, formatValue, select } from "./db";

type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
};

type SessionRow = {
  id: number;
  user_id: number;
  token_hash: string;
  created_at: string;
  expires_at: string;
};

const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getIsoNow() {
  return new Date().toISOString();
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function derivePassword(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derived = await derivePassword(password, salt);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) {
    return false;
  }
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = await derivePassword(password, salt);
  return (
    expected.length === derived.length &&
    crypto.timingSafeEqual(expected, derived)
  );
}

export function findUserByUsername(username: string) {
  const rows = select<UserRow>(
    `SELECT * FROM users WHERE username = ${formatValue(username)} LIMIT 1;`
  );
  return rows[0] ?? null;
}

export async function createUser(username: string, password: string) {
  const hashed = await hashPassword(password);
  const createdAt = getIsoNow();
  execute(
    `INSERT INTO users (username, password_hash, created_at) VALUES (${formatValue(
      username
    )}, ${formatValue(hashed)}, ${formatValue(createdAt)});`
  );
  return findUserByUsername(username);
}

export function deleteExpiredSessions() {
  const cutoff = getIsoNow();
  execute(
    `DELETE FROM sessions WHERE expires_at <= ${formatValue(cutoff)};`
  );
}

export function deleteSessionByToken(token: string) {
  const tokenHash = hashToken(token);
  execute(
    `DELETE FROM sessions WHERE token_hash = ${formatValue(tokenHash)};`
  );
}

export function deleteSessionsForUser(userId: number) {
  execute(`DELETE FROM sessions WHERE user_id = ${formatValue(userId)};`);
}

export function getUserForSession(token: string) {
  deleteExpiredSessions();
  const tokenHash = hashToken(token);
  const rows = select<(SessionRow & { username: string })>(
    `SELECT s.*, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ${formatValue(
      tokenHash
    )} LIMIT 1;`
  );
  if (!rows[0]) {
    return null;
  }
  const row = rows[0];
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    execute(`DELETE FROM sessions WHERE id = ${formatValue(row.id)};`);
    return null;
  }
  return {
    id: row.user_id,
    username: row.username,
  };
}

export function createSession(userId: number) {
  deleteExpiredSessions();
  const token = crypto.randomUUID();
  const tokenHash = hashToken(token);
  const createdAt = getIsoNow();
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS).toISOString();
  execute(
    `INSERT INTO sessions (user_id, token_hash, created_at, expires_at) VALUES (${formatValue(
      userId
    )}, ${formatValue(tokenHash)}, ${formatValue(createdAt)}, ${formatValue(
      expiresAt
    )});`
  );
  return token;
}

