"use client";

import { useState } from "react";
import { Plus, CalendarPlus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WORK_HOUR_TIME_OPTIONS } from "@/lib/date";

export function ScheduleQuickAdd({
  date,
  onDateChange,
  onAdd,
}: {
  date: string;
  onDateChange: (date: string) => void;
  onAdd: (title: string, startTime: string, endTime: string | null) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startTime) return;
    setSubmitting(true);
    try {
      await onAdd(title.trim(), startTime, endTime || null);
      setTitle("");
      setStartTime("");
      setEndTime("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="予定を追加" icon={<CalendarPlus className="h-4 w-4" />}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs text-ink-soft">追加先の日付</span>
          <input
            type="date"
            lang="en-CA"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
          />
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="予定を入力(例: 定例MTG)"
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
        />
        <div className="flex items-center gap-2">
          <input
            type="time"
            list="schedule-time-options"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
          />
          <span className="text-xs text-ink-soft">〜</span>
          <input
            type="time"
            list="schedule-time-options"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
          />
          <datalist id="schedule-time-options">
            {WORK_HOUR_TIME_OPTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <Button type="submit" disabled={submitting} className="ml-auto">
            <Plus className="h-4 w-4" />
            追加
          </Button>
        </div>
      </form>
    </Card>
  );
}
