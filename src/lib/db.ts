import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DB_DIRECTORY = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIRECTORY, "app.db");

let initialized = false;

function ensureDatabase() {
  if (initialized) {
    return;
  }
  if (!fs.existsSync(DB_DIRECTORY)) {
    fs.mkdirSync(DB_DIRECTORY, { recursive: true });
  }
  run(
    [
      "PRAGMA journal_mode=WAL;",
      "CREATE TABLE IF NOT EXISTS users (",
      "  id INTEGER PRIMARY KEY AUTOINCREMENT,",
      "  username TEXT UNIQUE NOT NULL,",
      "  password_hash TEXT NOT NULL,",
      "  created_at TEXT NOT NULL",
      ");",
      "CREATE TABLE IF NOT EXISTS sessions (",
      "  id INTEGER PRIMARY KEY AUTOINCREMENT,",
      "  user_id INTEGER NOT NULL,",
      "  token_hash TEXT NOT NULL,",
      "  created_at TEXT NOT NULL,",
      "  expires_at TEXT NOT NULL,",
      "  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE",
      ");",
      "CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);",
      "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);",
    ].join("\n")
  );
  initialized = true;
}

function run(sql: string) {
  const result = spawnSync("sqlite3", [DB_PATH, sql], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.error?.message || "SQLite command failed");
  }
}

function query<T>(sql: string): T[] {
  const result = spawnSync("sqlite3", ["-json", DB_PATH, sql], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.error?.message || "SQLite query failed");
  }
  const trimmed = result.stdout.trim();
  if (!trimmed) {
    return [];
  }
  return JSON.parse(trimmed) as T[];
}

export function execute(sql: string) {
  ensureDatabase();
  run(sql);
}

export function select<T>(sql: string): T[] {
  ensureDatabase();
  return query<T>(sql);
}

export function formatValue(value: string | number | null): string {
  if (value === null) {
    return "NULL";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toString() : "NULL";
  }
  return `'${value.replace(/'/g, "''")}'`;
}

