import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables.");
}

const db = createClient({ url, authToken });

async function tableExists(name: string): Promise<boolean> {
  const result = await db.execute({
    sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    args: [name],
  });

  return result.rows.length > 0;
}

async function createCommandsTable(tableName = "commands"): Promise<void> {
  await db.execute(`CREATE TABLE IF NOT EXISTS ${tableName} (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    category_id TEXT NOT NULL REFERENCES categories(id),
    content BLOB NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`);
}

async function migrateCommandsTable(): Promise<void> {
  if (!(await tableExists("commands"))) {
    await createCommandsTable();
    return;
  }

  const columns = await db.execute(`PRAGMA table_info(commands)`);
  const idColumn = columns.rows.find((row) => row.name === "id");
  const hasSlug = columns.rows.some((row) => row.name === "slug");

  if (idColumn?.type === "TEXT" && hasSlug) {
    return;
  }

  const existingCommands = await db.execute(`SELECT * FROM commands`);

  await db.execute(`DROP TABLE IF EXISTS commands_next`);
  await createCommandsTable("commands_next");

  for (const command of existingCommands.rows) {
    const name = String(command.name ?? "");
    const slug = String(command.slug ?? command.id ?? name.replace(/^\/+/, ""));

    await db.execute({
      sql: `
        INSERT INTO commands_next (
          id,
          slug,
          name,
          description,
          category_id,
          content,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        Bun.randomUUIDv7(),
        slug,
        name,
        command.description ?? "",
        command.category_id,
        command.content,
        command.created_at,
        command.updated_at,
      ],
    });
  }

  await db.batch(
    [
      `DROP TABLE commands`,
      `ALTER TABLE commands_next RENAME TO commands`,
    ],
    "write"
  );
}

await db.execute(`CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL
)`);

await migrateCommandsTable();
await db.execute(`CREATE INDEX IF NOT EXISTS commands_category_id_idx ON commands(category_id)`);

await db.execute(`CREATE TABLE IF NOT EXISTS command_variants (
  id TEXT PRIMARY KEY,
  command_id TEXT NOT NULL REFERENCES commands(id),
  agent_cli TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'markdown',
  content BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(command_id, agent_cli)
)`);

await db.execute(`CREATE INDEX IF NOT EXISTS command_variants_command_id_idx ON command_variants(command_id)`);
await db.execute(`CREATE INDEX IF NOT EXISTS command_variants_agent_cli_idx ON command_variants(agent_cli)`);

console.log("Turso schema ready");
