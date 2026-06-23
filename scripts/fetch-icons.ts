import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ICONS_DIR = join(import.meta.dir, "..", "src", "assets", "icons");
const API_BASE = "https://api.svgl.app";
const SVG_BASE = "https://svgl.app/library";

const needed = [
  { search: "npm", file: "npm.svg" },
  { search: "bun", file: "bun.svg" },
  { search: "pnpm", file: "pnpm.svg" },
  { search: "deno", file: "deno.svg" },
  { search: "anthropic", file: "anthropic.svg" },
  { search: "gemini", file: "gemini.svg" },
  { search: "openai", file: "openai.svg" },
  { search: "opencode", file: "opencode.svg" },
  { search: "sourcegraph", file: "sourcegraph.svg" },
  { search: "github", file: "github.svg" },
  { search: "mistral ai", file: "mistral-ai.svg" },
  { search: "deepseek", file: "deepseek.svg" },
  { search: "meta", file: "meta.svg" },
  { search: "groq", file: "groq.svg" },
  { search: "google", file: "google.svg" },
];

mkdirSync(ICONS_DIR, { recursive: true });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

for (const { search, file } of needed) {
  const filePath = join(ICONS_DIR, file);
  if (existsSync(filePath)) {
    console.log(`[cached] ${file}`);
    continue;
  }

  await sleep(800);

  try {
    const searchRes = await fetch(`${API_BASE}?search=${encodeURIComponent(search)}`);
    const results = await searchRes.json();

    if (!Array.isArray(results) || results.length === 0) {
      console.error(`[error] not found: ${search}`);
      continue;
    }

    const route = results[0].route;
    let svgUrl: string;

    if (typeof route === "string") {
      svgUrl = route;
    } else if (route && typeof route === "object") {
      svgUrl = route.dark || route.light;
    } else {
      console.error(`[error] no route for: ${search}`);
      continue;
    }

    const filename = svgUrl.split("/").pop();
    const optimizedUrl = `${API_BASE}/svg/${filename}`;
    await sleep(800);
    const svgRes = await fetch(optimizedUrl);
    const svgCode = await svgRes.text();

    if (svgCode.startsWith("<svg")) {
      writeFileSync(filePath, svgCode);
      console.log(`[ok] ${file} (${svgCode.length} bytes)`);
    } else {
      console.error(`[error] bad svg: ${search} — ${svgCode.substring(0, 100)}`);
    }
  } catch (e) {
    console.error(`[error] ${search}: ${e}`);
  }
}

console.log("\nDone. Icons saved to src/assets/icons/");