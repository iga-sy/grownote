"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, Pencil, Trash2, Upload } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { addDays, todayIso } from "@/lib/date";
import type { Schedule as ScheduleItem } from "@/lib/types";

const HOUR_HEIGHT = 44;
const HOUR_START = 8;
const HOUR_END = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const EVENT_CHIP_COUNT = 5;

function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function Schedule({
  date,
  onDateChange,
  refreshKey,
  selectedScheduleId,
  onSelectSchedule,
  onEditSchedule,
}: {
  date: string;
  onDateChange: (date: string) => void;
  refreshKey: number;
  selectedScheduleId: number | null;
  onSelectSchedule: (schedule: ScheduleItem) => void;
  onEditSchedule: (schedule: ScheduleItem) => void;
}) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/schedules?date=${date}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setItems(json.data ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, refreshKey]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [items],
  );

  const isToday = date === todayIso();
  const nowLineTop = useMemo(() => {
    if (!isToday) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const rangeStart = HOUR_START * 60;
    const rangeEnd = HOUR_END * 60;
    if (nowMin < rangeStart || nowMin > rangeEnd) return null;
    return ((nowMin - rangeStart) / 60) * HOUR_HEIGHT;
  }, [isToday]);

  async function handleDelete(id: number) {
    await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const icsText = await file.text();
      const res = await fetch("/api/schedules/import-ics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icsText }),
      });
      const json = await res.json();
      if (!res.ok) {
        setImportMessage(json.error ?? "取り込みに失敗しました。");
        return;
      }
      setImportMessage(`${json.count}件の予定を取り込みました。`);
      const created: ScheduleItem[] = json.data ?? [];
      const forThisDate = created.filter((s) => s.date === date);
      if (forThisDate.length > 0) {
        setItems((prev) => [...prev, ...forThisDate]);
      }
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Card title="1日のスケジュール" icon={<CalendarClock className="h-4 w-4" />}>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onDateChange(addDays(date, -1))}
          className="rounded-md p-1 text-ink-soft hover:bg-accent-soft"
          aria-label="前日"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <input
          type="date"
          lang="en-CA"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
        />
        <button
          onClick={() => onDateChange(addDays(date, 1))}
          className="rounded-md p-1 text-ink-soft hover:bg-accent-soft"
          aria-label="翌日"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <Button
          variant="secondary"
          className="ml-auto"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          <Upload className="h-3.5 w-3.5" />
          Outlookから取り込み
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".ics"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>

      {importMessage && (
        <p className="text-xs text-ink-soft">{importMessage}</p>
      )}

      {loading ? (
        <p className="text-xs text-ink-soft">読み込み中...</p>
      ) : sorted.length === 0 ? (
        <EmptyState message="この日の予定はまだありません。右のカードから追加できます。" />
      ) : null}

      <div
        className="relative overflow-hidden rounded-md border border-border"
        style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
      >
        {Array.from({ length: TOTAL_HOURS }).map((_, i) =>
          i % 2 === 0 ? (
            <div
              key={`band-${i}`}
              className="timetable-band-even absolute left-0 right-0"
              style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
            />
          ) : null,
        )}

        {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => (
          <div
            key={`line-${i}`}
            className="absolute left-0 right-0 border-t border-border"
            style={{ top: `${i * HOUR_HEIGHT}px` }}
          >
            <span className="absolute -top-2 left-1 bg-surface pr-1 text-[10px] text-ink-soft">
              {HOUR_START + i}:00
            </span>
          </div>
        ))}

        {nowLineTop !== null && (
          <div
            className="absolute left-0 right-0 z-10 flex items-center gap-1"
            style={{ top: `${nowLineTop}px` }}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
            <span className="h-px flex-1 bg-red-400/70" />
          </div>
        )}

        {sorted.map((s) => {
          const rangeStart = HOUR_START * 60;
          const rangeEnd = HOUR_END * 60;
          const startMin = minutesOf(s.startTime);
          const endMin = s.endTime ? minutesOf(s.endTime) : startMin + 30;
          const top = ((Math.max(startMin, rangeStart) - rangeStart) / 60) * HOUR_HEIGHT;
          const bottom =
            ((Math.min(endMin, rangeEnd) - rangeStart) / 60) * HOUR_HEIGHT;
          const height = Math.max(bottom - top, 22);
          if (bottom <= 0 || top >= TOTAL_HOURS * HOUR_HEIGHT) return null;
          const isSelected = selectedScheduleId === s.id;
          const chipIndex = s.id % EVENT_CHIP_COUNT;
          return (
            <div
              key={s.id}
              onClick={() => onSelectSchedule(s)}
              className={`event-chip event-chip-${chipIndex} absolute left-14 right-2 cursor-pointer overflow-hidden rounded-md px-2 py-0.5 text-xs ${
                isSelected ? "is-selected" : ""
              }`}
              style={{ top: `${top}px`, height: `${height}px` }}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="min-w-0 flex-1 truncate font-medium">
                  {s.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSchedule(s);
                  }}
                  aria-label="編集"
                  className="shrink-0 text-ink-soft hover:text-accent-dark"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(s.id);
                  }}
                  aria-label="削除"
                  className="shrink-0 text-ink-soft hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <span className="text-[10px] text-ink-soft">
                {s.startTime}
                {s.endTime ? `-${s.endTime}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
