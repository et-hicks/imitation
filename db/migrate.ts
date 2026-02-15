import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/imitation";

const pool = new Pool({ connectionString });

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query(
    "SELECT name FROM _migrations ORDER BY id"
  );
  return new Set(result.rows.map((row: { name: string }) => row.name));
}

async function getMigrationFiles(): Promise<string[]> {
  const files = fs.readdirSync(MIGRATIONS_DIR);
  return files
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function applyMigration(name: string) {
  const filePath = path.join(MIGRATIONS_DIR, name);
  const sql = fs.readFileSync(filePath, "utf-8");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO _migrations (name) VALUES ($1)", [name]);
    await client.query("COMMIT");
    console.log(`  Applied: ${name}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function migrate() {
  console.log("Running database migrations...");
  console.log(`Database: ${connectionString.replace(/\/\/.*@/, "//***@")}`);

  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const files = await getMigrationFiles();
  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log("No pending migrations.");
  } else {
    console.log(`${pending.length} migration(s) to apply:`);
    for (const file of pending) {
      await applyMigration(file);
    }
    console.log("All migrations applied.");
  }

  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
