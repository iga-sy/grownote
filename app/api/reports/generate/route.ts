import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapReport } from "@/lib/types";
import { buildDailyReportPrompt, generateDailyReport } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { date } = body as { date?: string };

  if (!date) {
    return NextResponse.json({ error: "date は必須です。" }, { status: 400 });
  }

  const completedTasks = await db
    .prepare(
      `SELECT id, title, description FROM tasks
       WHERE is_done = 1 AND date(completed_at) = ?
       ORDER BY completed_at`,
    )
    .all(date) as { id: number; title: string; description: string | null }[];

  const notesForDate = await db
    .prepare(
      `SELECT notes.category AS category, notes.content AS content,
              tasks.title AS task_title, schedules.title AS schedule_title
       FROM notes
       LEFT JOIN tasks ON tasks.id = notes.task_id
       LEFT JOIN schedules ON schedules.id = notes.schedule_id
       WHERE date(notes.created_at) = ?
       ORDER BY notes.created_at`,
    )
    .all(date) as {
    category: string;
    content: string;
    task_title: string | null;
    schedule_title: string | null;
  }[];

  const prompt = buildDailyReportPrompt(
    date,
    completedTasks.map((t) => ({ title: t.title, description: t.description })),
    notesForDate.map((n) => ({
      category: n.category,
      content: n.content,
      contextTitle: n.schedule_title ?? n.task_title,
    })),
  );

  let content: string;
  try {
    content = await generateDailyReport(prompt);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "日報の生成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const taskIdsSnapshot = JSON.stringify(completedTasks.map((t) => t.id));

  await db.prepare(
    `INSERT INTO reports (report_date, generated_content, task_ids_snapshot, generated_by)
     VALUES (?, ?, ?, 'gemini')
     ON CONFLICT(report_date) DO UPDATE SET
       generated_content = excluded.generated_content,
       task_ids_snapshot = excluded.task_ids_snapshot,
       generated_by = 'gemini',
       updated_at = datetime('now', 'localtime')`,
  ).run(date, content, taskIdsSnapshot);

  const row = await db
    .prepare("SELECT * FROM reports WHERE report_date = ?")
    .get(date);

  return NextResponse.json({ data: mapReport(row as never) });
}
