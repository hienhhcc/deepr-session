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
    const inlineMigrations: [string, (db: Database.Database) => void][] = [
      ["001_initial", applyInitialMigration],
      ["002_tasks", applyTasksMigration],
    ];

    for (const [name, applyFn] of inlineMigrations) {
      const applied = database
        .prepare("SELECT 1 FROM _migrations WHERE name = ?")
        .get(name);

      if (!applied) {
        applyFn(database);
        database
          .prepare("INSERT INTO _migrations (name) VALUES (?)")
          .run(name);
        console.log(`Applied migration: ${name} (inline)`);
      }
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

function applyTasksMigration(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      name TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS session_tasks (
      session_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (session_id, task_id),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
    CREATE INDEX IF NOT EXISTS idx_session_tasks_session ON session_tasks(session_id);
    CREATE INDEX IF NOT EXISTS idx_session_tasks_task ON session_tasks(task_id);

    INSERT INTO tasks (id, name, status, created_at, updated_at)
    SELECT
      lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))) AS id,
      s.task AS name,
      CASE s.status
        WHEN 'completed' THEN 'done'
        WHEN 'cancelled' THEN 'done'
        ELSE 'in_progress'
      END AS status,
      s.started_at AS created_at,
      COALESCE(s.completed_at, s.started_at) AS updated_at
    FROM sessions s
    WHERE s.task IS NOT NULL AND s.task != '';

    INSERT INTO session_tasks (session_id, task_id, sort_order, added_at)
    SELECT s.id, t.id, 0, s.started_at
    FROM sessions s
    JOIN tasks t ON t.name = s.task
      AND t.created_at = s.started_at
    WHERE s.task IS NOT NULL AND s.task != '';
  `);
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
