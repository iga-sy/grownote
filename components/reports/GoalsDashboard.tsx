"use client";

import { useEffect, useState } from "react";
import { Target, Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientIconBadge } from "@/components/ui/GradientIconBadge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import type { Goal, GoalReview } from "@/lib/types";

const SCOPE_LABEL: Record<"weekly" | "monthly", string> = {
  weekly: "今週の目標",
  monthly: "今月の目標",
};

export function GoalsDashboard({
  scope,
  periodKey,
  periodLabel,
  goals,
  className = "",
}: {
  scope: "weekly" | "monthly";
  periodKey: string;
  periodLabel: string;
  goals: Goal[];
  className?: string;
}) {
  const targetGoals = goals.filter((g) => g.period === scope);
  const monthlyTitleById = new Map(
    goals.filter((g) => g.period === "monthly").map((g) => [g.id, g.title]),
  );

  const [review, setReview] = useState<GoalReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/goals/review?scope=${scope}&periodKey=${periodKey}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setReview(json.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scope, periodKey]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/goals/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, periodKey }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "振り返りの生成に失敗しました。");
        return;
      }
      setReview(json.data as GoalReview);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card
      title="目標ダッシュボード"
      icon={<Target className="h-4 w-4" />}
      className={className}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-ink-soft">
            {SCOPE_LABEL[scope]}({periodLabel})
          </span>
        </div>
        {targetGoals.length === 0 ? (
          <EmptyState message="この期間の目標がまだありません。ロードマップページで登録してください。" />
        ) : (
          <ul className="flex flex-col gap-2 sm:grid sm:grid-cols-2">
            {targetGoals.map((g) => (
              <li key={g.id} className="flex items-center gap-3">
                <ProgressRing value={g.progress} size={40} strokeWidth={5} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm">{g.title}</span>
                  {scope === "weekly" && g.parentGoalId && (
                    <span className="truncate text-[11px] text-ink-soft">
                      ↳ 月間目標: {monthlyTitleById.get(g.parentGoalId) ?? "(削除済み)"}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <GradientIconBadge>
            <Sparkles className="h-3.5 w-3.5" />
          </GradientIconBadge>
          AIによる振り返り
        </h3>
        <Button variant="ai" onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          AIに振り返ってもらう
        </Button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink-soft">読み込み中...</p>
      ) : !review ? (
        <EmptyState message="まだ振り返りが生成されていません。「AIに振り返ってもらう」を押してください。" />
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-soft">生成日時: {review.updatedAt}</p>
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
            {review.generatedContent}
          </div>
        </div>
      )}
    </Card>
  );
}
