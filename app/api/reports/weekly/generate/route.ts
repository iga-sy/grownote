import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapWeeklyReport } from "@/lib/types";
import { buildWeeklyReportPrompt, generateWeeklyReport } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { weekStartDate } = body as { weekStartDate?: string };

  if (!weekStartDate) {
    return NextResponse.json(
      { error: "weekStartDate は必須です。" },
      { status: 400 },
    );
  }

  const { end_date: weekEndDate } = await db
    .prepare("SELECT date(?, '+6 days') AS end_date")
    .get(weekStartDate) as { end_date: string };

  const dailyReports = await db
    .prepare(
      `SELECT report_date, COALESCE(manual_content, generated_content) AS content FROM reports
       WHERE report_date BETWEEN ? AND ?
       ORDER BY report_date`,
    )
    .all(weekStartDate, weekEndDate) as { report_date: string; content: string | null }[];

  const weeklyGoal = await db
    .prepare(
      "SELECT title FROM goals WHERE period = 'weekly' ORDER BY created_at DESC LIMIT 1",
    )
    .get() as { title: string } | undefined;

  const deliverables = await db
    .prepare(
      `SELECT title, file_url FROM tasks
       WHERE is_done = 1 AND date(completed_at) BETWEEN ? AND ?
       ORDER BY completed_at`,
    )
    .all(weekStartDate, weekEndDate) as { title: string; file_url: string | null }[];

  const prompt = buildWeeklyReportPrompt(
    weekStartDate,
    weekEndDate,
    dailyReports
      .filter((r) => r.content)
      .map((r) => ({ date: r.report_date, content: r.content as string })),
    weeklyGoal?.title ?? null,
    deliverables.map((d) => ({ title: d.title, fileUrl: d.file_url })),
  );

  let content: string;
  try {
    content = await generateWeeklyReport(prompt);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "週報の生成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await db.prepare(
    `INSERT INTO weekly_reports (week_start_date, week_end_date, generated_content, generated_by)
     VALUES (?, ?, ?, 'gemini')
     ON CONFLICT(week_start_date) DO UPDATE SET
       week_end_date = excluded.week_end_date,
       generated_content = excluded.generated_content,
       generated_by = 'gemini',
       updated_at = datetime('now', 'localtime')`,
  ).run(weekStartDate, weekEndDate, content);

  const row = await db
    .prepare("SELECT * FROM weekly_reports WHERE week_start_date = ?")
    .get(weekStartDate);

  return NextResponse.json({ data: mapWeeklyReport(row as never) });
}
