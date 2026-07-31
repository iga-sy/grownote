import db from "@/lib/db";
import { mapBookmark, mapMemo, mapNote, mapTask } from "@/lib/types";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const taskRows = await db
    .prepare("SELECT * FROM tasks ORDER BY is_done, due_date")
    .all();
  const bookmarkRows = await db
    .prepare("SELECT * FROM bookmarks ORDER BY created_at DESC")
    .all();
  const noteRows = await db
    .prepare(
      `SELECT notes.*, tasks.title AS task_title, schedules.title AS schedule_title
       FROM notes
       LEFT JOIN tasks ON tasks.id = notes.task_id
       LEFT JOIN schedules ON schedules.id = notes.schedule_id
       ORDER BY notes.created_at DESC`,
    )
    .all();
  const memoRows = await db
    .prepare("SELECT * FROM memos ORDER BY created_at DESC")
    .all();

  return (
    <DashboardClient
      initialTasks={taskRows.map((r) => mapTask(r as never))}
      initialBookmarks={bookmarkRows.map((r) => mapBookmark(r as never))}
      initialNotes={noteRows.map((r) => mapNote(r as never))}
      initialMemos={memoRows.map((r) => mapMemo(r as never))}
    />
  );
}
