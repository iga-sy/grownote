import { createClient, type InValue } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

const SCHEMA_PATH = path.join(process.cwd(), "db", "schema.sql");

const url = process.env.TURSO_DATABASE_URL ?? "file:./db/shinnyu.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken, intMode: "number" });

let ready: Promise<void> | null = null;

async function ensureReady(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
      await client.executeMultiple(schema);
      const result = await client.execute("PRAGMA table_info(tasks)");
      const hasFileUrl = result.rows.some((r) => r.name === "file_url");
      if (!hasFileUrl) {
        await client.execute("ALTER TABLE tasks ADD COLUMN file_url TEXT");
      }
    })();
  }
  return ready;
}

interface Statement {
  all(...params: InValue[]): Promise<Record<string, unknown>[]>;
  get(...params: InValue[]): Promise<Record<string, unknown> | undefined>;
  run(
    ...params: InValue[]
  ): Promise<{ lastInsertRowid: number; changes: number }>;
}

function prepare(sql: string): Statement {
  return {
    async all(...params) {
      await ensureReady();
      const result = await client.execute({ sql, args: params });
      return result.rows as unknown as Record<string, unknown>[];
    },
    async get(...params) {
      await ensureReady();
      const result = await client.execute({ sql, args: params });
      return result.rows[0] as unknown as Record<string, unknown> | undefined;
    },
    async run(...params) {
      await ensureReady();
      const result = await client.execute({ sql, args: params });
      return {
        lastInsertRowid: Number(result.lastInsertRowid ?? 0),
        changes: result.rowsAffected,
      };
    },
  };
}

const db = { prepare };

export default db;
