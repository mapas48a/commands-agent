export interface Runtime {
  id: string;
  name: string;
  icon: string;
  prefix: string;
}

export interface Model {
  id: string;
  name: string;
  context?: string;
  provider: string;
}

export interface Provider {
  id: string;
  name: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  markdown: string;
  agentPackage: string;
  modelFlag: string;
  models?: string[];
}

export const categories: Category[] = [
  { id: "agent", name: "Agent", icon: "bot" },
  { id: "workflow", name: "Workflow", icon: "workflow" },
  { id: "devops", name: "DevOps", icon: "settings" },
  { id: "database", name: "Database", icon: "database" },
  { id: "testing", name: "Testing", icon: "test-tube" },
  { id: "build", name: "Build", icon: "package" },
];

export const runtimes: Runtime[] = [
  { id: "npx", name: "npm", icon: "npm", prefix: "npx " },
  { id: "bunx", name: "bun", icon: "bun", prefix: "bunx " },
  { id: "pnpx", name: "pnpm", icon: "pnpm", prefix: "pnpx " },
  {
    id: "deno",
    name: "deno",
    icon: "deno",
    prefix: "deno run --allow-all npm:",
  },
];

export const providers: Provider[] = [
  { id: "anthropic", name: "Anthropic", icon: "anthropic" },
  { id: "google", name: "Google", icon: "google" },
  { id: "openai", name: "OpenAI", icon: "openai" },
  { id: "mistral", name: "Mistral AI", icon: "mistral-ai" },
  { id: "deepseek", name: "DeepSeek", icon: "deepseek" },
  { id: "meta", name: "Meta", icon: "meta" },
  { id: "groq", name: "Groq", icon: "groq" },
];

export const models: Model[] = [
  { id: "claude-sonnet-4-20250514", name: "Sonnet 4", context: "200K", provider: "anthropic" },
  { id: "claude-opus-4-20250514", name: "Opus 4", context: "200K", provider: "anthropic" },
  { id: "claude-3-7-sonnet-20250219", name: "3.7 Sonnet", context: "200K", provider: "anthropic" },
  { id: "claude-3-5-haiku-20241022", name: "3.5 Haiku", context: "200K", provider: "anthropic" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", context: "1M", provider: "google" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", context: "1M", provider: "google" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", context: "1M", provider: "google" },
  { id: "gpt-4.1", name: "GPT-4.1", context: "1M", provider: "openai" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 mini", context: "1M", provider: "openai" },
  { id: "gpt-4o", name: "GPT-4o", context: "128K", provider: "openai" },
  { id: "o4-mini", name: "o4-mini", context: "128K", provider: "openai" },
  { id: "o3", name: "o3", context: "200K", provider: "openai" },
  { id: "mistral-large-latest", name: "Large", context: "128K", provider: "mistral" },
  { id: "mistral-medium-latest", name: "Medium", context: "128K", provider: "mistral" },
  { id: "codestral-latest", name: "Codestral", context: "256K", provider: "mistral" },
  { id: "deepseek-chat", name: "Chat", context: "128K", provider: "deepseek" },
  { id: "deepseek-reasoner", name: "Reasoner", context: "128K", provider: "deepseek" },
  { id: "llama-4-maverick", name: "Llama 4 Maverick", context: "1M", provider: "meta" },
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", context: "128K", provider: "meta" },
  { id: "llama-3.1-8b", name: "Llama 3.1 8B", context: "128K", provider: "meta" },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Groq)", context: "128K", provider: "groq" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant (Groq)", context: "128K", provider: "groq" },
];

