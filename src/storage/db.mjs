import Database from 'better-sqlite3';
import { logSystem } from '../logger/logger.mjs';

const db = new Database('nexus_waiting_room.sqlite');
db.pragma('journal_mode = WAL');

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      answer_text TEXT,
      state TEXT,
      requested_at INTEGER,
      answered_at INTEGER,
      decided_at INTEGER,
      decision TEXT,
      decision_admin_id INTEGER,
      invite_link TEXT,
      invite_link_created_at INTEGER,
      spam_score REAL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      event TEXT,
      at INTEGER
    );
  `);
  logSystem('db_migrated');
}

export default db;
