# commands-agent-cli

CLI companion for the commands.agent marketplace.

## Usage

```bash
commands-agent <category>/<command> <agent> <model> [options]
```

### Arguments

- `<category>/<command>` — Command path, e.g. `workflow/github-push`
- `<agent>` — Agent CLI alias or package, e.g. `opencode`, `codex`, `claude`
- `<model>` — Model identifier, e.g. `claude-sonnet-4-20250514`

### Options

- `--runtime <runtime>` — Package runner: `bunx`, `npx`, `pnpx`, `deno` (default: `bunx`)
- `--host <url>` — Base URL of the command server (default: `http://localhost:4321`)
- `--dry-run` — Print the command without executing it
- `--json` — Output the raw JSON response from the server
- `--help` — Show help message

### Examples

```bash
# Print command without running it
commands-agent workflow/github-push opencode claude-sonnet-4-20250514 --dry-run

# Run with npm/npx
commands-agent workflow/create-pr claude claude-opus-4-20250514 --runtime npx

# Get JSON output
commands-agent agent/agent-review codex o4-mini --json
```

## Development

```bash
bun install
bun run typecheck
bun run src/index.ts workflow/github-push opencode claude-sonnet-4-20250514 --dry-run
```

Make sure the Astro dev server is running (`bun dev` in the project root) so the `/command` endpoint is available.
