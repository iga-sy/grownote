"use client";

import { useEffect, useState } from "react";
import { Compass, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientIconBadge } from "@/components/ui/GradientIconBadge";
import { GoalTracker } from "@/components/dashboard/GoalTracker";
import type { Goal, GoalPeriod, Roadmap } from "@/lib/types";

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

export function RoadmapView({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState(initialGoals);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/roadmap")
      .then((res) => res.json())
      .then((json) => setRoadmap(json.data))
      .finally(() => setLoading(false));
  }, []);

  async function handleAddGoal(
    title: string,
    period: GoalPeriod,
    parentGoalId?: number | null,
  ) {
    const created = await postJson<Goal>("/api/goals", {
      title,
      period,
      parentGoalId,
    });
    setGoals((prev) => [created, ...prev]);
  }

  async function handleGoalProgressChange(id: number, progress: number) {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, progress } : g)));
    await patchJson<Goal>(`/api/goals/${id}`, { progress });
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/roadmap/generate", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "生成に失敗しました。");
        return;
      }
      setRoadmap(json.data);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold text-ink">ロードマップ</h1>
        <p className="text-sm text-ink-soft">
          目標を登録すると、長期目標・今月・今週の目標と未完了タスクから、今何をすべきかをAIが逆算して提案します。
        </p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <GoalTracker
          goals={goals}
          onAdd={handleAddGoal}
          onProgressChange={handleGoalProgressChange}
        />

        <div className="animate-fade-in flex flex-col gap-3 rounded-lg border border-border bg-surface p-6 shadow-md shadow-navy/5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <GradientIconBadge>
                <Compass className="h-3.5 w-3.5" />
              </GradientIconBadge>
              AIによる逆算提案
            </h2>
            <Button variant="ai" onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              目標から逆算して提案する
            </Button>
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">
              {error}
            </p>
          )}

          {loading ? (
            <p className="text-sm text-ink-soft">読み込み中...</p>
          ) : !roadmap ? (
            <EmptyState message="まだロードマップが生成されていません。目標を登録してから「生成」を押してください。" />
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-ink-soft">
                生成日時: {roadmap.generatedAt}
              </p>
              <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
                {roadmap.content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
