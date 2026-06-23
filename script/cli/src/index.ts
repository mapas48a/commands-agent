#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { spawnSync } from "node:child_process";

interface CommandResponse {
  category: string;
  command: string;
  runtime: string;
  agent: string;
  model: string;
  executable: string;
  args: string[];
  display: string;
}

interface ErrorResponse {
  error: string;
}

const DEFAULT_HOST = "http://localhost:4321";
const DEFAULT_RUNTIME = "bunx";

const helpText = `
commands-agent — build and run an AI agent command

Usage:
  commands-agent <category>/<command> <agent> <model> [options]

Arguments:
  <category>/<command>   Command path, e.g. workflow/github-push
  <agent>                Agent CLI alias or package: opencode, codex, claude
  <model>                Model identifier, e.g. claude-sonnet-4-20250514

Options:
  --runtime <runtime>    Package runner: bunx, npx, pnpx, deno (default: bunx)
  --host <url>           Base URL of the command server (default: http://localhost:4321)
  --dry-run              Print the command without executing it
  --json                 Output the raw JSON response from the server
  --help                 Show this help message

Examples:
  commands-agent workflow/github-push opencode claude-sonnet-4-20250514
  commands-agent workflow/create-pr claude claude-opus-4-20250514 --runtime npx
  commands-agent agent/agent-review codex o4-mini --dry-run
`;

function printHelp(): never {
  console.log(helpText.trim());
  process.exit(0);
}

function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function parsePositionals(positionalArgs: string[]): {
  category: string;
  command: string;
  agent: string;
  model: string;
} {
  if (positionalArgs.length < 3) {
    fail(
      "Missing required arguments. Expected: <category>/<command> <agent> <model>"
    );
  }

  const pathSpec = positionalArgs[0]!;
  const agent = positionalArgs[1]!;
  const model = positionalArgs[2]!;

  const [category, command] = pathSpec.split("/");

  if (!category || !command) {
    fail(
      `Invalid command path "${pathSpec}". Expected format: category/command`
    );
  }

  return { category, command, agent, model };
}

async function fetchCommand(
  host: string,
  params: {
    category: string;
    command: string;
    runtime: string;
    agent: string;
    model: string;
  }
): Promise<CommandResponse> {
  const url = new URL("/command", host);
  url.searchParams.set("category", params.category);
  url.searchParams.set("command", params.command);
  url.searchParams.set("runtime", params.runtime);
  url.searchParams.set("agent", params.agent);
  url.searchParams.set("model", params.model);

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch (err) {
    fail(
      `Could not reach command server at ${host}.\nStart it with: bun dev\n\n${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  const data = (await response.json()) as CommandResponse | ErrorResponse;

  if (!response.ok || "error" in data) {
    fail("error" in data ? data.error : `Server returned ${response.status}`);
  }

  if (
    typeof data.executable !== "string" ||
    !Array.isArray(data.args) ||
    typeof data.display !== "string"
  ) {
    fail("Server returned an invalid command payload.");
  }

  return data as CommandResponse;
}

function executeCommand(executable: string, args: string[]): number {
  const result = spawnSync(executable, args, {
    stdio: "inherit",
    shell: false,
  });

  return result.status ?? 1;
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      runtime: { type: "string", default: DEFAULT_RUNTIME },
      host: { type: "string", default: DEFAULT_HOST },
      "dry-run": { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printHelp();
  }

  const { category, command, agent, model } = parsePositionals(positionals);

  const payload = await fetchCommand(values.host, {
    category,
    command,
    runtime: values.runtime,
    agent,
    model,
  });

  if (values.json) {
    console.log(JSON.stringify(payload, null, 2));
    process.exit(0);
  }

  console.log(`Command: ${payload.display}`);

  if (values["dry-run"]) {
    console.log("(dry run — not executed)");
    process.exit(0);
  }

  const exitCode = executeCommand(payload.executable, payload.args);
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
