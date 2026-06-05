-- Wooking for Work Database Schema
-- SQLite database for job search pipeline management

-- Jobs table - Core job listing data
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  src TEXT NOT NULL CHECK(src IN ('AF', 'LinkedIn', 'Wise')),
  ref TEXT NOT NULL,
  title TEXT NOT NULL,
  employer TEXT NOT NULL,
  location TEXT NOT NULL,
  distance INTEGER,
  language TEXT NOT NULL CHECK(language IN ('sv', 'en')),
  remote TEXT CHECK(remote IN ('true', 'false', 'hybrid')),
  posted_days INTEGER NOT NULL DEFAULT 0,
  match INTEGER NOT NULL CHECK(match >= 0 AND match <= 100),
  state TEXT NOT NULL DEFAULT 'scraped' CHECK(state IN ('scraped', 'shortlist', 'tailored', 'submitted', 'interviews', 'offers', 'replied', 'declined', 'dismissed')),
  salary TEXT,
  closing TEXT,
  excerpt TEXT,
  skills TEXT,
  url TEXT NOT NULL,
  tags TEXT,
  scraped_at TEXT DEFAULT CURRENT_TIMESTAMP,
  submitted_at TEXT,
  replied_at TEXT,
  tailored_cv_done INTEGER DEFAULT 0,
  tailored_pb_done INTEGER DEFAULT 0,
  slug TEXT,
  user_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(src, ref)
);

-- Activities table - AF evidence and job search activities
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  evidence INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Runs table - Automation workflow tracking (job-specific runs + session-level scrapes)
CREATE TABLE IF NOT EXISTS runs (
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

-- States table - Pipeline state definitions (static reference data)
CREATE TABLE IF NOT EXISTS states (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  hint TEXT,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Commands table - Command palette commands (static reference data)
CREATE TABLE IF NOT EXISTS commands (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  keys TEXT NOT NULL,
  hint TEXT,
  cmd_group TEXT NOT NULL
);

-- Users table — multi-user accounts
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Profiles table — user's own data (imported from LinkedIn/RxResume)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  linkedin_url TEXT,
  linkedin_username TEXT,
  linkedin_data TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  headline TEXT,
  location TEXT,
  avatar_url TEXT,
  skills TEXT,
  preferences TEXT,
  import_run_id TEXT,
  status TEXT NOT NULL DEFAULT 'empty' CHECK(status IN ('empty', 'importing', 'ready')),
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS profiles_updated_at
AFTER UPDATE ON profiles
BEGIN
  UPDATE profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Tokens table — OAuth tokens for external services
CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at INTEGER,
  scope TEXT,
  profile TEXT,
  user_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS tokens_updated_at
AFTER UPDATE ON tokens
BEGIN
  UPDATE tokens SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_state ON jobs(state);
CREATE INDEX IF NOT EXISTS idx_jobs_src ON jobs(src);
CREATE INDEX IF NOT EXISTS idx_jobs_match ON jobs(match);
CREATE INDEX IF NOT EXISTS idx_jobs_distance ON jobs(distance);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_job_id ON activities(job_id);
CREATE INDEX IF NOT EXISTS idx_activities_evidence ON activities(evidence);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_job_id ON runs(job_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_started_at ON runs(started_at DESC);
-- Triggers to auto-update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS jobs_updated_at 
AFTER UPDATE ON jobs
BEGIN
  UPDATE jobs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS runs_updated_at 
AFTER UPDATE ON runs
BEGIN
  UPDATE runs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS users_updated_at
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insert default states
INSERT OR IGNORE INTO states (id, label, hint, display_order) VALUES
  ('scraped', 'Scraped', 'fresh from sources', 0),
  ('shortlist', 'Shortlist', 'worth a closer look', 1),
  ('tailored', 'Tailored', 'CV + PB generated', 2),
  ('submitted', 'Submitted', 'application sent', 3),
  ('interviews', 'Interviews', 'interview scheduled', 4),
  ('offers', 'Offers', 'offer received', 5),
  ('replied', 'Replied', 'they got back to you', 6),
  ('declined', 'Declined', 'you declined', 7),
  ('dismissed', 'Dismissed', 'not interested', 8);

-- Insert default commands (keys stored as JSON arrays for compatibility)
INSERT OR IGNORE INTO commands (id, label, keys, hint, cmd_group) VALUES
  ('tailor', 'Tailor CV for selected job', '[]', 'CrewAI · ~12s', 'Apply'),
  ('apply', 'Apply (browserless)', '[]', 'Fill form + upload files', 'Apply'),
  ('shortlist', 'Add to Shortlist', '[]', 'Move to shortlist column', 'Triage'),
  ('dismiss', 'Dismiss job', '[]', 'Remove from pipeline', 'Triage'),
  ('goto-pipeline', 'Go to Pipeline', '[]', 'Kanban view', 'Navigate'),
  ('goto-atlas', 'Go to Atlas', '[]', 'Map view', 'Navigate'),
  ('goto-report', 'Go to Report', '[]', 'Activity report', 'Navigate'),
  ('goto-runs', 'Go to Runs', '[]', 'Timeline of runs', 'Navigate'),
  ('toggle-theme', 'Toggle light/dark', '[]', 'Switch theme', 'System'),
  ('show-help', 'Show help', '[]', 'Keyboard shortcuts', 'System');
