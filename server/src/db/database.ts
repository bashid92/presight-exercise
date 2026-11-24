import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import config from '../config/env';

const IN_MEMORY = ':memory:';
const DB_PATH = config.dbPath ?? path.resolve(__dirname, '../../data/presight.db');

if (DB_PATH !== IN_MEMORY) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

export const db: Database.Database = new Database(DB_PATH);

// WAL lets readers run while a write is in progress; NORMAL sync is safe with WAL.
if (DB_PATH !== IN_MEMORY) {
  db.pragma('journal_mode = WAL');
}
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

/** Creates tables and indexes if they do not exist yet. Safe to call many times. */
export function initializeDatabase(): void {
  const schemaSql = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf8');
  db.exec(schemaSql);
}

export function countAllUsers(): number {
  const row = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  return row.count;
}

export default db;
