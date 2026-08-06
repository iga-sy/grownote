"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientIconBadge } from "@/components/ui/GradientIconBadge";
import { GoalsDashboard } from "@/components/reports/GoalsDashboard";
import { NextGoalSuggest } from "@/components/reports/NextGoalSuggest";
import { currentYearMonth } from "@/lib/date";
import type { Goal, MonthlyReport } from "@/lib/types";

type Tab = "manual" | "generated";

function upsertByMonth(
  list: MonthlyReport[],
  item: MonthlyReport,
): MonthlyReport[] {
  const others = list.filter((r) => r.yearMonth !== item.yearMonth);
  return [item, ...others].sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
}

function defaultTab(report: MonthlyReport | undefined): Tab {
  if (!report) return "manual";
  if (report.manualContent) return "manual";
  if (report.generatedContent) return "generated";
  return "manual";
}

export function MonthlyReportsView({
  initialReports,
  initialGoals,
}: {
  initialReports: MonthlyReport[];
  initialGoals: Goal[];
}) {
  const [reports, setReports] = useState(initialReports);
  const [goals, setGoals] = useState(initialGoals);
  const monthlyGoals = goals.filter((g) => g.period === "monthly");
  const [yearMonth, setYearMonth] = useState(currentYearMonth);
  const initialReport = reports.find((r) => r.yearMonth === currentYearMonth());
  const [tab, setTab] = useState<Tab>(defaultTab(initialReport));
  const [content, setContent] = useState(
    () =>
      (tab === "manual" ? initialReport?.manualContent : initialReport?.generatedContent) ??
      "",
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchTab(nextTab: Tab, month: string = yearMonth) {
    const report = reports.find((r) => r.yearMonth === month);
    setTab(nextTab);
    setContent(
      (nextTab === "manual" ? report?.manualContent : report?.generatedContent) ?? "",
    );
  }

  function selectMonth(value: string) {
    setYearMonth(value);
    setError(null);
    const report = reports.find((r) => r.yearMonth === value);
    switchTab(defaultTab(report), value);
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
      setReports((prev) => upsertByMonth(prev, json.data as MonthlyReport));
      setTab("generated");
      setContent((json.data as MonthlyReport).generatedContent ?? "");
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
      setTab("manual");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <GoalsDashboard
        scope="monthly"
        periodKey={yearMonth}
        periodLabel={yearMonth}
        goals={goals}
      />
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
                    <div className="flex items-center gap-1">
                      {r.manualContent && <Badge tone="ink">手動</Badge>}
                      {r.generatedContent && <Badge tone="accent">AI生成</Badge>}
                    </div>
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

        <div className="flex w-fit gap-1 rounded-lg bg-accent-soft/40 p-1">
          <button
            type="button"
            onClick={() => switchTab("manual")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              tab === "manual" ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            手動
          </button>
          <button
            type="button"
            onClick={() => switchTab("generated")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              tab === "generated" ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            AI生成
          </button>
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
          placeholder="「生成」を押すと、選択した月の週報を積み上げ、育成面談シートの月次欄(①今月の目標/②目標達成度合い/③来月に向けての改善案)の形式で月報が作成されます。"
          className="flex-1 resize-none rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
        />

        <Button
          variant="secondary"
          onClick={handleSave}
          disabled={saving || !content.trim()}
          className="self-end"
        >
          手動版として保存
        </Button>
      </Card>
      </div>

      <NextGoalSuggest
        period="monthly"
        currentGoals={monthlyGoals}
        onAdded={(goal) => setGoals((prev) => [goal, ...prev])}
      />
    </div>
  );
}
