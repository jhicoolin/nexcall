-- Bad Genetics HQ — Genie Database Schema
-- Provider: Supabase or Neon (Postgres)
-- Set DATABASE_URL in your environment to connect.

CREATE TABLE IF NOT EXISTS guilds (
  id TEXT PRIMARY KEY,                     -- Discord guild snowflake
  name TEXT,
  setup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                     -- Discord user snowflake
  username TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0,
  email_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  email_address TEXT,                      -- only stored if user explicitly provides it
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xp_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  guild_id TEXT NOT NULL REFERENCES guilds(id),
  amount INTEGER NOT NULL,
  reason TEXT,                             -- 'message', 'event', 'admin_grant'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user ON xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_guild ON xp_events(guild_id);

CREATE TABLE IF NOT EXISTS levels (
  level INTEGER PRIMARY KEY,
  xp_required INTEGER NOT NULL,
  role_name TEXT                           -- Discord role name to grant at this level
);

INSERT INTO levels (level, xp_required, role_name) VALUES
  (5,  500,  'Initiate'),
  (10, 1500, 'Regular'),
  (20, 4000, 'Locked In'),
  (35, 9000, 'BadGenes Elite'),
  (50, 20000,'Inner Circle')
ON CONFLICT (level) DO NOTHING;

CREATE TABLE IF NOT EXISTS commands_log (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  guild_id TEXT,
  command TEXT NOT NULL,
  subcommand TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commands_log_user ON commands_log(user_id);

CREATE TABLE IF NOT EXISTS market_alerts (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,                      -- 'crypto', 'stock', 'competitor'
  title TEXT NOT NULL,
  body TEXT,
  source_url TEXT,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id BIGSERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  content JSONB NOT NULL,                  -- Discord message payload
  scheduled_for TIMESTAMPTZ NOT NULL,
  posted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opt_ins (
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,                      -- 'email_routine', 'email_weekly', 'drop_alerts'
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, type)
);
