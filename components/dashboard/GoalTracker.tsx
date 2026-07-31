"use client";

import { useState } from "react";
import { Target, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressRing } from "@/components/ui/ProgressRing";
import type { Goal, GoalPeriod } from "@/lib/types";

export function GoalTracker({
  goals,
  onAdd,
  onProgressChange,
}: {
  goals: Goal[];
  onAdd: (title: string, period: GoalPeriod) => Promise<void>;
  onProgressChange: (id: number, progress: number) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState<GoalPeriod>("weekly");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(title.trim(), period);
      setTitle("");
    } finally {
      setSubmitting(false);
    }
  }

  const weekly = goals.filter((g) => g.period === "weekly");
  const monthly = goals.filter((g) => g.period === "monthly");
  const longterm = goals.filter((g) => g.period === "longterm");

  return (
    <Card title="目標管理" icon={<Target className="h-4 w-4" />}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="目標を入力"
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
        />
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as GoalPeriod)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
          >
            <option value="weekly">今週</option>
            <option value="monthly">今月</option>
            <option value="longterm">長期</option>
          </select>
          <Button type="submit" disabled={submitting} className="ml-auto">
            <Plus className="h-4 w-4" />
            追加
          </Button>
        </div>
      </form>

      {([
        ["今週の目標", weekly],
        ["今月の目標", monthly],
        ["長期目標", longterm],
      ] as const).map(([label, list]) => (
        <div key={label} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-soft">{label}</span>
            <Badge tone="accent">{list.length}</Badge>
          </div>
          {list.length === 0 ? (
            <EmptyState message="目標がまだありません。" />
          ) : (
            <ul className="flex flex-col gap-2">
              {list.map((g) => (
                <li key={g.id} className="flex items-center gap-3">
                  <ProgressRing value={g.progress} size={44} strokeWidth={5} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm">{g.title}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={g.progress}
                      onChange={(e) => onProgressChange(g.id, Number(e.target.value))}
                      className="w-full accent-[var(--color-accent)]"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </Card>
  );
}
