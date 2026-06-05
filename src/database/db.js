import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { runMigration } from './migrations/001_multi_user.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../data/wooking.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize/upgrade schema — safe to run on existing DBs (IF NOT EXISTS / INSERT OR IGNORE)
const schemaPath = path.resolve(__dirname, 'schema.sql');
const dbExists = fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0;

if (!dbExists) {
  console.log('Initializing database schema...');
} else {
  console.log('Running schema migrations...');
}
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);
if (!dbExists) console.log('Database schema initialized at:', dbPath);

// Migration: recreate runs table with nullable job_id (removed FK to jobs)
// Older schema had: job_id TEXT NOT NULL REFERENCES jobs(id)
try {
  const runsInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='runs'").get();
  if (runsInfo && runsInfo.sql.includes('FOREIGN KEY')) {
    console.log('Migration: recreating runs table without FK constraint...');
    db.exec(`
      CREATE TABLE runs_new (
        id TEXT PRIMARY KEY,
        job_id TEXT,
        status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
        started_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        duration INTEGER,
        steps TEXT,
        artifacts_cv_path TEXT,
        artifacts_pb_path TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO runs_new SELECT * FROM runs;
      DROP TABLE runs;
      ALTER TABLE runs_new RENAME TO runs;
    `);
    console.log('Migration complete.');
  }
} catch (e) {
  console.log('Migration skipped (expected on first run):', e.message);
}

// Migration: add user_id columns to existing tables (safe for re-runs)
const columnMigrations = [
  ['profiles', 'user_id', 'TEXT'],
  ['jobs', 'user_id', 'TEXT'],
  ['tokens', 'user_id', 'TEXT'],
];
for (const [table, column, colType] of columnMigrations) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${colType}`);
    console.log(`Migration: added ${column} column to ${table}`);
  } catch (e) {
    if (!e.message.includes('duplicate column')) {
      console.log(`Migration warning (${table}.${column}):`, e.message);
    }
  }
}

// Create user_id indexes (must run after ALTER TABLE for existing DBs)
const userIdIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id)',
];
for (const sql of userIdIndexes) {
  try {
    db.exec(sql);
  } catch (e) {
    console.log(`Migration warning (index):`, e.message);
  }
}

// Run multi-user data migration (safe to run every startup — idempotent)
runMigration(db);

// Helper functions for query execution
export function runQuery(sql, params = []) {
  return db.prepare(sql).run(params);
}

export function getOne(sql, params = []) {
  return db.prepare(sql).get(params);
}

export function getAll(sql, params = []) {
  return db.prepare(sql).all(params);
}

export function transaction(fn) {
  return db.transaction(fn);
}

// Export database instance for advanced use
export default db;
