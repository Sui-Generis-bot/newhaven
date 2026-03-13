// db/migrate.js
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/directory.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const migrate = db.transaction(() => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      username    TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role        TEXT NOT NULL CHECK(role IN ('admin','viewer')) DEFAULT 'viewer',
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      last_login  TEXT
    );
  `);

  // Contacts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name          TEXT NOT NULL,
      title         TEXT NOT NULL,
      email         TEXT NOT NULL,
      mobile        TEXT,
      telephone     TEXT,
      fax           TEXT,
      office_address TEXT,
      website       TEXT,
      department    TEXT,
      is_active     INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      created_by    TEXT REFERENCES users(id),
      updated_by    TEXT REFERENCES users(id)
    );
  `);

  // Audit log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id     TEXT REFERENCES users(id),
      username    TEXT,
      action      TEXT NOT NULL CHECK(action IN ('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','LOGIN_FAIL')),
      entity      TEXT,
      entity_id   TEXT,
      details     TEXT,
      ip_address  TEXT,
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);

  // Sessions table (for persistent sessions across restarts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      sid   TEXT PRIMARY KEY,
      sess  TEXT NOT NULL,
      expired TEXT NOT NULL
    );
  `);

  // Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_contacts_name    ON contacts(name);
    CREATE INDEX IF NOT EXISTS idx_contacts_email   ON contacts(email);
    CREATE INDEX IF NOT EXISTS idx_contacts_title   ON contacts(title);
    CREATE INDEX IF NOT EXISTS idx_contacts_active  ON contacts(is_active);
    CREATE INDEX IF NOT EXISTS idx_audit_user       ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_entity     ON audit_log(entity_id);
  `);
});

migrate();
console.log('✅ Migration complete. DB:', DB_PATH);
module.exports = db;
