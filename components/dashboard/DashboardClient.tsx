"use client";

import { useMemo, useState } from "react";
import { QuickLinks } from "@/components/dashboard/QuickLinks";
import { Schedule } from "@/components/dashboard/Schedule";
import { ScheduleQuickAdd } from "@/components/dashboard/ScheduleQuickAdd";
import { Tasks } from "@/components/dashboard/Tasks";
import { WorkMemo } from "@/components/dashboard/WorkMemo";
import { todayIso } from "@/lib/date";
import type {
  Bookmark,
  Memo,
  Note,
  NoteCategory,
  Priority,
  Schedule as ScheduleItem,
  Task,
  TaskRepeat,
} from "@/lib/types";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "リクエストに失敗しました。");
  return json.data as T;
}

async function patchJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "リクエストに失敗しました。");
  return json.data as T;
}

async function deleteJson(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? "削除に失敗しました。");
  }
}

export function DashboardClient({
  initialTasks,
  initialBookmarks,
  initialNotes,
  initialMemos,
}: {
  initialTasks: Task[];
  initialBookmarks: Bookmark[];
  initialNotes: Note[];
  initialMemos: Memo[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [notes, setNotes] = useState(initialNotes);
  const [memos, setMemos] = useState(initialMemos);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null,
  );
  const [selectedScheduleCache, setSelectedScheduleCache] =
    useState<ScheduleItem | null>(null);
  const [scheduleDate, setScheduleDate] = useState(todayIso);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);

  const notesForSelectedSchedule = useMemo(
    () => notes.filter((n) => n.scheduleId === selectedScheduleId),
    [notes, selectedScheduleId],
  );

  async function handleAddBookmark(title: string, url: string) {
    const created = await postJson<Bookmark>("/api/bookmarks", { title, url });
    setBookmarks((prev) => [created, ...prev]);
  }

  async function handleDeleteBookmark(id: number) {
    await deleteJson(`/api/bookmarks/${id}`);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  async function handleAddTask(
    title: string,
    dueDate: string | null,
    dueTime: string | null,
    repeat: TaskRepeat,
    priority: Priority,
  ) {
    const created = await postJson<Task>("/api/tasks", {
      title,
      dueDate,
      dueTime,
      repeat,
      priority,
    });
    setTasks((prev) => [...prev, created]);
  }

  async function handleToggleTaskDone(id: number, isDone: boolean) {
    const updated = await patchJson<Task>(`/api/tasks/${id}`, { isDone });
    if (isDone) {
      // 繰り返し設定があれば次回分がサーバー側で自動生成されているため一覧を取り直す
      const res = await fetch("/api/tasks");
      const json = await res.json();
      setTasks(json.data ?? []);
    } else {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  }

  async function handleUpdateTask(
    id: number,
    description: string | null,
    fileUrl: string | null,
  ) {
    const updated = await patchJson<Task>(`/api/tasks/${id}`, {
      description,
      fileUrl,
    });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  async function handleDeleteTask(id: number) {
    await deleteJson(`/api/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleSelectSchedule(schedule: ScheduleItem) {
    setSelectedScheduleId(schedule.id);
    setSelectedScheduleCache(schedule);
  }

  async function handleAddSchedule(
    title: string,
    startTime: string,
    endTime: string | null,
  ) {
    await postJson<ScheduleItem>("/api/schedules", {
      title,
      date: scheduleDate,
      startTime,
      endTime,
    });
    setScheduleRefreshKey((k) => k + 1);
  }

  async function handleAddMemo(content: string) {
    const created = await postJson<Memo>("/api/memos", { content });
    setMemos((prev) => [created, ...prev]);
  }

  async function handleDeleteMemo(id: number) {
    await deleteJson(`/api/memos/${id}`);
    setMemos((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleAddNote(category: NoteCategory, content: string) {
    if (selectedScheduleId === null) return;
    const created = await postJson<Note>("/api/notes", {
      scheduleId: selectedScheduleId,
      category,
      content,
    });
    setNotes((prev) => [created, ...prev]);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4">
      <header>
        <h1 className="text-xl font-bold text-ink">ダッシュボード</h1>
        <p className="text-sm text-ink-soft">
          スケジュール・タスク・メモをひとつの画面でまとめて管理します。目標管理はロードマップ画面で行えます。
        </p>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4">
          <QuickLinks
            bookmarks={bookmarks}
            onAdd={handleAddBookmark}
            onDelete={handleDeleteBookmark}
          />
          <Tasks
            tasks={tasks}
            onToggleDone={handleToggleTaskDone}
            onAdd={handleAddTask}
            onDelete={handleDeleteTask}
            onUpdate={handleUpdateTask}
            memos={memos}
            onAddMemo={handleAddMemo}
            onDeleteMemo={handleDeleteMemo}
          />
        </div>

        <Schedule
          date={scheduleDate}
          onDateChange={setScheduleDate}
          refreshKey={scheduleRefreshKey}
          selectedScheduleId={selectedScheduleId}
          onSelectSchedule={handleSelectSchedule}
        />

        <div className="flex flex-col gap-4">
          <ScheduleQuickAdd
            date={scheduleDate}
            onDateChange={setScheduleDate}
            onAdd={handleAddSchedule}
          />
          <WorkMemo
            selectedSchedule={selectedScheduleCache}
            notes={notesForSelectedSchedule}
            onAddNote={handleAddNote}
          />
        </div>
      </div>
    </div>
  );
}
