import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapGoalReview } from "@/lib/types";
import { addDays } from "@/lib/date";
import { buildGoalReviewPrompt, generateGoalReview } from "@/lib/gemini";

export const dynamic = "force-dynamic";

type Scope = "weekly" | "monthly";

function isScope(value: unknown): value is Scope {
  return value === "weekly" || value === "monthly";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");
  const periodKey = searchParams.get("periodKey");

  if (!isScope(scope) || !periodKey) {
    return NextResponse.json(
      { error: "scope(weekly|monthly)とperiodKeyは必須です。" },
      { status: 400 },
    );
  }

  const row = await db
    .prepare("SELECT * FROM goal_reviews WHERE scope = ? AND period_key = ?")
    .get(scope, periodKey);

  return NextResponse.json({ data: row ? mapGoalReview(row as never) : null });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { scope, periodKey } = body as { scope?: string; periodKey?: string };

  if (!isScope(scope) || !periodKey) {
    return NextResponse.json(
      { error: "scope(weekly|monthly)とperiodKeyは必須です。" },
      { status: 400 },
    );
  }

  let periodLabel: string;
  let goals: { title: string; progress: number; parentTitle?: string | null }[];
  let sourceReports: { label: string; content: string }[];

  if (scope === "weekly") {
    const weekEndDate = addDays(periodKey, 6);
    periodLabel = `${periodKey} 〜 ${weekEndDate} の週`;

    const goalRows = await db
      .prepare(
        `SELECT g.title AS title, g.progress AS progress, p.title AS parent_title
         FROM goals g
         LEFT JOIN goals p ON p.id = g.parent_goal_id
         WHERE g.period = 'weekly'
         ORDER BY g.created_at DESC`,
      )
      .all() as { title: string; progress: number; parent_title: string | null }[];
    goals = goalRows.map((g) => ({
      title: g.title,
      progress: g.progress,
      parentTitle: g.parent_title,
    }));

    const reportRows = await db
      .prepare(
        `SELECT report_date, COALESCE(manual_content, generated_content) AS content
         FROM reports
         WHERE report_date BETWEEN ? AND ?
         ORDER BY report_date`,
      )
      .all(periodKey, weekEndDate) as { report_date: string; content: string | null }[];
    sourceReports = reportRows
      .filter((r) => r.content)
      .map((r) => ({ label: r.report_date, content: r.content as string }));
  } else {
    periodLabel = periodKey;

    const goalRows = await db
      .prepare(
        "SELECT title, progress FROM goals WHERE period = 'monthly' ORDER BY created_at DESC",
      )
      .all() as { title: string; progress: number }[];
    goals = goalRows.map((g) => ({ title: g.title, progress: g.progress }));

    const reportRows = await db
      .prepare(
        `SELECT week_start_date, week_end_date, COALESCE(manual_content, generated_content) AS content
         FROM weekly_reports
         WHERE strftime('%Y-%m', week_start_date) = ?
         ORDER BY week_start_date`,
      )
      .all(periodKey) as {
      week_start_date: string;
      week_end_date: string;
      content: string | null;
    }[];
    sourceReports = reportRows
      .filter((r) => r.content)
      .map((r) => ({
        label: `${r.week_start_date} 〜 ${r.week_end_date}`,
        content: r.content as string,
      }));
  }

  const prompt = buildGoalReviewPrompt(scope, periodLabel, goals, sourceReports);

  let content: string;
  try {
    content = await generateGoalReview(prompt);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "振り返りの生成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await db.prepare(
    `INSERT INTO goal_reviews (scope, period_key, generated_content, generated_by)
     VALUES (?, ?, ?, 'gemini')
     ON CONFLICT(scope, period_key) DO UPDATE SET
       generated_content = excluded.generated_content,
       generated_by = 'gemini',
       updated_at = datetime('now', 'localtime')`,
  ).run(scope, periodKey, content);

  const row = await db
    .prepare("SELECT * FROM goal_reviews WHERE scope = ? AND period_key = ?")
    .get(scope, periodKey);

  return NextResponse.json({ data: mapGoalReview(row as never) });
}
