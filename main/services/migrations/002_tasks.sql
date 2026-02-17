-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  name TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Session-Tasks junction table (many-to-many)
CREATE TABLE IF NOT EXISTS session_tasks (
  session_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (session_id, task_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_session_tasks_session ON session_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_session_tasks_task ON session_tasks(task_id);

-- Migrate existing session.task strings into tasks table
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

-- Link migrated tasks to their sessions
INSERT INTO session_tasks (session_id, task_id, sort_order, added_at)
SELECT s.id, t.id, 0, s.started_at
FROM sessions s
JOIN tasks t ON t.name = s.task
  AND t.created_at = s.started_at
WHERE s.task IS NOT NULL AND s.task != '';
