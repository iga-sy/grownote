import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapTask } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const rows = date
    ? await db
        .prepare(
          "SELECT * FROM tasks WHERE due_date = ? ORDER BY is_done, due_time, due_date",
        )
        .all(date)
    : await db
        .prepare("SELECT * FROM tasks ORDER BY is_done, due_date, due_time")
        .all();

  return NextResponse.json({ data: rows.map((r) => mapTask(r as never)) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, description, fileUrl, dueDate, dueTime, priority, repeat } = body as {
    title?: string;
    description?: string;
    fileUrl?: string;
    dueDate?: string;
    dueTime?: string;
    priority?: string;
    repeat?: string;
  };

  if (!title) {
    return NextResponse.json({ error: "title は必須です。" }, { status: 400 });
  }

  const result = await db
    .prepare(
      "INSERT INTO tasks (title, description, file_url, due_date, due_time, priority, repeat) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      title,
      description ?? null,
      fileUrl ?? null,
      dueDate ?? null,
      dueTime ?? null,
      priority ?? "medium",
      repeat ?? "none",
    );

  const row = await db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json({ data: mapTask(row as never) }, { status: 201 });
}
