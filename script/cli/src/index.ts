#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { spawnSync } from "node:child_process";
import chalk, { type ChalkInstance } from "chalk";

interface CommandResponse {
  agent: string;
  command: string;
  runtime: string;
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

const PALETTE = {
  bg: chalk.bgHex("#0a0a0b"),
  frame: chalk.hex("#22c55e"),
  dim: chalk.hex("#52525b"),
  text: chalk.hex("#e4e4e7"),
  accent: chalk.hex("#22c55e"),
  warn: chalk.hex("#facc15"),
  err: chalk.hex("#ef4444"),
  info: chalk.hex("#06b6d4"),
  ok: chalk.hex("#22c55e"),
};

const SYM = {
  tl: "┌",
  tr: "┐",
  bl: "└",
  br: "┘",
  h: "─",
  v: "│",
  tee: "├",
  rev: "┤",
  cross: "┼",
  block: "█",
  shade: "░",
  light: "▒",
  medium: "▓",
  arrow: "▶",
  check: "✔",
  xmark: "✘",
  bullet: "◆",
  spinner: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
};

const WIDTH = 60;

function pad(s: string, w: number): string {
  const visible = s.replace(/\x1b\[[0-9;]*m/g, "");
  const gap = Math.max(0, w - visible.length);
  return s + " ".repeat(gap);
}

function frameLine(content: string, side: "tl" | "tr" | "bl" | "br"): string {
  const left = side === "tl" || side === "bl" ? SYM.tl : SYM.tr;
  const right = side === "tl" || side === "bl" ? SYM.bl : SYM.br;
  return `${PALETTE.frame(left)}${PALETTE.frame(SYM.h.repeat(WIDTH - 2))}${PALETTE.frame(right)}`;
}

function renderBox(title: string, lines: string[]): void {
  const inner = WIDTH - 4;
  console.log(frameLine("", "tl"));
  console.log(
    `${PALETTE.frame(SYM.v)} ${PALETTE.accent.bold(pad(`▌ ${title}`, inner + 1))}${PALETTE.frame(SYM.v)}`
  );
  console.log(
    `${PALETTE.frame(SYM.v)}${PALETTE.frame(SYM.h.repeat(WIDTH - 2))}${PALETTE.frame(SYM.v)}`
  );
  for (const line of lines) {
    console.log(`${PALETTE.frame(SYM.v)} ${pad(line, inner + 1)}${PALETTE.frame(SYM.v)}`);
  }
  console.log(frameLine("", "bl"));
}

function banner(): void {
  const pixelArt = [
    "  ▄▄▄       █    ██  ▄▄▄       ███▄    █  ▄▄▄       ███▄ ▄███▓",
    "  ▒████▄     ██  ▓██▒▒████▄     ██ ▀█   █ ▒████▄    ▓██▒▀█▀ ██▒",
    "  ▒██  ▀█▄  ▓██  ▒██░▒██  ▀█▄  ▓██  ▀█ ██▒▒██  ▀█▄  ▓██    ▓██░",
    "  ░██▄▄▄▄██ ▓▓█  ░██░░██▄▄▄▄██ ▓██▒  ▐▌██▒░██▄▄▄▄██ ▒██    ▒██ ",
    "   ▓█   ▓██▒▒▒█████▓  ▓█   ▓██▒▒██░   ▓██░ ▓█   ▓██▒▒██▒   ░██▒",
  ];
  const art = pixelArt.map((l) => PALETTE.accent.bold(l)).join("\n");
  console.log(art);
  console.log(
    PALETTE.dim(
      `   ${SYM.light.repeat(WIDTH - 6)}  v0.0.1`
    )
  );
  console.log();
}

function stepHeader(num: number, total: number, title: string, status: "pending" | "running" | "done" | "error"): void {
  const counter = `[${String(num).padStart(2, "0")}/${String(total).padStart(2, "0")}]`;
  let badge: string;
  let styled: string;
  switch (status) {
    case "pending":
      badge = PALETTE.dim(`${SYM.shade}${SYM.shade}${SYM.shade}${SYM.shade}`);
      styled = PALETTE.dim(title);
      break;
    case "running":
      badge = PALETTE.warn(`${SYM.block}${SYM.block}`);
      styled = PALETTE.warn.bold(title);
      break;
    case "done":
      badge = PALETTE.ok(`${SYM.check}${SYM.check}`);
      styled = PALETTE.text(title);
      break;
    case "error":
      badge = PALETTE.err(`${SYM.cross}${SYM.cross}`);
      styled = PALETTE.err(title);
      break;
  }
  console.log(`  ${PALETTE.dim(counter)} ${badge}  ${styled}`);
  console.log(`  ${PALETTE.dim(SYM.h.repeat(8))}  ${PALETTE.dim(SYM.shade.repeat(WIDTH - 12))}`);
}

function kv(key: string, value: string): string {
  return `${PALETTE.dim(key.padEnd(14, " "))} ${PALETTE.text(value)}`;
}

function sectionTitle(text: string): void {
  const line = `${PALETTE.frame(SYM.v)} ${PALETTE.accent.bold(text.toUpperCase())} ${PALETTE.dim(SYM.shade.repeat(Math.max(0, WIDTH - 6 - text.length)))}`;
  console.log(line);
}

const helpText = `
${PALETTE.accent.bold("commands-agent")} ${PALETTE.dim("— build and run an AI agent command")}

${PALETTE.text("Usage:")}
  ${PALETTE.warn("commands-agent")} <agent> <slash-command> <model> [options]

${PALETTE.text("Arguments:")}
  ${PALETTE.dim("<agent>")}          Agent CLI alias: opencode, codex, claude
  ${PALETTE.dim("<slash-command>")}  Command name, e.g. /github-push
  ${PALETTE.dim("<model>")}          Model identifier, e.g. claude-sonnet-4-20250514

${PALETTE.text("Options:")}
  ${PALETTE.warn("--runtime")} <runtime>  Package runner: bunx, npx, pnpx, deno (default: bunx)
  ${PALETTE.warn("--host")} <url>         Base URL of the command server (default: http://localhost:4321)
  ${PALETTE.warn("--dry-run")}            Print the command without executing it
  ${PALETTE.warn("--json")}               Output the raw JSON response from the server
  ${PALETTE.warn("--help")}               Show this help message

${PALETTE.text("Examples:")}
  ${PALETTE.dim("commands-agent opencode /github-push claude-sonnet-4-20250514")}
  ${PALETTE.dim("commands-agent claude /create-pr claude-opus-4-20250514 --runtime npx")}
  ${PALETTE.dim("commands-agent codex /review o4-mini --dry-run")}
`;

function printHelp(): never {
  console.log(helpText.trim());
  process.exit(0);
}

function fail(message: string, hint?: string): never {
  console.log();
  console.log(
    `  ${PALETTE.err(`${SYM.block}${SYM.block}`)}  ${PALETTE.err.bold("ERROR")} ${PALETTE.dim(SYM.h.repeat(2))} ${PALETTE.err(message)}`
  );
  if (hint) {
    console.log(`  ${PALETTE.dim(" ".repeat(8))}  ${PALETTE.dim(SYM.shade)} ${PALETTE.dim(hint)}`);
  }
  console.log();
  process.exit(1);
}

const agentAliases: Record<string, string> = {
  claude: "claude-code",
};

function parsePositionals(positionalArgs: string[]): {
  agent: string;
  command: string;
  model: string;
} {
  if (positionalArgs.length < 3) {
    fail(
      "Missing required arguments.",
      "Expected: <agent> <slash-command> <model>"
    );
  }

  const rawAgent = positionalArgs[0]!;
  const agent = agentAliases[rawAgent] ?? rawAgent;
  const command = positionalArgs[1]!;
  const model = positionalArgs[2]!;

  if (!command.startsWith("/")) {
    fail(
      `Invalid slash-command "${command}".`,
      `Expected format: /command-name`
    );
  }

  return { agent, command, model };
}

class Spinner {
  private frames = SYM.spinner;
  private i = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private label: string;
  private color: ChalkInstance;
  private isTty: boolean;

  constructor(label: string, color: ChalkInstance = PALETTE.warn) {
    this.label = label;
    this.color = color;
    this.isTty = Boolean(process.stdout.isTTY);
  }

  start(): void {
    if (this.isTty) process.stdout.write("\x1b[?25l");
    this.timer = setInterval(() => {
      const frame = this.frames[this.i % this.frames.length]!;
      this.i++;
      process.stdout.write(
        `\r  ${PALETTE.dim(" ".repeat(8))}  ${this.color(`${frame} `)}${PALETTE.dim(this.label)}   `
      );
    }, 80);
  }

  private showCursor(): void {
    if (this.isTty) process.stdout.write("\x1b[?25h");
  }

  stop(finalLabel?: string, finalColor: ChalkInstance = PALETTE.ok): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.showCursor();
    const text = finalLabel ?? this.label;
    process.stdout.write(
      `\r  ${PALETTE.dim(" ".repeat(8))}  ${finalColor(`${SYM.check} `)}${PALETTE.text(text)}     \n`
    );
  }

  fail(label?: string): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.showCursor();
    process.stdout.write(
      `\r  ${PALETTE.dim(" ".repeat(8))}  ${PALETTE.err(`${SYM.xmark} `)}${PALETTE.err(label ?? this.label)}     \n`
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCommand(
  host: string,
  params: {
    agent: string;
    command: string;
    runtime: string;
    model: string;
  }
): Promise<CommandResponse> {
  const url = new URL("/command", host);
  url.searchParams.set("agent", params.agent);
  url.searchParams.set("command", params.command);
  url.searchParams.set("runtime", params.runtime);
  url.searchParams.set("model", params.model);

  const spinner = new Spinner(`querying ${PALETTE.warn(host)}`);
  spinner.start();
  await sleep(400);
  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch (err) {
    spinner.fail("connection failed");
    fail(
      `Could not reach command server at ${host}.`,
      "Start it with: bun dev  (in the project root)"
    );
  }
  await sleep(200);
  spinner.stop(`endpoint ${PALETTE.info("/command")} reached`);

  const decodeSpinner = new Spinner("decoding server response");
  decodeSpinner.start();
  await sleep(300);
  let data: CommandResponse | ErrorResponse;
  try {
    data = (await response.json()) as CommandResponse | ErrorResponse;
  } catch {
    decodeSpinner.fail("invalid JSON in response");
    fail(
      `Server returned non-JSON for ${url.pathname}.`,
      `HTTP ${response.status} — is the dev server up? try: bun dev`
    );
  }
  decodeSpinner.stop(`payload parsed (${PALETTE.dim(`${Object.keys(data).length} fields`)})`);

  if (!response.ok || "error" in data) {
    fail(
      "error" in data ? data.error : `Server returned ${response.status}`,
      `HTTP ${response.status} from ${host}`
    );
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

  banner();

  if (values.json) {
    const { agent, command, model } = parsePositionals(positionals);
    const payload = await fetchCommand(values.host, {
      agent,
      command,
      runtime: values.runtime,
      model,
    });
    console.log(JSON.stringify(payload, null, 2));
    process.exit(0);
  }

  stepHeader(1, 5, "parse arguments", "running");
  const { agent, command, model } = parsePositionals(positionals);
  await sleep(250);
  console.log(`  ${PALETTE.dim(" ".repeat(8))}  ${PALETTE.dim(SYM.shade)} ${kv("agent", `${PALETTE.accent(agent)} ${PALETTE.dim("(resolved from alias)")}`)}`);
  console.log(`  ${PALETTE.dim(" ".repeat(8))}  ${PALETTE.dim(SYM.shade)} ${kv("command", PALETTE.warn(command))}`);
  console.log(`  ${PALETTE.dim(" ".repeat(8))}  ${PALETTE.dim(SYM.shade)} ${kv("model", PALETTE.info(model))}`);
  console.log(`  ${PALETTE.dim(" ".repeat(8))}  ${PALETTE.dim(SYM.shade)} ${kv("runtime", `${PALETTE.accent(values.runtime)} ${PALETTE.dim(`(${values.host})`)}`)}`);
  stepHeader(1, 5, "parse arguments", "done");
  console.log();

  stepHeader(2, 5, "resolve command metadata", "running");
  const metaSpinner = new Spinner("looking up slash-command definition");
  metaSpinner.start();
  await sleep(500);
  metaSpinner.stop(`command ${PALETTE.warn(command)} located`);
  stepHeader(2, 5, "resolve command metadata", "done");
  console.log();

  stepHeader(3, 5, "build executable payload", "running");
  const payload = await fetchCommand(values.host, {
    agent,
    command,
    runtime: values.runtime,
    model,
  });
  stepHeader(3, 5, "build executable payload", "done");
  console.log();

  stepHeader(4, 5, "render assembled command", "running");
  const inner = WIDTH - 4;
  const lines: string[] = [
    `  ${PALETTE.dim(SYM.shade)} ${PALETTE.dim(pad("executable", 12))} ${PALETTE.accent(payload.executable)}`,
    `  ${PALETTE.dim(SYM.shade)} ${PALETTE.dim(pad("args", 12))} ${PALETTE.text(payload.args.join(" "))}`,
    `  ${PALETTE.dim(SYM.shade)} ${PALETTE.dim(pad("full", 12))} ${PALETTE.warn.bold(payload.display)}`,
  ];
  for (const l of lines) console.log(l);
  stepHeader(4, 5, "render assembled command", "done");
  console.log();

  stepHeader(5, 5, values["dry-run"] ? "dry-run (skipping execute)" : "hand off to runtime", "running");
  if (values["dry-run"]) {
    await sleep(300);
    console.log(`  ${PALETTE.dim(" ".repeat(8))}  ${PALETTE.dim(SYM.shade)} ${PALETTE.warn("--dry-run")} ${PALETTE.dim("set, command NOT executed.")}`);
    stepHeader(5, 5, "dry-run (skipping execute)", "done");
    console.log();
    process.exit(0);
  }

  console.log(`  ${PALETTE.dim(" ".repeat(8))}  ${PALETTE.dim(SYM.shade)} ${PALETTE.dim("spawning")} ${PALETTE.accent(payload.executable)} ${PALETTE.dim("…")}`);
  console.log();
  const exitCode = executeCommand(payload.executable, payload.args);
  stepHeader(5, 5, "hand off to runtime", exitCode === 0 ? "done" : "error");
  console.log();
  process.exit(exitCode);
}

main().catch((err) => {
  console.log();
  console.log(
    `  ${PALETTE.err(`${SYM.block}${SYM.block}`)}  ${PALETTE.err.bold("UNCAUGHT")} ${PALETTE.dim(SYM.h.repeat(2))} ${PALETTE.err(err instanceof Error ? err.message : String(err))}`
  );
  console.log();
  process.exit(1);
});
