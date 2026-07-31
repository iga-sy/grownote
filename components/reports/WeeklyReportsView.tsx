"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientIconBadge } from "@/components/ui/GradientIconBadge";
import { todayIso, mondayOf } from "@/lib/date";
import type { WeeklyReport } from "@/lib/types";

function upsertByWeek(list: WeeklyReport[], item: WeeklyReport): WeeklyReport[] {
  const others = list.filter((r) => r.weekStartDate !== item.weekStartDate);
  return [item, ...others].sort((a, b) =>
    b.weekStartDate.localeCompare(a.weekStartDate),
  );
}

export function WeeklyReportsView({
  initialReports,
}: {
  initialReports: WeeklyReport[];
}) {
  const [reports, setReports] = useState(initialReports);
  const [pick, setPick] = useState(todayIso);
  const weekStart = mondayOf(pick);
  const [content, setContent] = useState(
    () =>
      reports.find((r) => r.weekStartDate === mondayOf(todayIso()))?.content ??
      "",
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectPick(date: string) {
    setPick(date);
    setError(null);
    const monday = mondayOf(date);
    setContent(reports.find((r) => r.weekStartDate === monday)?.content ?? "");
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/weekly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStartDate: weekStart }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "生成に失敗しました。");
        return;
      }
      setContent(json.data.content);
      setReports((prev) => upsertByWeek(prev, json.data as WeeklyReport));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/weekly/${weekStart}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "保存に失敗しました。");
        return;
      }
      setReports((prev) => upsertByWeek(prev, json.data as WeeklyReport));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 lg:flex-row">
      <Card title="履歴(週ごと)" className="shrink-0 lg:w-72">
        {reports.length === 0 ? (
          <EmptyState message="まだ週報がありません。" />
        ) : (
          <ul className="flex max-h-[500px] flex-col gap-1 overflow-y-auto">
            {reports.map((r) => (
              <li key={r.weekStartDate}>
                <button
                  onClick={() => selectPick(r.weekStartDate)}
                  className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                    weekStart === r.weekStartDate
                      ? "bg-accent-soft"
                      : "hover:bg-accent-soft/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink">
                      {r.weekStartDate} 〜 {r.weekEndDate}
                    </span>
                    <Badge tone={r.generatedBy === "gemini" ? "accent" : "ink"}>
                      {r.generatedBy === "gemini" ? "AI生成" : "手動"}
                    </Badge>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="週報を作成・編集"
        icon={
          <GradientIconBadge>
            <Sparkles className="h-3.5 w-3.5" />
          </GradientIconBadge>
        }
        className="flex-1"
      >
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={pick}
            onChange={(e) => selectPick(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
          />
          <span className="text-xs text-ink-soft">
            対象週: {weekStart}
          </span>
          <Button
            variant="ai"
            onClick={handleGenerate}
            disabled={loading}
            className="ml-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            生成
          </Button>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">
            {error}
          </p>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          placeholder="「生成」を押すと、選択した週(月〜日)の日報を積み上げて週報が作成されます。"
          className="flex-1 resize-none rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
        />

        <Button
          variant="secondary"
          onClick={handleSave}
          disabled={saving || !content.trim()}
          className="self-end"
        >
          保存
        </Button>
      </Card>
    </div>
  );
}
