import { createClient } from "@libsql/client";

const url = import.meta.env.TURSO_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
const authToken = import.meta.env.TURSO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables.");
}

export const turso = createClient({
  url,
  authToken,
});
