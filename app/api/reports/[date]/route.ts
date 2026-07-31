import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapReport } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ date: string }> },
) {
  const { date } = await context.params;
  const body = await request.json();
  const { content } = body as { content?: string };

  if (!content) {
    return NextResponse.json({ error: "content は必須です。" }, { status: 400 });
  }

  await db.prepare(
    `INSERT INTO reports (report_date, content, generated_by)
     VALUES (?, ?, 'manual')
     ON CONFLICT(report_date) DO UPDATE SET
       content = excluded.content,
       generated_by = 'manual',
       updated_at = datetime('now', 'localtime')`,
  ).run(date, content);

  const row = await db
    .prepare("SELECT * FROM reports WHERE report_date = ?")
    .get(date);
  return NextResponse.json({ data: mapReport(row as never) });
}
