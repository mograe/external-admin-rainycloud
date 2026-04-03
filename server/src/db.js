import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve("data");
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.resolve(dataDir, "app.db"));

db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS api_clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_used_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS show_logs (
  id TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL DEFAULT 1,

  source_client_id TEXT,
  source_client_name TEXT,

  show_number INTEGER NOT NULL,
  socket_connections INTEGER NOT NULL,

  movie_title TEXT NOT NULL,
  movie_path TEXT,
  movie_id TEXT,

  started_at_utc TEXT NOT NULL,
  finished_at_utc TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,

  client_timezone TEXT,
  client_utc_offset_minutes INTEGER,

  received_at_utc TEXT NOT NULL,
  raw_payload TEXT,

  FOREIGN KEY (source_client_id) REFERENCES api_clients(id)
);

CREATE INDEX IF NOT EXISTS idx_show_logs_finished_at
ON show_logs(finished_at_utc DESC);

CREATE INDEX IF NOT EXISTS idx_show_logs_movie_title
ON show_logs(movie_title);

CREATE INDEX IF NOT EXISTS idx_show_logs_source_client_id
ON show_logs(source_client_id);
`);