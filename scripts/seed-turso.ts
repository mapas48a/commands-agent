import { createClient } from "@libsql/client";
import { categories, commands } from "../src/data/config";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables.");
}

const db = createClient({ url, authToken });
const encoder = new TextEncoder();

for (const category of categories) {
  await db.execute({
    sql: `
      INSERT INTO categories (id, name, icon)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        icon = excluded.icon
    `,
    args: [category.id, category.name, category.icon],
  });
}

for (const command of commands) {
  const commandId = Bun.randomUUIDv7();
  await db.execute({
    sql: `
      INSERT INTO commands (id, slug, name, description, category_id, content, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        category_id = excluded.category_id,
        content = excluded.content,
        updated_at = excluded.updated_at
    `,
    args: [
      commandId,
      command.id,
      command.name,
      command.description,
      command.category,
      encoder.encode(command.markdown),
    ],
  });

  const commandRow = await db.execute({
    sql: `SELECT id FROM commands WHERE slug = ? LIMIT 1`,
    args: [command.id],
  });

  const insertedId = String(commandRow.rows[0]?.id ?? commandId);

  for (const variant of command.variants) {
    await db.execute({
      sql: `
        INSERT INTO command_variants (id, command_id, agent_cli, format, content, updated_at)
        VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        ON CONFLICT(command_id, agent_cli) DO UPDATE SET
          format = excluded.format,
          content = excluded.content,
          updated_at = excluded.updated_at
      `,
      args: [
        Bun.randomUUIDv7(),
        insertedId,
        variant.agentCli,
        variant.format,
        encoder.encode(variant.content),
      ],
    });
  }
}

console.log(`Seeded ${commands.length} commands with variants into Turso`);
