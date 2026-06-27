import type { APIRoute } from "astro";
import { getCommands } from "../lib/queries";

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const base = site?.href.replace(/\/$/, "") ?? "http://localhost:4321";
  const commands = await getCommands();

  const today = new Date().toISOString().split("T")[0];

  const urls: string[] = [
    `  <url>
    <loc>${base}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`,
  ];

  for (const cmd of commands) {
    urls.push(`  <url>
    <loc>${base}/command/${cmd.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};