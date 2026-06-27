# commands-agent-cli

CLI companion for the commands.agent marketplace.

## Usage

```bash
commands-agent <agent> <slash-command> <model> [options]
```

### Arguments

- `<agent>` — Agent CLI alias: `opencode`, `codex`, `claude` (alias of `claude-code`), `claude-code`, `antigravity`
- `<slash-command>` — Command name, e.g. `/github-push`
- `<model>` — Model identifier, e.g. `claude-sonnet-4-20250514`

### Options

- `--runtime <runtime>` — Package runner: `bunx`, `npx`, `pnpx`, `deno` (default: `bunx`)
- `--host <url>` — Base URL of the command server (default: `http://localhost:4321`)
- `--dry-run` — Print the command without executing it
- `--json` — Output the raw JSON response from the server
- `--help` — Show help message

The CLI fetches the command prompt from `/command` and passes that prompt to the selected agent. The dry-run output shows `<prompt>` as a placeholder instead of printing the full markdown in the assembled command.

### Examples

```bash
# Print command without running it
commands-agent opencode /github-push claude-sonnet-4-20250514 --dry-run
# → bunx opencode-ai /github-push --model claude-sonnet-4-20250514

# Run with npm/npx
commands-agent claude /create-pr claude-opus-4-20250514 --runtime npx
# → npx @anthropic-ai/claude-code /create-pr --model claude-opus-4-20250514

# Get JSON output
commands-agent codex /review o4-mini --json
```

## Development

```bash
bun install
bun run build
bun run typecheck
bun run src/index.ts opencode /github-push claude-sonnet-4-20250514 --dry-run
```

Make sure the Astro dev server is running (`bun dev` in the project root) so the `/command` endpoint is available. The endpoint reads commands from `src/data/config.ts`; no Turso database is required for local development.
