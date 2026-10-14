import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { log } from "@/lib/log";

const TABLES = [
  sql`CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('custom', 'conservative', 'aggressive')),
    horizon TEXT NOT NULL CHECK(horizon IN ('short', 'medium', 'long')),
    max_position_pct REAL NOT NULL,
    max_drawdown_pct REAL NOT NULL,
    weights_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  sql`CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id),
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK(side IN ('buy', 'sell')),
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    timestamp TEXT NOT NULL,
    exchange TEXT NOT NULL CHECK(exchange IN ('NSE', 'BSE'))
  )`,
  sql`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id),
    tip_text TEXT NOT NULL,
    verdict_json TEXT,
    sources_json TEXT,
    metrics_json TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
  )`,
  sql`CREATE TABLE IF NOT EXISTS filing_chunks (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    source_url TEXT NOT NULL,
    publisher TEXT NOT NULL,
    as_of TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    retrieved_at TEXT NOT NULL
  )`,
];

async function migrate() {
  const url = process.env.TURSO_DATABASE_URL || "file:data/local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url.startsWith("libsql://") && !authToken) {
    log.error("TURSO_AUTH_TOKEN is required when using a remote Turso database URL");
    process.exit(1);
  }

  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });

  for (const table of TABLES) {
    await db.run(table);
  }

  log.info("Migration complete", { url, tables: TABLES.length });
}

migrate().catch((err) => {
  log.error("Migration failed", { error: String(err) });
  process.exit(1);
});
