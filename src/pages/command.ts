import type { APIRoute } from "astro";
import { agentCLIs, runtimes, type AgentCLI, type Runtime } from "../data/config";
import { turso } from "../lib/turso";

export const prerender = false;

interface CommandPayload {
  agent: string;
  command: string;
  content: number[];
  contentEncoding: "bytes";
  runtime: string;
  model: string;
  executable: string;
  args: string[];
  display: string;
}

interface ErrorPayload {
  error: string;
}

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function findRuntime(runtimeId: string): Runtime | undefined {
  return runtimes.find((r) => r.id === runtimeId);
}

function findAgentCLI(agentId: string): AgentCLI | undefined {
  return agentCLIs.find((a) => a.id === agentId);
}

function findRuntimeFromToken(token: string): Runtime | undefined {
  return runtimes.find((r) => r.prefix.trim().split(/\s+/)[0] === token);
}

function findAgentCLIFromPackage(packageName: string): AgentCLI | undefined {
  return agentCLIs.find((a) => a.package === packageName || a.id === packageName);
}

function parseCommandLine(input: string): {
  agent: string;
  command: string;
  runtime: string;
  model: string;
} {
  const parts = input.trim().split(/\s+/);
  const runtime = findRuntimeFromToken(parts[0] ?? "");
  const agent = findAgentCLIFromPackage(parts[1] ?? "");
  const command = parts.find((part) => part.startsWith("/")) ?? "";
  const modelFlagIndex = parts.findIndex((part) => part === "--model");

  return {
    agent: agent?.id ?? "",
    command,
    runtime: runtime?.id ?? "bunx",
    model: modelFlagIndex >= 0 ? parts[modelFlagIndex + 1] ?? "" : "",
  };
}

function normalizeCommandId(command: string): string {
  return command.replace(/^\/+/, "");
}

function bytesFromContent(content: unknown): number[] {
  if (typeof content === "string") {
    return Array.from(new TextEncoder().encode(content));
  }

  if (content instanceof ArrayBuffer) {
    return Array.from(new Uint8Array(content));
  }

  if (ArrayBuffer.isView(content)) {
    return Array.from(new Uint8Array(content.buffer, content.byteOffset, content.byteLength));
  }

  return [];
}

async function getCommandContent(command: string, agentId?: string): Promise<number[] | undefined> {
  const commandId = normalizeCommandId(command);

  if (agentId) {
    const variantResult = await turso.execute({
      sql: `
        SELECT cv.content
        FROM command_variants cv
        JOIN commands c ON c.id = cv.command_id
        WHERE (c.slug = ? OR c.name = ?) AND cv.agent_cli = ?
        LIMIT 1
      `,
      args: [commandId, command, agentId],
    });

    const variantContent = variantResult.rows[0]?.content;
    if (variantContent) {
      return bytesFromContent(variantContent);
    }
  }

  const result = await turso.execute({
    sql: `
      SELECT content
      FROM commands
      WHERE slug = ? OR name = ?
      LIMIT 1
    `,
    args: [commandId, command],
  });

  const content = result.rows[0]?.content;
  if (!content) {
    return undefined;
  }

  return bytesFromContent(content);
}

function getRequestParams(url: URL): {
  agentId: string;
  command: string;
  runtimeId: string;
  model: string;
} {
  const commandLine =
    url.searchParams.get("request") ??
    url.searchParams.get("q") ??
    url.searchParams.get("commandLine");

  if (commandLine) {
    const parsed = parseCommandLine(commandLine);

    return {
      agentId: parsed.agent,
      command: parsed.command,
      runtimeId: parsed.runtime,
      model: parsed.model,
    };
  }

  return {
    agentId: url.searchParams.get("agent") ?? "",
    command: url.searchParams.get("command") ?? "",
    runtimeId: url.searchParams.get("runtime") ?? "bunx",
    model: url.searchParams.get("model") ?? "",
  };
}

async function handleCommandRequest(url: URL): Promise<Response> {
  const { agentId, command, runtimeId, model } = getRequestParams(url);

  if (!agentId || !command) {
    return json<ErrorPayload>(
      { error: "Missing agent/command parameters." },
      400
    );
  }

  if (!model) {
    return json<ErrorPayload>({ error: "Missing model parameter." }, 400);
  }

  const runtime = findRuntime(runtimeId);
  if (!runtime) {
    return json<ErrorPayload>(
      {
        error: `Unknown runtime "${runtimeId}". Available: ${runtimes.map((r) => r.id).join(", ")}.`,
      },
      400
    );
  }

  const agent = findAgentCLI(agentId);
  if (!agent) {
    return json<ErrorPayload>(
      {
        error: `Unknown agent "${agentId}". Available: ${agentCLIs.map((a) => a.id).join(", ")}.`,
      },
      400
    );
  }

  const content = await getCommandContent(command, agentId);
  if (!content) {
    return json<ErrorPayload>({ error: `Command "${command}" was not found.` }, 404);
  }

  const prefixParts = runtime.prefix.trim().split(/\s+/);
  const args = [
    ...prefixParts,
    agent.package,
    command,
    agent.modelFlag,
    model,
  ];

  const display = `${runtime.prefix}${agent.package} ${command} ${agent.modelFlag} ${model}`.trim();

  const payload: CommandPayload = {
    agent: agentId,
    command,
    content,
    contentEncoding: "bytes",
    runtime: runtime.id,
    model,
    executable: args[0],
    args: args.slice(1),
    display,
  };

  return json(payload);
}

export const GET: APIRoute = ({ url }) => handleCommandRequest(url);

export const POST: APIRoute = async ({ request, url }) => {
  const contentType = request.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { request?: string };
    if (body.request) {
      url.searchParams.set("request", body.request);
    }
  } else {
    const body = await request.text();
    if (body.trim()) {
      url.searchParams.set("request", body);
    }
  }

  return handleCommandRequest(url);
};
