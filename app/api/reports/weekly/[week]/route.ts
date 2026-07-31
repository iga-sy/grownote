import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapWeeklyReport } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ week: string }> },
) {
  const { week } = await context.params;
  const body = await request.json();
  const { content } = body as { content?: string };

  if (!content) {
    return NextResponse.json({ error: "content は必須です。" }, { status: 400 });
  }

  const { end_date: weekEndDate } = await db
    .prepare("SELECT date(?, '+6 days') AS end_date")
    .get(week) as { end_date: string };

  await db.prepare(
    `INSERT INTO weekly_reports (week_start_date, week_end_date, manual_content, generated_by)
     VALUES (?, ?, ?, 'manual')
     ON CONFLICT(week_start_date) DO UPDATE SET
       manual_content = excluded.manual_content,
       generated_by = 'manual',
       updated_at = datetime('now', 'localtime')`,
  ).run(week, weekEndDate, content);

  const row = await db
    .prepare("SELECT * FROM weekly_reports WHERE week_start_date = ?")
    .get(week);
  return NextResponse.json({ data: mapWeeklyReport(row as never) });
}
