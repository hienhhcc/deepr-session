import Database from "better-sqlite3";
import { app } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  const userDataPath = app.getPath("userData");
  const dbDir = path.join(userDataPath, "data");
  fs.mkdirSync(dbDir, { recursive: true });

  const dbPath = path.join(dbDir, "deepr.db");
  db = new Database(dbPath);

  // Enable WAL mode for better concurrent performance
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runMigrations(db);

  return db;
}

function runMigrations(database: Database.Database) {
  // Create migrations tracking table
  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Read and apply migrations
  const migrationsDir = path.join(__dirname, "services", "migrations");

  // In bundled mode, migrations are embedded — use inline SQL
  // Check if migrations dir exists (dev mode)
  let migrationFiles: string[] = [];
  if (fs.existsSync(migrationsDir)) {
    migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
  }

  if (migrationFiles.length > 0) {
    for (const file of migrationFiles) {
      const name = path.basename(file, ".sql");
      const applied = database
        .prepare("SELECT 1 FROM _migrations WHERE name = ?")
        .get(name);

      if (!applied) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
        database.exec(sql);
        database
          .prepare("INSERT INTO _migrations (name) VALUES (?)")
          .run(name);
        console.log(`Applied migration: ${name}`);
      }
    }
  } else {
    // Bundled mode: apply inline initial migration
    const applied = database
      .prepare("SELECT 1 FROM _migrations WHERE name = ?")
      .get("001_initial");

    if (!applied) {
      applyInitialMigration(database);
      database
        .prepare("INSERT INTO _migrations (name) VALUES (?)")
        .run("001_initial");
      console.log("Applied migration: 001_initial (inline)");
    }
  }
}

function applyInitialMigration(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#2d6a4f',
      focus_duration INTEGER NOT NULL DEFAULT 25,
      break_duration INTEGER NOT NULL DEFAULT 5,
      long_break_duration INTEGER NOT NULL DEFAULT 15,
      sessions_before_long_break INTEGER NOT NULL DEFAULT 4,
      blocked_domains TEXT NOT NULL DEFAULT '[]',
      blocked_apps TEXT NOT NULL DEFAULT '[]',
      sound_preset TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      task TEXT NOT NULL,
      intention TEXT,
      profile_id TEXT,
      focus_duration INTEGER NOT NULL DEFAULT 25,
      break_duration INTEGER NOT NULL DEFAULT 5,
      long_break_duration INTEGER NOT NULL DEFAULT 15,
      sessions_before_long_break INTEGER NOT NULL DEFAULT 4,
      completed_pomodoros INTEGER NOT NULL DEFAULT 0,
      total_focus_time INTEGER NOT NULL DEFAULT 0,
      focus_rating INTEGER,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS block_rules (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('domain', 'app')),
      value TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_stats (
      date TEXT PRIMARY KEY,
      total_focus_minutes INTEGER NOT NULL DEFAULT 0,
      sessions_completed INTEGER NOT NULL DEFAULT 0,
      average_rating REAL
    );

    CREATE TABLE IF NOT EXISTS custom_sounds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      duration REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_profile ON sessions(profile_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    CREATE INDEX IF NOT EXISTS idx_block_rules_profile ON block_rules(profile_id);
    CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
  `);
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
