## Project

Marketplace de **slash-commands** para agentes de IA (OpenCode, Claude Code, etc.). El usuario busca un comando (ej. `/github-push`), ve su contenido `.md` (el prompt/instrucciones), y copia el comando listo para ejecutar con el runtime y modelo que eligió.

No hay backend persistente. Astro components + Tailwind v4. El sitio es mayormente estático, pero incluye un endpoint server-side (`/command`) usado por el CLI local.

## Concepto

- Los **comandos** son prompts en formato markdown ( archivos `.md` ) agrupados por **categorías** (agent, workflow, devops, database, testing, build, etc.)
- El buscador principal (tipo skills.sh) filtra comandos por nombre/categoría/contenido
- Al hacer click en un comando se expande un panel que muestra:
  1. El contenido completo del `.md` (el prompt del comando)
  2. Un **selector compacto**: runtime (`npx`/`bunx`/`pnpx`/`deno`) + agent CLI (opencode, claude-code, codex, antigravity) + modelo
  3. El comando final ensamblado + botón de copiar
- El formato del comando es: `{runtime} {agent-package} /{command-name} {model-flag} {model}`
  - Ejemplo: `bunx opencode-ai /github-push --model claude-sonnet-4-20250514`
- Iconos de categorías/UI: **Lucide** (`lucide-static`, SVGs cached en `src/assets/lucide/`)
- Iconos de marcas: **svgl.app** (SVGs cached en `src/assets/icons/`)

## Stack

- Astro 7 (mostly static site, with `@astrojs/node` adapter for the `/command` endpoint)
- `@astrojs/node` — server adapter for on-demand `/command` endpoint
- Tailwind CSS v4 via `@tailwindcss/vite` (NOT `@astrojs/tailwind` — that integration is removed in v4)
- TypeScript strict (`astro/tsconfigs/strict`)
- Bun as the package manager (`bun.lock` is committed)
- Node `>=22.12.0` (declared in `package.json#engines`)
- `lucide-static` para iconos de UI/categorías

## Layout

- `src/pages/index.astro` — única página; buscador + lista de comandos + paneles expandibles
- `src/components/` — `.astro` components (Header, Icon, CommandPanel, etc.)
- `src/layouts/Layout.astro` — single HTML shell; import `../styles/global.css` here
- `src/styles/global.css` — `@import "tailwindcss";` + `@theme` design tokens (dark theme)
- `src/data/config.ts` — definición de categorías, runtimes, agentes CLI (`agentCLIs`) y comandos
- `src/pages/command.ts` — endpoint server-side que ensambla el comando ejecutable para el CLI
- `script/cli/` — CLI local (`commands-agent`) que consulta `/command` y ejecuta el agente
- `src/data/icons.ts` — registry de iconos de marca (svgl.app, cached como `?raw` imports)
- `src/data/lucide-icons.ts` — registry de iconos Lucide (`?raw` imports from `src/assets/lucide/`)
- `src/assets/icons/` — SVGs de marcas (svgl.app, descargados via `scripts/fetch-icons.ts`)
- `src/assets/lucide/` — SVGs de Lucide (copiados de `node_modules/lucide-static/icons/`)
- `public/` — static assets served as-is
- `.astro/` — generated types; gitignored, do not edit

## Commands

- `bun install` — install deps
- `bun dev` — start dev server on `localhost:4321`; **always run in background**: `astro dev --background`, then manage with `astro dev stop | status | logs`
- `bun build` — produce site in `dist/` (static pages + Node server for `/command`)
- `bun preview` — serve the built site
- `bun astro check` — type-check `.astro` files (run this before finishing a change; no separate lint is configured)
- `bun astro add <integration>` — scaffold an integration (will modify `astro.config.mjs`)
- `bun scripts/fetch-icons.ts` — re-fetch brand SVGs from svgl.app API (rate-limited, has 800ms delays)

## Conventions

- Pages: minimal frontmatter, compose one `Layout` + components. No business logic in `pages/`.
- Styles: prefer Tailwind utility classes. For custom CSS, extend the `@theme` block in `src/styles/global.css` rather than scattering `<style>` tags.
- Components are `.astro` unless interactivity (clicks, state) is required; then reach for a framework integration (React/Svelte/Vue) added via `bun astro add`.
- TypeScript: strict mode is on. Type component props with `interface Props` in the frontmatter.
- No tests are configured. Verify changes with `bun astro check` and visual review in dev.
- Los comandos viven en `src/data/config.ts` con su contenido markdown como string. Mantener esto sincronizado si se agregan comandos nuevos.

## Available skills (load via the skill tool when relevant)

- `.agents/skills/astro` — Astro-specific patterns
- `.agents/skills/tailwind-css-patterns` — Tailwind v4 patterns + component/layout references
- `.agents/skills/frontend-design` — visual design guidance (dark theme, monospace, badge pills)
- `.agents/skills/accessibility` — a11y patterns
- `.agents/skills/seo` — meta tags, structured data
- `.agents/skills/bun` — Bun-specific notes
- `.agents/skills/typescript-advanced-types` — TS type patterns

## Design reference

- Dark background (`#0a0a0b`), light text, accent green (`#22c55e`) for headings/brand
- Monospace font for commands and code
- Buscador estilo skills.sh con keyboard hint `/`
- Category filter pills/tags arriba del buscador o al lado
- Lista de comandos expandible al hacer click — el panel muestra `.md` content + selector compacto + copy button
- Terminal-style command output