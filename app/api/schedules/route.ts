import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapSchedule } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const rows = date
    ? await db
        .prepare("SELECT * FROM schedules WHERE date = ? ORDER BY start_time")
        .all(date)
    : await db.prepare("SELECT * FROM schedules ORDER BY date, start_time").all();

  return NextResponse.json({ data: rows.map((r) => mapSchedule(r as never)) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, date, startTime, endTime, memo, taskId } = body as {
    title?: string;
    date?: string;
    startTime?: string;
    endTime?: string | null;
    memo?: string | null;
    taskId?: number | null;
  };

  if (!title || !date || !startTime) {
    return NextResponse.json(
      { error: "title と date と startTime は必須です。" },
      { status: 400 },
    );
  }

  const result = await db
    .prepare(
      "INSERT INTO schedules (title, date, start_time, end_time, memo, task_id) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(title, date, startTime, endTime ?? null, memo ?? null, taskId ?? null);

  const row = await db
    .prepare("SELECT * FROM schedules WHERE id = ?")
    .get(result.lastInsertRowid);

  return NextResponse.json({ data: mapSchedule(row as never) }, { status: 201 });
}
