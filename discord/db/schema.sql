-- Bad Genetics HQ — Genie Database Schema
-- Provider: Supabase or Neon (Postgres). Set DATABASE_URL in environment.

CREATE TABLE IF NOT EXISTS guilds (
  id TEXT PRIMARY KEY, name TEXT, setup_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guild_config (
  guild_id TEXT PRIMARY KEY REFERENCES guilds(id) ON DELETE CASCADE,
  genie_model TEXT DEFAULT 'gpt-4o-mini', ai_rate_limit INTEGER DEFAULT 5,
  xp_per_message INTEGER DEFAULT 10, xp_cooldown_sec INTEGER DEFAULT 60,
  safe_search BOOLEAN DEFAULT TRUE, market_interval INTEGER DEFAULT 15,
  level_up_channel TEXT DEFAULT 'level-up', log_channel TEXT DEFAULT 'mod-log',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, username TEXT, xp INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 0,
  email_opt_in BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_xp (
  user_id TEXT NOT NULL REFERENCES users(id), guild_id TEXT NOT NULL REFERENCES guilds(id),
  xp INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 0, last_xp_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, guild_id)
);

CREATE TABLE IF NOT EXISTS xp_events (
  id BIGSERIAL PRIMARY KEY, user_id TEXT NOT NULL, guild_id TEXT NOT NULL,
  amount INTEGER NOT NULL, reason TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_xp_user  ON xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_guild ON xp_events(guild_id);

CREATE TABLE IF NOT EXISTS level_roles (
  level INTEGER PRIMARY KEY, role_name TEXT NOT NULL, xp_required INTEGER NOT NULL
);
INSERT INTO level_roles (level, role_name, xp_required) VALUES
  (5, 'Initiate', 500),(10, 'Regular', 1500),(20, 'Locked In', 4000),
  (35, 'BadGenes Elite', 9000),(50, 'Inner Circle', 20000),(100, 'Genetic Legend', 75000)
ON CONFLICT (level) DO NOTHING;

CREATE TABLE IF NOT EXISTS mod_actions (
  id BIGSERIAL PRIMARY KEY, guild_id TEXT NOT NULL, target_user TEXT NOT NULL,
  moderator TEXT NOT NULL, action TEXT NOT NULL, reason TEXT,
  expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGSERIAL PRIMARY KEY, guild_id TEXT NOT NULL, user_id TEXT NOT NULL,
  action TEXT NOT NULL, details JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS command_logs (
  id BIGSERIAL PRIMARY KEY, guild_id TEXT, user_id TEXT,
  command TEXT NOT NULL, subcommand TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cmd_command ON command_logs(command);
CREATE INDEX IF NOT EXISTS idx_cmd_guild   ON command_logs(guild_id);

CREATE TABLE IF NOT EXISTS daily_stats (
  guild_id TEXT NOT NULL, date DATE NOT NULL, message_count INTEGER DEFAULT 0,
  command_count INTEGER DEFAULT 0, xp_awarded INTEGER DEFAULT 0, new_members INTEGER DEFAULT 0,
  PRIMARY KEY (guild_id, date)
);

CREATE TABLE IF NOT EXISTS brand_signals (
  id BIGSERIAL PRIMARY KEY, brand TEXT NOT NULL, signal_type TEXT NOT NULL,
  title TEXT, url TEXT, source TEXT, detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id BIGSERIAL PRIMARY KEY, guild_id TEXT NOT NULL, channel_id TEXT NOT NULL,
  content JSONB NOT NULL, scheduled_for TIMESTAMPTZ NOT NULL,
  posted BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opt_ins (
  user_id TEXT NOT NULL, type TEXT NOT NULL, email TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(), revoked_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, type)
);

CREATE TABLE IF NOT EXISTS music_queues (
  id BIGSERIAL PRIMARY KEY, guild_id TEXT NOT NULL, position INTEGER NOT NULL,
  title TEXT, url TEXT NOT NULL, added_by TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_logs (
  id BIGSERIAL PRIMARY KEY, user_id TEXT, guild_id TEXT,
  query TEXT, type TEXT, result_count INTEGER, created_at TIMESTAMPTZ DEFAULT NOW()
);
