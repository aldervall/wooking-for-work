import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

// Initialize schema if database is new
const schemaPath = path.resolve(__dirname, 'schema.sql');
const dbExists = fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0;

if (!dbExists) {
  console.log('Initializing database schema...');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('Database schema initialized at:', dbPath);
}

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
