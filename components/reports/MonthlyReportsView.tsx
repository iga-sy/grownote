"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientIconBadge } from "@/components/ui/GradientIconBadge";
import { currentYearMonth } from "@/lib/date";
import type { MonthlyReport } from "@/lib/types";

function upsertByMonth(
  list: MonthlyReport[],
  item: MonthlyReport,
): MonthlyReport[] {
  const others = list.filter((r) => r.yearMonth !== item.yearMonth);
  return [item, ...others].sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
}

export function MonthlyReportsView({
  initialReports,
}: {
  initialReports: MonthlyReport[];
}) {
  const [reports, setReports] = useState(initialReports);
  const [yearMonth, setYearMonth] = useState(currentYearMonth);
  const [content, setContent] = useState(
    () => reports.find((r) => r.yearMonth === currentYearMonth())?.content ?? "",
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectMonth(value: string) {
    setYearMonth(value);
    setError(null);
    setContent(reports.find((r) => r.yearMonth === value)?.content ?? "");
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/monthly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearMonth }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "生成に失敗しました。");
        return;
      }
      setContent(json.data.content);
      setReports((prev) => upsertByMonth(prev, json.data as MonthlyReport));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/monthly/${yearMonth}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "保存に失敗しました。");
        return;
      }
      setReports((prev) => upsertByMonth(prev, json.data as MonthlyReport));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 lg:flex-row">
      <Card title="履歴(月ごと)" className="shrink-0 lg:w-72">
        {reports.length === 0 ? (
          <EmptyState message="まだ月報がありません。" />
        ) : (
          <ul className="flex max-h-[500px] flex-col gap-1 overflow-y-auto">
            {reports.map((r) => (
              <li key={r.yearMonth}>
                <button
                  onClick={() => selectMonth(r.yearMonth)}
                  className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                    yearMonth === r.yearMonth
                      ? "bg-accent-soft"
                      : "hover:bg-accent-soft/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink">{r.yearMonth}</span>
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
        title="月報を作成・編集"
        icon={
          <GradientIconBadge>
            <Sparkles className="h-3.5 w-3.5" />
          </GradientIconBadge>
        }
        className="flex-1"
      >
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => selectMonth(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
          />
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
          placeholder="「生成」を押すと、選択した月の週報を積み上げて月報が作成されます。"
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
