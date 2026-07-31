import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapTask } from "@/lib/types";
import { todayIso, toIsoDate } from "@/lib/date";

export const dynamic = "force-dynamic";

function nextDueDate(dueDate: string | null, repeat: string): string {
  const base = new Date(`${dueDate ?? todayIso()}T00:00:00`);
  if (repeat === "weekly") {
    base.setDate(base.getDate() + 7);
    return toIsoDate(base);
  }
  base.setDate(base.getDate() + 1);
  if (repeat === "weekdays") {
    while (base.getDay() === 0 || base.getDay() === 6) {
      base.setDate(base.getDate() + 1);
    }
  }
  return toIsoDate(base);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = Number((await context.params).id);
  const body = await request.json();
  const { title, description, fileUrl, dueDate, dueTime, priority, repeat, isDone } =
    body as {
      title?: string;
      description?: string | null;
      fileUrl?: string | null;
      dueDate?: string | null;
      dueTime?: string | null;
      priority?: string;
      repeat?: string;
      isDone?: boolean;
    };

  const existing = await db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as
    | {
        title: string;
        description: string | null;
        file_url: string | null;
        due_date: string | null;
        due_time: string | null;
        priority: string;
        repeat: string;
      }
    | undefined;
  if (!existing) {
    return NextResponse.json({ error: "見つかりません。" }, { status: 404 });
  }

  await db.prepare(
    `UPDATE tasks SET
       title = COALESCE(?, title),
       description = ?,
       file_url = ?,
       due_date = ?,
       due_time = ?,
       priority = COALESCE(?, priority),
       repeat = COALESCE(?, repeat),
       is_done = COALESCE(?, is_done),
       completed_at = CASE
         WHEN ? = 1 THEN datetime('now', 'localtime')
         WHEN ? = 1 THEN NULL
         ELSE completed_at
       END,
       updated_at = datetime('now', 'localtime')
     WHERE id = ?`,
  ).run(
    title ?? null,
    description !== undefined ? description : existing.description,
    fileUrl !== undefined ? fileUrl : existing.file_url,
    dueDate !== undefined ? dueDate : existing.due_date,
    dueTime !== undefined ? dueTime : existing.due_time,
    priority ?? null,
    repeat ?? null,
    isDone === undefined ? null : isDone ? 1 : 0,
    isDone === true ? 1 : 0,
    isDone === false ? 1 : 0,
    id,
  );

  if (isDone === true && existing.repeat !== "none") {
    await db.prepare(
      "INSERT INTO tasks (title, description, file_url, due_date, due_time, priority, repeat) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      existing.title,
      existing.description,
      existing.file_url,
      nextDueDate(existing.due_date, existing.repeat),
      existing.due_time,
      existing.priority,
      existing.repeat,
    );
  }

  const row = await db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  return NextResponse.json({ data: mapTask(row as never) });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = Number((await context.params).id);
  await db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return NextResponse.json({ data: true });
}
