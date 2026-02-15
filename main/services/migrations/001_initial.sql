-- Profiles table
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

-- Sessions table
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

-- Block rules table
CREATE TABLE IF NOT EXISTS block_rules (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('domain', 'app')),
  value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Daily stats table (materialized for fast analytics)
CREATE TABLE IF NOT EXISTS daily_stats (
  date TEXT PRIMARY KEY,
  total_focus_minutes INTEGER NOT NULL DEFAULT 0,
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  average_rating REAL
);

-- Custom sounds table
CREATE TABLE IF NOT EXISTS custom_sounds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  duration REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_profile ON sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_block_rules_profile ON block_rules(profile_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
