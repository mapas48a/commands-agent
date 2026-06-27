# commands.agent

 Marketplace de **slash-commands** para agentes de IA (OpenCode, Claude Code, Codex, Antigravity).

 El usuario busca un comando (ej. `/github-push`), ve su contenido `.md` (el prompt/instrucciones), y copia el comando listo para ejecutar con el runtime y modelo que eligió.

 **[commands.agent](https://commands.agent)**

 ## Stack

 - **Astro 7** — sitio mayormente estático con endpoint server-side (`/command`)
 - **`@astrojs/node`** — adapter para el endpoint on-demand
 - **Tailwind CSS v4** vía `@tailwindcss/vite`
 - **Turso** (libSQL) — base de datos de comandos, categorías y variantes
 - **TypeScript** strict
 - **Bun** como package manager y runtime
 - **Lucide** + **svgl.app** para iconos

 ## Estructura

 ```text
 /
 ├── src/
 │   ├── pages/
 │   │   ├── index.astro          # Buscador + lista de comandos
 │   │   ├── command/[id].astro   # Página de detalle por comando
 │   │   └── command.ts           # Endpoint server-side para el CLI
 │   ├── components/              # Header, Icon, Background
 │   ├── layouts/Layout.astro
 │   ├── styles/global.css        # Tailwind + design tokens
 │   ├── data/
 │   │   ├── config.ts           # Categorías, runtimes, agentes, modelos
 │   │   ├── icons.ts            # Iconos de marca (svgl.app)
 │   │   └── lucide-icons.ts    # Iconos Lucide
 │   └── lib/
 │       ├── turso.ts            # Cliente Turso
 │       └── queries.ts          # Queries a la BD
 ├── db/schema.sql               # Schema de Turso
 ├── scripts/
 │   ├── setup-turso.ts          # Crear tablas
 │   ├── seed-turso.ts           # Poblar BD desde config.ts
 │   └── fetch-icons.ts          # Re-fetch SVGs de svgl.app
 ├── script/cli/                 # CLI local (commands-agent)
 ├── .github/ISSUE_TEMPLATE/     # Templates de issues
 └── astro.config.mjs
 ```

 ## Comandos

 ```sh
 bun install                  # instalar deps
 bun dev                      # dev server en localhost:4321
 bun run build                # build de producción a dist/
 bun run preview              # servir el build
 bun astro check              # type-check .astro
 bun run scripts/seed-turso.ts # poblar la BD desde config.ts
 bun run scripts/setup-turso.ts # crear las tablas en Turso
 bun run scripts/fetch-icons.ts  # re-fetch de iconos de marca
 ```

 ## Setup

 1. **Clonar e instalar:**

    ```sh
    git clone https://github.com/mapas48a/commands-agent.git
    cd commands-agent
    bun install
    ```

 2. **Configurar Turso:**

    ```sh
    # Crear una base de datos en Turso (https://turso.tech)
    turso db create commands-agents

    # Obtener URL y token
    turso db show commands-agents --url
    turso db tokens create commands-agents

    # Crear .env
    echo "TURSO_DATABASE_URL=libsql://..." > .env
    echo "TURSO_AUTH_TOKEN=eyJ..." >> .env
    ```

 3. **Crear tablas y sembrar datos:**

    ```sh
    bun run scripts/setup-turso.ts   # crea las tablas
    bun run scripts/seed-turso.ts   # pobla desde src/data/config.ts
    ```

 4. **Levantar el dev server:**

    ```sh
    bun dev
    ```

 ## Formato de un comando

 Cada comando tiene:

 | Campo         | Descripción                                            |
 | ------------- | ------------------------------------------------------ |
 | `id` / slug   | Identificador único, ej. `github-push`                 |
 | `name`        | El slash-command con barra, ej. `/github-push`         |
 | `description` | Una línea describiendo qué hace                        |
 | `category`    | Categoría: `agent`, `workflow`, `devops`, `database`, `testing`, `build` |
 | `markdown`    | El prompt completo en formato markdown (ver abajo)      |
 | `variants`    | Variantes del prompt por agente (frontmatter + body)    |

 ### Estructura del prompt (.md)

 ```markdown
 # /command-name

 ## Description

 Breve descripción de qué hace el comando y cuándo usarlo.

 ## Instructions

 1. Paso uno.
 2. Paso dos.
 3. Paso tres.

 ## Example

 \`\`\`
 comando --flag valor
 \`\`\`

 ## Notes

 - Notas, advertencias o buenas prácticas.
 ```

 ### Variantes por agente

 Cada comando puede tener variantes específicas por agente. El contenido de la variante tiene frontmatter distinto según el agente:

 **OpenCode** (`opencode-command`):
 ```markdown
 ---
 description: Descripción corta del comando
 ---

 Cuerpo del prompt con las instrucciones.
 ```

 **Claude Code** (`claude-skill`):
 ```markdown
 ---
 name: command-name
 description: Descripción corta del comando.
 ---

 Cuerpo del prompt con las instrucciones.
 ```

 **Codex** (`codex-skill`):
 ```markdown
 ---
 name: command-name
 description: Descripción corta del comando.
 ---

 Cuerpo del prompt con las instrucciones.
 ```

 ### Formato del comando ejecutable

 ```sh
 {runtime} commands-agent-cli@0.1.0 {agent} /{command-name}
 ```

 Ejemplos:

 ```sh
 bunx commands-agent-cli@0.1.0 opencode /github-push
 npx commands-agent-cli@0.1.0 claude /create-pr
 pnpx commands-agent-cli@0.1.0 codex /lint-fix
 deno run --allow-all npm:commands-agent-cli@0.1.0 opencode /github-push
 ```

 ## CLI local

  El proyecto incluye un CLI en `script/cli/` que consulta el endpoint `/command` e instala el comando en la config del agente:

 ```sh
 cd script/cli
 bun install

 # Dry-run: solo imprime la ruta de instalación
 bun run src/index.ts opencode /github-push --dry-run

 # Ejecutar de verdad
 bun run src/index.ts opencode /github-push

  # Con otro runtime
  bun run src/index.ts claude /create-pr --runtime npx

 # Output JSON
 bun run src/index.ts codex /lint-fix --json
 ```

 > El dev server (`bun dev` en la raíz) debe estar corriendo para que el CLI pueda consultar `/command`.

 ## Cómo contribuir

 Todos los comandos se gestionan mediante **GitHub Issues**. No envíes PRs con comandos nuevos directamente: abre un issue con el template de solicitud de comando.

 ### Proponer un nuevo comando

 1. Ve a [**New Issue**](https://github.com/mapas48a/commands-agent/issues/new/choose) y selecciona **Solicitud de comando**.
 2. El título debe seguir el formato `command:'nombre-del-comando'` (ej. `command:'github-push'`).
 3. Completa los campos:
    - **Nombre del comando**: el slash-command con barra (`/github-push`).
    - **Categoría**: `agent`, `workflow`, `devops`, `database`, `testing`, o `build`.
    - **Descripción corta**: una línea.
    - **Agentes soportados**: lista separada por comas (`opencode, claude-code, codex`).
    - **Prompt (.md)**: el contenido del prompt siguiendo la estructura descrita arriba.
 4. Submit. Los mantenedores revisan y, si se aprueba, se agrega a `src/data/config.ts` y se siembra en Turso.

 ### Ejemplo de issue

 ```yaml
 Título: command:'docker-push'

 Nombre del comando: /docker-push
 Categoría: devops
 Descripción: Tag and push a Docker image to a registry
 Agentes: opencode, claude-code, codex
 Prompt:
   # /docker-push

   ## Description

   Tags a Docker image with the current commit SHA and latest, then pushes to the configured registry.

   ## Instructions

   1. Get the current commit SHA: `git rev-parse --short HEAD`.
   2. Tag the image: `docker tag <app>:latest <registry>/<app>:<sha>`.
   3. Push: `docker push <registry>/<app>:<sha>`.
   4. Verify the push was successful.
 ```

 ### Reportar bugs

 Abre un issue con el template **Bug report** describiendo el problema, pasos para reproducir, y comportamiento esperado.

 ### Discusiones

 Para ideas, preguntas o discusiones generales (que no sean solicitudes de comandos), usa [**Discussions**](https://github.com/mapas48a/commands-agent/discussions).

 ## Licencia

 MIT
