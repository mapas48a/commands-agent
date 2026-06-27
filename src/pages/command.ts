import type { APIRoute } from "astro";
import { agentCLIs, commands, runtimes, type AgentCLI, type Command, type CommandVariant, type Runtime } from "../data/config";

export const prerender = false;

interface CommandPayload {
  agent: string;
  agentPackage: string;
  command: string;
  commandId: string;
  content: string;
  contentEncoding: "utf-8";
  variantFormat: string;
  runtime: string;
  model: string;
  modelFlag: string;
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

function findCommand(command: string): Command | undefined {
  const commandId = normalizeCommandId(command);

  return commands.find((c) => c.id === commandId || c.name === command);
}

function getCommandVariant(command: Command, agentId: string): CommandVariant | undefined {
  return command.variants.find((variant) => variant.agentCli === agentId);
}

function buildRuntimeArgs(runtime: Runtime, packageName: string): string[] {
  const prefixParts = runtime.prefix.trim().split(/\s+/).filter(Boolean);
  if (prefixParts.length === 0) {
    return [packageName];
  }

  const lastPart = prefixParts[prefixParts.length - 1] ?? "";
  if (lastPart.endsWith(":")) {
    return [...prefixParts.slice(0, -1), `${lastPart}${packageName}`];
  }

  return [...prefixParts, packageName];
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

  const commandEntry = findCommand(command);
  if (!commandEntry) {
    return json<ErrorPayload>({ error: `Command "${command}" was not found.` }, 404);
  }

  const variant = getCommandVariant(commandEntry, agentId);
  const content = variant?.content ?? commandEntry.markdown;
  const runtimeArgs = buildRuntimeArgs(runtime, agent.package);
  const args = model ? [
    ...runtimeArgs,
    command,
    agent.modelFlag,
    model,
  ] : [...runtimeArgs, command];

  const display = model
    ? `${runtime.prefix}${agent.package} ${command} ${agent.modelFlag} ${model}`.trim()
    : `${runtime.prefix}${agent.package} ${command}`.trim();

  const payload: CommandPayload = {
    agent: agentId,
    agentPackage: agent.package,
    command,
    commandId: commandEntry.id,
    content,
    contentEncoding: "utf-8",
    variantFormat: variant?.format ?? "markdown",
    runtime: runtime.id,
    model,
    modelFlag: agent.modelFlag,
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
