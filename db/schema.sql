PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tasks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  description  TEXT,
  file_url     TEXT,
  due_date     TEXT,
  due_time     TEXT,
  priority     TEXT NOT NULL DEFAULT 'medium'
               CHECK (priority IN ('low','medium','high')),
  repeat       TEXT NOT NULL DEFAULT 'none'
               CHECK (repeat IN ('none','daily','weekdays','weekly')),
  is_done      INTEGER NOT NULL DEFAULT 0 CHECK (is_done IN (0,1)),
  completed_at TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

CREATE TABLE IF NOT EXISTS schedules (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  date       TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time   TEXT,
  memo       TEXT,
  task_id    INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);

CREATE TABLE IF NOT EXISTS notes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id     INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
  category    TEXT NOT NULL DEFAULT 'note'
              CHECK (category IN ('insight','learning','problem','note')),
  content     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_notes_task_id ON notes(task_id);
CREATE INDEX IF NOT EXISTS idx_notes_schedule_id ON notes(schedule_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);

CREATE TABLE IF NOT EXISTS memos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  url        TEXT NOT NULL,
  category   TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS goals (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  period          TEXT NOT NULL CHECK (period IN ('longterm','weekly','monthly')),
  progress        INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  target_date     TEXT,
  parent_goal_id  INTEGER REFERENCES goals(id) ON DELETE SET NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS reports (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  report_date       TEXT NOT NULL UNIQUE,
  manual_content    TEXT,
  generated_content TEXT,
  task_ids_snapshot TEXT,
  generated_by      TEXT NOT NULL DEFAULT 'gemini' CHECK (generated_by IN ('gemini','manual')),
  created_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS weekly_reports (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start_date   TEXT NOT NULL UNIQUE,
  week_end_date     TEXT NOT NULL,
  manual_content    TEXT,
  generated_content TEXT,
  generated_by      TEXT NOT NULL DEFAULT 'gemini' CHECK (generated_by IN ('gemini','manual')),
  created_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS monthly_reports (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  year_month        TEXT NOT NULL UNIQUE,
  manual_content    TEXT,
  generated_content TEXT,
  generated_by      TEXT NOT NULL DEFAULT 'gemini' CHECK (generated_by IN ('gemini','manual')),
  created_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS roadmaps (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  content      TEXT NOT NULL,
  generated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS goal_reviews (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  scope             TEXT NOT NULL CHECK (scope IN ('weekly','monthly')),
  period_key        TEXT NOT NULL,
  manual_content    TEXT,
  generated_content TEXT,
  generated_by      TEXT NOT NULL DEFAULT 'gemini' CHECK (generated_by IN ('gemini','manual')),
  created_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  UNIQUE(scope, period_key)
);
