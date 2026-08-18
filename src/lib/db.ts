import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DATABASE_PATH || "./data/whoop.db";

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS whoop_tokens (
    user_id INTEGER PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

export interface StoredTokens {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const upsertStmt = db.prepare(`
  INSERT INTO whoop_tokens (user_id, first_name, last_name, email, access_token, refresh_token, expires_at, updated_at)
  VALUES (@userId, @firstName, @lastName, @email, @accessToken, @refreshToken, @expiresAt, @updatedAt)
  ON CONFLICT(user_id) DO UPDATE SET
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    email = excluded.email,
    access_token = excluded.access_token,
    refresh_token = excluded.refresh_token,
    expires_at = excluded.expires_at,
    updated_at = excluded.updated_at
`);

export function saveTokens(tokens: StoredTokens) {
  upsertStmt.run({
    userId: tokens.userId,
    firstName: tokens.firstName,
    lastName: tokens.lastName,
    email: tokens.email,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    updatedAt: Date.now(),
  });
}

const getStmt = db.prepare(
  `SELECT user_id as userId, first_name as firstName, last_name as lastName, email,
          access_token as accessToken, refresh_token as refreshToken, expires_at as expiresAt
   FROM whoop_tokens WHERE user_id = ?`
);

export function getTokens(userId: number): StoredTokens | undefined {
  return getStmt.get(userId) as StoredTokens | undefined;
}

const deleteStmt = db.prepare(`DELETE FROM whoop_tokens WHERE user_id = ?`);

export function deleteTokens(userId: number) {
  deleteStmt.run(userId);
}

export default db;
