# commands-agent-cli

CLI companion for the commands.agent marketplace. Published as `commands-agent-cli@0.1.0` and installs marketplace slash commands into the selected agent CLI configuration.

## Usage

```bash
commands-agent <agent> <slash-command> [model] [options]
```

### Arguments

- `<agent>` — Agent CLI alias: `opencode`, `codex`, `claude` (alias of `claude-code`), `claude-code`, `antigravity`
- `<slash-command>` — Command name to install, e.g. `/github-push`
- `[model]` — Optional model identifier, only kept for compatibility with older invocations

### Options

- `--host <url>` — Base URL of the command server (default: `https://commands-agent.netlify.app`)
- `--config-dir <path>` — Override the base config directory used to install files
- `--force` — Overwrite an existing installed command
- `--dry-run` — Print the target file without writing it
- `--json` — Output install metadata as JSON
- `--help` — Show help message

The CLI fetches the agent-specific markdown from `/command` and writes it to the selected agent's command directory. The `model` argument and `--model` flag are accepted for compatibility, but they are ignored.

Default install targets:

- OpenCode: `$XDG_CONFIG_HOME/opencode/command/<command>.md` or `~/.config/opencode/command/<command>.md`
- Claude Code: `~/.claude/commands/<command>.md`
- Codex: `$CODEX_HOME/prompts/<command>.md` or `~/.codex/prompts/<command>.md`

### Examples

```bash
# Show where the command would be installed
commands-agent opencode /github-push --dry-run
# → ~/.config/opencode/command/github-push.md

# Run the published package
bunx commands-agent-cli@0.1.0 opencode /github-push

# Install a Claude Code slash command
commands-agent claude /create-pr
# → ~/.claude/commands/create-pr.md

# Install into a custom config root
commands-agent codex /agent-review --config-dir /tmp/agent-config --dry-run
```

## Development

```bash
bun install
bun run build
bun run typecheck
bun run src/index.ts opencode /github-push --dry-run
```

For local development, point `--host` at `http://localhost:4321`. The endpoint reads commands from `src/data/config.ts`; no Turso database is required.
