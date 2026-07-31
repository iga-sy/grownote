import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapMonthlyReport } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ month: string }> },
) {
  const { month } = await context.params;
  const body = await request.json();
  const { content } = body as { content?: string };

  if (!content) {
    return NextResponse.json({ error: "content は必須です。" }, { status: 400 });
  }

  await db.prepare(
    `INSERT INTO monthly_reports (year_month, content, generated_by)
     VALUES (?, ?, 'manual')
     ON CONFLICT(year_month) DO UPDATE SET
       content = excluded.content,
       generated_by = 'manual',
       updated_at = datetime('now', 'localtime')`,
  ).run(month, content);

  const row = await db
    .prepare("SELECT * FROM monthly_reports WHERE year_month = ?")
    .get(month);
  return NextResponse.json({ data: mapMonthlyReport(row as never) });
}
