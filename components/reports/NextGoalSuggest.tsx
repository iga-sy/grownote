"use client";

import { useState } from "react";
import { Sparkles, Loader2, Target, Plus, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GradientIconBadge } from "@/components/ui/GradientIconBadge";
import type { Goal, GoalPeriod } from "@/lib/types";
import type { GoalSuggestionGroup } from "@/lib/gemini";

const CATEGORY_LABEL: Record<GoalSuggestionGroup["category"], string> = {
  business: "業務面",
  technical: "技術・知識面",
};

const TITLE: Record<"weekly" | "monthly", string> = {
  weekly: "次週の目標",
  monthly: "次月の目標",
};

export function NextGoalSuggest({
  period,
  currentGoals,
  monthlyGoals,
  onAdded,
}: {
  period: "weekly" | "monthly";
  currentGoals: Goal[];
  monthlyGoals?: Goal[];
  onAdded: (goal: Goal) => void;
}) {
  const [groups, setGroups] = useState<GoalSuggestionGroup[] | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [parentGoalId, setParentGoalId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function handleSuggest() {
    setSuggesting(true);
    setSuggestError(null);
    try {
      const res = await fetch("/api/goals/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSuggestError(json.error ?? "提案の生成に失敗しました。");
        return;
      }
      setGroups(json.data as GoalSuggestionGroup[]);
    } finally {
      setSuggesting(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          period: period as GoalPeriod,
          parentGoalId: period === "weekly" ? parentGoalId : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAddError(json.error ?? "目標の追加に失敗しました。");
        return;
      }
      onAdded(json.data as Goal);
      setTitle("");
      setParentGoalId(null);
    } finally {
      setAdding(false);
    }
  }

  return (
    <Card
      title={TITLE[period]}
      icon={
        <GradientIconBadge>
          <Target className="h-3.5 w-3.5" />
        </GradientIconBadge>
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-ink-soft">
          {period === "weekly"
            ? "この週報の内容をもとに、来週の目標をAIに提案してもらえます。"
            : "この月報の内容をもとに、来月の目標をAIに提案してもらえます。"}
        </span>
        <Button variant="ai" onClick={handleSuggest} disabled={suggesting}>
          {suggesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          AIに提案してもらう
        </Button>
      </div>

      {suggestError && (
        <p className="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">
          {suggestError}
        </p>
      )}

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
                      onClick={() => setTitle(s)}
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

      <form onSubmit={handleAdd} className="flex flex-col gap-2 border-t border-border pt-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="提案を選ぶか、目標を自分で入力・編集してください"
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
        />
        {period === "weekly" && (
          <select
            value={parentGoalId ?? ""}
            onChange={(e) =>
              setParentGoalId(e.target.value ? Number(e.target.value) : null)
            }
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink-soft"
          >
            <option value="">紐づける月間目標を選択(任意)</option>
            {(monthlyGoals ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        )}
        {addError && <p className="text-xs text-red-600">{addError}</p>}
        <Button type="submit" disabled={adding || !title.trim()} className="self-end">
          <Plus className="h-4 w-4" />
          {TITLE[period]}として追加
        </Button>
      </form>

      {currentGoals.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border pt-3">
          <span className="text-[11px] font-semibold text-ink-soft">追加済みの{TITLE[period]}</span>
          <ul className="flex flex-col gap-1">
            {currentGoals.map((g) => (
              <li key={g.id} className="flex items-center gap-1.5 text-xs text-ink">
                <Check className="h-3 w-3 shrink-0 text-accent" />
                <span className="truncate">{g.title}</span>
                {g.period === "weekly" && g.parentGoalId && (
                  <Badge tone="accent">
                    {monthlyGoals?.find((m) => m.id === g.parentGoalId)?.title ?? "月間目標"}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
