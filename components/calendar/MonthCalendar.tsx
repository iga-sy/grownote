"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Task } from "@/lib/types";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function todayIso(): string {
  const d = new Date();
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
}

export function MonthCalendar({ tasks }: { tasks: Task[] }) {
  const today = todayIso();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(today);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const list = map.get(t.dueDate) ?? [];
      list.push(t);
      map.set(t.dueDate, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.dueTime ?? "").localeCompare(b.dueTime ?? ""));
    }
    return map;
  }, [tasks]);

  const weeks = useMemo(() => {
    const firstOfMonth = new Date(cursor.year, cursor.month, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();

    const cells: { iso: string; day: number; inMonth: boolean }[] = [];
    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(cursor.year, cursor.month, 1 - (startWeekday - i));
      cells.push({
        iso: toIso(d.getFullYear(), d.getMonth(), d.getDate()),
        day: d.getDate(),
        inMonth: false,
      });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ iso: toIso(cursor.year, cursor.month, day), day, inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1];
      const d = new Date(`${last.iso}T00:00:00`);
      d.setDate(d.getDate() + 1);
      cells.push({
        iso: toIso(d.getFullYear(), d.getMonth(), d.getDate()),
        day: d.getDate(),
        inMonth: false,
      });
    }

    const result: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  }, [cursor]);

  const selectedTasks = selectedDate ? (tasksByDate.get(selectedDate) ?? []) : [];

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex-1 animate-fade-in rounded-lg border border-border bg-surface p-6 shadow-md shadow-navy/5">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() =>
              setCursor((c) =>
                c.month === 0
                  ? { year: c.year - 1, month: 11 }
                  : { year: c.year, month: c.month - 1 },
              )
            }
            className="rounded-md p-1 text-ink-soft hover:bg-accent-soft"
            aria-label="前の月"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-semibold text-ink">
            {cursor.year}年 {cursor.month + 1}月
          </h2>
          <button
            onClick={() =>
              setCursor((c) =>
                c.month === 11
                  ? { year: c.year + 1, month: 0 }
                  : { year: c.year, month: c.month + 1 },
              )
            }
            className="rounded-md p-1 text-ink-soft hover:bg-accent-soft"
            aria-label="次の月"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-soft">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((cell) => {
            const count = tasksByDate.get(cell.iso)?.length ?? 0;
            const isSelected = selectedDate === cell.iso;
            const isToday = cell.iso === today;
            return (
              <button
                key={cell.iso}
                onClick={() => setSelectedDate(cell.iso)}
                className={`flex h-16 flex-col items-center gap-1 rounded-md border p-1 text-sm transition-colors ${
                  isSelected
                    ? "border-accent bg-accent-soft"
                    : "border-transparent hover:bg-accent-soft/40"
                } ${!cell.inMonth ? "opacity-40" : ""}`}
              >
                <span className={isToday ? "font-bold text-accent-dark" : "text-ink"}>
                  {cell.day}
                </span>
                {count > 0 && (
                  <span className="text-xs leading-none tracking-tighter text-accent">
                    {"✧".repeat(Math.min(count, 3))}
                    {count > 3 ? `+${count - 3}` : ""}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full animate-fade-in rounded-lg border border-border bg-surface p-6 shadow-md shadow-navy/5 lg:w-72">
        <h3 className="mb-3 text-sm font-semibold text-ink">
          {selectedDate ?? "日付を選択してください"}の締切タスク
        </h3>
        {selectedTasks.length === 0 ? (
          <EmptyState message="この日の締切タスクはありません。" />
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedTasks.map((t) => (
              <li key={t.id} className="rounded-md bg-accent-soft/40 p-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className={`truncate ${t.isDone ? "text-ink-soft line-through" : "text-ink"}`}>
                    {t.title}
                  </span>
                  {t.dueTime && (
                    <span className="shrink-0 text-xs text-ink-soft">{t.dueTime}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
