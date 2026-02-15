import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/imitation",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
});

export default pool;
