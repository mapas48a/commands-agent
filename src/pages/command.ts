import type { APIRoute } from "astro";
import {
  commands,
  models as allModels,
  runtimes,
  type Command,
  type Runtime,
} from "../data/config";

export const prerender = false;

interface CommandPayload {
  category: string;
  command: string;
  runtime: string;
  agent: string;
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

function findCommand(
  categoryId: string,
  commandId: string
): Command | undefined {
  return commands.find(
    (cmd) =>
      cmd.category === categoryId && (cmd.id === commandId || cmd.name === commandId)
  );
}

function findRuntime(runtimeId: string): Runtime | undefined {
  return runtimes.find((r) => r.id === runtimeId);
}

function resolveModel(command: Command, requestedModel: string): string | undefined {
  const commandModels = command.models ?? allModels.map((m) => m.id);
  if (requestedModel && commandModels.includes(requestedModel)) {
    return requestedModel;
  }
  return commandModels[0];
}

export const GET: APIRoute = ({ url }) => {
  const category = url.searchParams.get("category") ?? "";
  const commandId = url.searchParams.get("command") ?? "";
  const runtimeId = url.searchParams.get("runtime") ?? "bunx";
  const agentHint = url.searchParams.get("agent") ?? "";
  const requestedModel = url.searchParams.get("model") ?? "";

  if (!category || !commandId) {
    return json<ErrorPayload>(
      { error: "Missing category/command path parameters." },
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

  const command = findCommand(category, commandId);
  if (!command) {
    return json<ErrorPayload>(
      { error: `Command "${category}/${commandId}" not found.` },
      404
    );
  }

  const modelId = resolveModel(command, requestedModel);
  if (!modelId) {
    return json<ErrorPayload>(
      { error: `Command "${command.id}" has no configured models.` },
      400
    );
  }

  const prefixParts = runtime.prefix.trim().split(/\s+/);
  const packageArg = command.agentPackage;
  const modelFlag = command.modelFlag;
  const args = [...prefixParts, packageArg, modelFlag, modelId];

  const display = `${runtime.prefix}${packageArg} ${modelFlag} ${modelId}`.trim();

  const payload: CommandPayload = {
    category,
    command: commandId,
    runtime: runtime.id,
    agent: agentHint || packageArg,
    model: modelId,
    executable: args[0],
    args: args.slice(1),
    display,
  };

  return json(payload);
};
