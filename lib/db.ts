import { createClient, type InValue } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

const SCHEMA_PATH = path.join(process.cwd(), "db", "schema.sql");

const url = process.env.TURSO_DATABASE_URL ?? "file:./db/shinnyu.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken, intMode: "number" });

let ready: Promise<void> | null = null;

async function migrateReportTable(table: string): Promise<void> {
  const info = await client.execute(`PRAGMA table_info(${table})`);
  const columns = info.rows.map((r) => r.name as string);
  if (!columns.includes("manual_content")) {
    await client.execute(`ALTER TABLE ${table} ADD COLUMN manual_content TEXT`);
    await client.execute(`ALTER TABLE ${table} ADD COLUMN generated_content TEXT`);
    await client.execute(
      `UPDATE ${table} SET manual_content = content WHERE generated_by = 'manual' AND content IS NOT NULL`,
    );
    await client.execute(
      `UPDATE ${table} SET generated_content = content WHERE generated_by = 'gemini' AND content IS NOT NULL`,
    );
  }
  if (columns.includes("content")) {
    await client.execute(`ALTER TABLE ${table} DROP COLUMN content`);
  }
}

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
      const goalsInfo = await client.execute("PRAGMA table_info(goals)");
      const hasParentGoalId = goalsInfo.rows.some((r) => r.name === "parent_goal_id");
      if (!hasParentGoalId) {
        await client.execute("ALTER TABLE goals ADD COLUMN parent_goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL");
      }
      const goalReviewsInfo = await client.execute("PRAGMA table_info(goal_reviews)");
      const hasManualContent = goalReviewsInfo.rows.some((r) => r.name === "manual_content");
      if (goalReviewsInfo.rows.length > 0 && !hasManualContent) {
        await client.execute("DROP TABLE goal_reviews");
        await client.execute(`
          CREATE TABLE goal_reviews (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            scope             TEXT NOT NULL CHECK (scope IN ('weekly','monthly')),
            period_key        TEXT NOT NULL,
            manual_content    TEXT,
            generated_content TEXT,
            generated_by      TEXT NOT NULL DEFAULT 'gemini' CHECK (generated_by IN ('gemini','manual')),
            created_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            updated_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            UNIQUE(scope, period_key)
          )
        `);
      }
      await migrateReportTable("reports");
      await migrateReportTable("weekly_reports");
      await migrateReportTable("monthly_reports");
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
