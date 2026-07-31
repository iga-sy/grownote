import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

const SCHEMA_PATH = path.join(process.cwd(), "db", "schema.sql");
const url = process.env.TURSO_DATABASE_URL ?? "file:./db/shinnyu.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken, intMode: "number" });

await client.executeMultiple(fs.readFileSync(SCHEMA_PATH, "utf-8"));

const result = await client.execute("PRAGMA table_info(tasks)");
if (!result.rows.some((r) => r.name === "file_url")) {
  await client.execute("ALTER TABLE tasks ADD COLUMN file_url TEXT");
}

client.close();

console.log(`[init-db] ${url} を初期化しました。`);
