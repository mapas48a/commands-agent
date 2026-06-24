CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS commands (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  category_id TEXT NOT NULL REFERENCES categories(id),
  content BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS commands_category_id_idx ON commands(category_id);

CREATE TABLE IF NOT EXISTS command_variants (
  id TEXT PRIMARY KEY,
  command_id TEXT NOT NULL REFERENCES commands(id),
  agent_cli TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'markdown',
  content BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(command_id, agent_cli)
);

CREATE INDEX IF NOT EXISTS command_variants_command_id_idx ON command_variants(command_id);
CREATE INDEX IF NOT EXISTS command_variants_agent_cli_idx ON command_variants(agent_cli);
