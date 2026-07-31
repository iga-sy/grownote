import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapSchedule } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = Number((await context.params).id);
  const body = await request.json();
  const { title, date, startTime, endTime, memo } = body as {
    title?: string;
    date?: string;
    startTime?: string;
    endTime?: string | null;
    memo?: string | null;
  };

  const existing = await db.prepare("SELECT * FROM schedules WHERE id = ?").get(id) as
    | { end_time: string | null; memo: string | null }
    | undefined;
  if (!existing) {
    return NextResponse.json({ error: "見つかりません。" }, { status: 404 });
  }

  await db.prepare(
    `UPDATE schedules SET
       title = COALESCE(?, title),
       date = COALESCE(?, date),
       start_time = COALESCE(?, start_time),
       end_time = ?,
       memo = ?,
       updated_at = datetime('now', 'localtime')
     WHERE id = ?`,
  ).run(
    title ?? null,
    date ?? null,
    startTime ?? null,
    endTime !== undefined ? endTime : existing.end_time,
    memo !== undefined ? memo : existing.memo,
    id,
  );

  const row = await db.prepare("SELECT * FROM schedules WHERE id = ?").get(id);
  return NextResponse.json({ data: mapSchedule(row as never) });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = Number((await context.params).id);
  await db.prepare("DELETE FROM schedules WHERE id = ?").run(id);
  return NextResponse.json({ data: true });
}
