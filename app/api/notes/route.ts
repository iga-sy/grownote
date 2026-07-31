import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapNote } from "@/lib/types";

export const dynamic = "force-dynamic";

const SELECT_WITH_JOIN = `
  SELECT notes.*, tasks.title AS task_title, schedules.title AS schedule_title
  FROM notes
  LEFT JOIN tasks ON tasks.id = notes.task_id
  LEFT JOIN schedules ON schedules.id = notes.schedule_id
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");
  const scheduleId = searchParams.get("scheduleId");
  const date = searchParams.get("date");

  let rows;
  if (scheduleId) {
    rows = await db
      .prepare(
        `${SELECT_WITH_JOIN} WHERE notes.schedule_id = ? ORDER BY notes.created_at DESC`,
      )
      .all(Number(scheduleId));
  } else if (taskId) {
    rows = await db
      .prepare(
        `${SELECT_WITH_JOIN} WHERE notes.task_id = ? ORDER BY notes.created_at DESC`,
      )
      .all(Number(taskId));
  } else if (date) {
    rows = await db
      .prepare(
        `${SELECT_WITH_JOIN} WHERE date(notes.created_at) = ? ORDER BY notes.created_at DESC`,
      )
      .all(date);
  } else {
    rows = await db
      .prepare(`${SELECT_WITH_JOIN} ORDER BY notes.created_at DESC`)
      .all();
  }

  return NextResponse.json({ data: rows.map((r) => mapNote(r as never)) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { taskId, scheduleId, category, content } = body as {
    taskId?: number | null;
    scheduleId?: number | null;
    category?: string;
    content?: string;
  };

  if (!content || !category) {
    return NextResponse.json(
      { error: "category と content は必須です。" },
      { status: 400 },
    );
  }

  const result = await db
    .prepare(
      "INSERT INTO notes (task_id, schedule_id, category, content) VALUES (?, ?, ?, ?)",
    )
    .run(taskId ?? null, scheduleId ?? null, category, content);

  const row = await db
    .prepare(`${SELECT_WITH_JOIN} WHERE notes.id = ?`)
    .get(result.lastInsertRowid);

  return NextResponse.json({ data: mapNote(row as never) }, { status: 201 });
}
