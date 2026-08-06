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

const goalsInfo = await client.execute("PRAGMA table_info(goals)");
if (!goalsInfo.rows.some((r) => r.name === "parent_goal_id")) {
  await client.execute(
    "ALTER TABLE goals ADD COLUMN parent_goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL",
  );
}

const goalReviewsInfo = await client.execute("PRAGMA table_info(goal_reviews)");
if (
  goalReviewsInfo.rows.length > 0 &&
  !goalReviewsInfo.rows.some((r) => r.name === "manual_content")
) {
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

for (const table of ["reports", "weekly_reports", "monthly_reports"]) {
  const info = await client.execute(`PRAGMA table_info(${table})`);
  const columns = info.rows.map((r) => r.name);
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

client.close();

console.log(`[init-db] ${url} を初期化しました。`);