export const commands: Command[] = [
  {
    id: "github-push",
    name: "/github-push",
    description: "Stage, commit with conventional message, and push to remote",
    category: "workflow",
    agentPackage: "opencode-ai",
    modelFlag: "--model",
    markdown: `# /github-push

## Description

Stages all changes, generates a conventional commit message based on the diff,
and pushes to the current branch's remote. Creates the remote branch if it
doesn't exist.

## Instructions

1. Run \`git status\` to see what changed.
2. Run \`git add -A\` to stage all changes.
3. Analyze the diff with \`git diff --cached\` and write a commit message using
   the **conventional commits** format:
   - \`feat:\` for new features
   - \`fix:\` for bug fixes
   - \`refactor:\` for code restructuring
   - \`docs:\` for documentation
   - \`chore:\` for maintenance tasks
4. Commit with \`git commit -m "<message>"\`.
5. Push with \`git push -u origin HEAD\`.

## Example

\`\`\`
git add -A
git commit -m "feat: add user authentication flow"
git push -u origin HEAD
\`\`\`

## Notes

- Never use \`--force\` unless explicitly asked.
- If the branch is behind remote, suggest a \`git pull --rebase\` first.`,
  },
  {
    id: "create-pr",
    name: "/create-pr",
    description: "Create a GitHub pull request from current branch",
    category: "workflow",
    agentPackage: "opencode-ai",
    modelFlag: "--model",
    markdown: `# /create-pr

## Description

Creates a GitHub pull request from the current branch to the default branch
using the \`gh\` CLI. Generates the PR title and body from the commit history
and diff.

## Instructions

1. Check the current branch: \`git branch --show-current\`.
2. Fetch the commit log between main and HEAD: \`git log main..HEAD --oneline\`.
3. Generate a concise PR title from the commits.
4. Generate a structured PR body with **Summary**, **Changes**, **Testing**.
5. Run \`gh pr create --title "<title>" --body "<body>"\`.

## Example

\`\`\`
gh pr create \\
  --title "feat: add OAuth login" \\
  --body "## Summary
  Adds Google OAuth authentication flow."
\`\`\``,
  },
  {
    id: "lint-fix",
    name: "/lint-fix",
    description: "Run the linter and auto-fix all fixable issues",
    category: "agent",
    agentPackage: "opencode-ai",
    modelFlag: "--model",
    markdown: `# /lint-fix

## Description

Detects the project's linter (ESLint, Ruff, RuboCop, etc.), runs it with
\`--fix\`, and resolves all auto-fixable issues.

## Instructions

1. Detect the linter by checking config files:
   - \`eslint.config.*\` → ESLint
   - \`ruff.toml\` → Ruff
   - \`.rubocop.yml\` → RuboCop
2. Run \`--fix\`:
   - ESLint: \`bunx eslint . --fix\`
   - Ruff: \`ruff check --fix .\`
   - RuboCop: \`rubocop -A\`
3. Show a summary of what was fixed.`,
  },
  {
    id: "deploy-vercel",
    name: "/deploy-vercel",
    description: "Build and deploy the project to Vercel",
    category: "devops",
    agentPackage: "opencode-ai",
    modelFlag: "--model",
    markdown: `# /deploy-vercel

## Description

Builds the project and deploys it to Vercel using the Vercel CLI.

## Instructions

1. Install Vercel CLI if needed: \`bunx vercel\`.
2. Run \`vercel link\` if the project isn't linked yet.
3. Run \`vercel env pull .env.local\` to sync environment variables.
4. Build the project: \`bun run build\`.
5. Deploy: \`vercel --prod\`.
6. Print the deployment URL.`,
  },
  {
    id: "docker-build",
    name: "/docker-build",
    description: "Build and tag a Docker image for production",
    category: "devops",
    agentPackage: "opencode-ai",
    modelFlag: "--model",
    markdown: `# /docker-build

## Description

Builds a production Docker image, tags it with the current git commit SHA
and \`latest\`, and optionally pushes to a registry.

## Instructions

1. Get the current commit SHA: \`git rev-parse --short HEAD\`.
2. Build the image: \`docker build -t <app>:<sha> -t <app>:latest .\`
3. If a registry is configured, push.
4. Print the image size and SHA tag.

## Notes

- Use multi-stage builds to minimize image size.
- Always pin the base image version.`,
  },
  {
    id: "db-migrate",
    name: "/db-migrate",
    description: "Create and run a database migration",
    category: "database",
    agentPackage: "opencode-ai",
    modelFlag: "--model",
    markdown: `# /db-migrate

## Description

Detects the migration tool (Prisma, Drizzle, Knex, Alembic), creates a new
migration based on schema changes, and applies it.

## Instructions

1. Detect the migration tool from config files.
2. Generate the migration:
   - Prisma: \`bunx prisma migrate dev --name <name>\`
   - Drizzle: \`bunx drizzle-kit generate\`
   - Knex: \`bunx knex migrate:make <name>\`
   - Alembic: \`alembic revision --autogenerate -m "<name>"\`
3. Apply the migration.
4. Show the migration diff summary.`,
  },
  {
    id: "db-seed",
    name: "/db-seed",
    description: "Seed the database with example data",
    category: "database",
    agentPackage: "opencode-ai",
    modelFlag: "--model",
    markdown: `# /db-seed

## Description

Runs the database seed script to populate the database with example data
for local development.

## Instructions

1. Detect the seed script location.
2. Run the seed: \`bun run db:seed\` or \`bunx prisma db seed\`.
3. Print a summary of records inserted.

## Notes

- Only run in non-production environments.
- Use idempotent inserts (upsert / ON CONFLICT).`,
  },
  {
    id: "test-run",
    name: "/test-run",
    description: "Run the test suite and report results",
    category: "testing",
    agentPackage: "opencode-ai",
    modelFlag: "--model",
    markdown: `# /test-run

## Description

Detects the test runner (Vitest, Jest, Playwright, pytest, etc.), runs the
full test suite, and reports pass/fail counts with failure details.

## Instructions

1. Detect the test runner from config files.
2. Run the tests:
   - Vitest: \`bunx vitest run\`
   - Jest: \`npx jest\`
   - Playwright: \`npx playwright test\`
   - pytest: \`pytest -v\`
3. Parse the output and show counts + failure details.`,
  },
  {
    id: "test-e2e",
    name: "/test-e2e",
    description: "Run end-to-end tests with Playwright",
    category: "testing",
    agentPackage: "opencode-ai",
    modelFlag: "--model",
    markdown: `# /test-e2e

## Description

Runs Playwright end-to-end tests. If Playwright isn't installed, bootstraps
it with \`bunx playwright install\`.

## Instructions

1. Check for \`playwright.config.*\`. If missing, scaffold: \`bunx playwright init\`.
2. Install browsers: \`bunx playwright install\`.
3. Run the tests: \`bunx playwright test\`.
4. If tests fail, show the trace viewer URL.

## Example

\`\`\`
bunx playwright install
bunx playwright test --reporter=line
\`\`\``,
  },
  {
    id: "build-prod",
    name: "/build-prod",
    description: "Build the project for production",
    category: "build",
    agentPackage: "opencode-ai",
    modelFlag: "--model",
    markdown: `# /build-prod

## Description

Runs the production build, validates the output directory, and reports
build size statistics.

## Instructions

1. Detect the build command from \`package.json\` scripts.
2. Run the build: \`bun run build\`.
3. Check the output directory (\`dist/\` or \`.next/\`).
4. Print build time, total output size, largest files (top 5).

## Notes

- Fail the build if there are TypeScript errors.
- Run \`bun astro check\` or \`tsc\` before building if configured.`,
  },
  {
    id: "build-analyze",
    name: "/build-analyze",
    description: "Analyze the production bundle for size optimizations",
    category: "build",
    agentPackage: "opencode-ai",
    modelFlag: "--model",
    markdown: `# /build-analyze

## Description

Builds the project and analyzes the bundle to find size optimization
opportunities.

## Instructions

1. Build the project in analysis mode.
2. Print the top 10 largest modules.
3. Suggest optimizations:
   - Tree-shake unused exports
   - Split large chunks
   - Replace heavy dependencies with lighter alternatives`,
  },
  {
    id: "git-clean-branches",
    name: "/git-clean-branches",
    description: "Delete merged local branches",
    category: "workflow",
    agentPackage: "opencode-ai",
    modelFlag: "--model",
    markdown: `# /git-clean-branches

## Description

Lists and deletes local branches that have been merged into the main branch.

## Instructions

1. Switch to the main branch: \`git checkout main\`.
2. List merged branches:\n   \`git branch --merged main | grep -v "^\\*\\|main\\|master"\`\n3. Ask for confirmation before deleting.
4. Delete each confirmed branch: \`git branch -d <branch-name>\`
5. Prune remote tracking: \`git remote prune origin\``,
  },
  {
    id: "agent-review",
    name: "/agent-review",
    description: "Review the current diff for bugs and improvements",
    category: "agent",
    agentPackage: "opencode-ai",
    modelFlag: "--model",
    markdown: `# /agent-review

## Description

Reviews the current uncommitted diff and provides actionable feedback on bugs,
style, and potential improvements.

## Instructions

1. Get the diff: \`git diff\` or \`git diff main...HEAD\`.
2. Analyze for: **Bugs**, **Security**, **Performance**, **Style**.
3. Output a structured review:
   - Critical — must fix before merge
   - Warning — should fix
   - Suggestion — nice to have
4. For each item, show file, line, and suggested fix.

## Notes

- Focus on the changed lines, not the whole file.
- Don't suggest changes that would break existing tests.`,
  },
  {
    id: "agent-docs",
    name: "/agent-docs",
    description: "Generate documentation from the codebase",
    category: "agent",
    agentPackage: "opencode-ai",
    modelFlag: "--model",
    markdown: `# /agent-docs

## Description

Scans the codebase and generates or updates documentation files
(README, API docs, TSDoc comments).

## Instructions

1. Detect the project type and language.
2. Scan exported functions, classes, and components.
3. For each public API, generate TSDoc/JSDoc comments with \`@param\`,
   \`@returns\`, \`@example\`.
4. Update \`README.md\` if it has a "## API" section.
5. Generate \`docs/\` with per-module markdown files if configured.

## Notes

- Don't overwrite manually-written docs — only update generated sections.
- Mark generated sections with \`<!-- AUTO-GENERATED -->\` HTML comments.`,
  },
  {
    id: "ci-fix",
    name: "/ci-fix",
    description: "Diagnose and fix a failing CI pipeline",
    category: "devops",
    agentPackage: "opencode-ai",
    modelFlag: "--model",
    markdown: `# /ci-fix

## Description

Reads the CI configuration (GitHub Actions / GitLab CI), identifies the
failing job, and suggests or applies a fix.

## Instructions

1. Read the CI config: \`.github/workflows/*.yml\` or \`.gitlab-ci.yml\`.
2. Identify which job is failing.
3. Analyze the error: build failure, test failure, lint, timeout.
4. Apply a fix to the code or config.
5. Commit the fix and push to trigger a new run.

## Example

\`\`\`
gh run list --limit 1 --json conclusion,name | jq -r '.[0]'
gh run view <run-id> --log-failed
\`\`\``,
  },
];