import { turso } from "./turso";
import type { Category, Command, CommandVariant, VariantFormat } from "../data/config";

function decodeBlob(content: unknown): string {
  if (content === null || content === undefined) return "";

  if (content instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(content));
  }

  if (ArrayBuffer.isView(content)) {
    const view = content as ArrayBufferView;
    return new TextDecoder().decode(
      new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
    );
  }

  if (typeof content === "string") return content;

  return "";
}

export async function getCategories(): Promise<Category[]> {
  const result = await turso.execute(
    `SELECT id, name, icon FROM categories ORDER BY name ASC`
  );

  return result.rows.map((row) => ({
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    icon: String(row.icon ?? ""),
  }));
}

export async function getCommands(): Promise<Command[]> {
  const commandsResult = await turso.execute(
    `SELECT id, slug, name, description, category_id, content FROM commands ORDER BY name ASC`
  );

  const variantsResult = await turso.execute(
    `SELECT command_id, agent_cli, format, content FROM command_variants`
  );

  const variantsByCommand = new Map<string, CommandVariant[]>();
  for (const row of variantsResult.rows) {
    const commandId = String(row.command_id ?? "");
    const variant: CommandVariant = {
      agentCli: String(row.agent_cli ?? ""),
      format: String(row.format ?? "markdown") as VariantFormat,
      content: decodeBlob(row.content),
    };
    const existing = variantsByCommand.get(commandId) ?? [];
    existing.push(variant);
    variantsByCommand.set(commandId, existing);
  }

  return commandsResult.rows.map((row) => {
    const commandId = String(row.id ?? "");
    return {
      id: String(row.slug ?? ""),
      name: String(row.name ?? ""),
      description: String(row.description ?? ""),
      category: String(row.category_id ?? ""),
      markdown: decodeBlob(row.content),
      variants: variantsByCommand.get(commandId) ?? [],
    };
  });
}