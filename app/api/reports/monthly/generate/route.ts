import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapMonthlyReport } from "@/lib/types";
import { buildMonthlyReportPrompt, generateMonthlyReport } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { yearMonth } = body as { yearMonth?: string };

  if (!yearMonth) {
    return NextResponse.json(
      { error: "yearMonth は必須です。" },
      { status: 400 },
    );
  }

  const weeklyReports = await db
    .prepare(
      `SELECT week_start_date, week_end_date, COALESCE(manual_content, generated_content) AS content
       FROM weekly_reports
       WHERE strftime('%Y-%m', week_start_date) = ?
       ORDER BY week_start_date`,
    )
    .all(yearMonth) as {
    week_start_date: string;
    week_end_date: string;
    content: string | null;
  }[];

  const monthlyGoal = await db
    .prepare(
      "SELECT title FROM goals WHERE period = 'monthly' ORDER BY created_at DESC LIMIT 1",
    )
    .get() as { title: string } | undefined;

  const deliverables = await db
    .prepare(
      `SELECT title, file_url FROM tasks
       WHERE is_done = 1 AND strftime('%Y-%m', completed_at) = ?
       ORDER BY completed_at`,
    )
    .all(yearMonth) as { title: string; file_url: string | null }[];

  const prompt = buildMonthlyReportPrompt(
    yearMonth,
    weeklyReports
      .filter((w) => w.content)
      .map((w) => ({
        weekStartDate: w.week_start_date,
        weekEndDate: w.week_end_date,
        content: w.content as string,
      })),
    monthlyGoal?.title ?? null,
    deliverables.map((d) => ({ title: d.title, fileUrl: d.file_url })),
  );

  let content: string;
  try {
    content = await generateMonthlyReport(prompt);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "月報の生成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await db.prepare(
    `INSERT INTO monthly_reports (year_month, generated_content, generated_by)
     VALUES (?, ?, 'gemini')
     ON CONFLICT(year_month) DO UPDATE SET
       generated_content = excluded.generated_content,
       generated_by = 'gemini',
       updated_at = datetime('now', 'localtime')`,
  ).run(yearMonth, content);

  const row = await db
    .prepare("SELECT * FROM monthly_reports WHERE year_month = ?")
    .get(yearMonth);

  return NextResponse.json({ data: mapMonthlyReport(row as never) });
}
