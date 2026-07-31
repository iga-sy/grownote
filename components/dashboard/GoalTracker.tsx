"use client";

import { useState } from "react";
import { Target, Plus, Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressRing } from "@/components/ui/ProgressRing";
import type { Goal, GoalPeriod } from "@/lib/types";
import type { GoalSuggestionGroup } from "@/lib/gemini";

const CATEGORY_LABEL: Record<GoalSuggestionGroup["category"], string> = {
  business: "業務面",
  technical: "技術・知識面",
};

function SuggestButton({
  period,
  onPick,
}: {
  period: "weekly" | "monthly";
  onPick: (title: string) => void;
}) {
  const [groups, setGroups] = useState<GoalSuggestionGroup[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSuggest() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/goals/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "提案の生成に失敗しました。");
        return;
      }
      setGroups(json.data as GoalSuggestionGroup[]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant="ai"
        onClick={handleSuggest}
        disabled={loading}
        className="w-fit !px-2.5 !py-1 !text-xs"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        業務面・技術面でAIに提案してもらう
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {groups && groups.length > 0 && (
        <div className="flex flex-col gap-2">
          {groups.map((g) => (
            <div key={g.category} className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-ink-soft">
                {CATEGORY_LABEL[g.category]}
              </span>
              <ul className="flex flex-col gap-1">
                {g.items.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => onPick(s)}
                      className="w-full rounded-md border border-border bg-accent-soft/30 px-2 py-1 text-left text-xs hover:bg-accent-soft/60"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
        ["今週の目標", weekly, "weekly"],
        ["今月の目標", monthly, "monthly"],
        ["長期目標", longterm, null],
      ] as const).map(([label, list, suggestPeriod]) => (
        <div key={label} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-soft">{label}</span>
            <Badge tone="accent">{list.length}</Badge>
          </div>
          {suggestPeriod && (
            <SuggestButton
              period={suggestPeriod}
              onPick={(s) => {
                setTitle(s);
                setPeriod(suggestPeriod);
              }}
            />
          )}
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
