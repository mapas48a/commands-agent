import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const base = site?.href.replace(/\/$/, "") ?? "http://localhost:4321";
  const body = `# commands.agent
User-agent: *
Allow: /

# Bloquea el endpoint dinamico del CLI
Disallow: /command$

Sitemap: ${base}/sitemap.xml
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};