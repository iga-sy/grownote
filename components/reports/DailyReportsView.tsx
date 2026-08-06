"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, CalendarClock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientIconBadge } from "@/components/ui/GradientIconBadge";
import { GoalsDashboard } from "@/components/reports/GoalsDashboard";
import { todayIso, mondayOf } from "@/lib/date";
import type { Goal, Report, Schedule } from "@/lib/types";

type Tab = "manual" | "generated";

function upsertByDate(list: Report[], item: Report): Report[] {
  const others = list.filter((r) => r.reportDate !== item.reportDate);
  return [item, ...others].sort((a, b) => b.reportDate.localeCompare(a.reportDate));
}

function defaultTab(report: Report | undefined): Tab {
  if (!report) return "manual";
  if (report.manualContent) return "manual";
  if (report.generatedContent) return "generated";
  return "manual";
}

export function DailyReportsView({
  initialReports,
  initialGoals,
}: {
  initialReports: Report[];
  initialGoals: Goal[];
}) {
  const [reports, setReports] = useState(initialReports);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const initialReport = reports.find((r) => r.reportDate === todayIso());
  const [tab, setTab] = useState<Tab>(defaultTab(initialReport));
  const [content, setContent] = useState(
    () =>
      (tab === "manual" ? initialReport?.manualContent : initialReport?.generatedContent) ??
      "",
  );
  const [daySchedule, setDaySchedule] = useState<Schedule[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setScheduleLoading(true);
    fetch(`/api/schedules?date=${selectedDate}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setDaySchedule(json.data ?? []);
      })
      .finally(() => {
        if (!cancelled) setScheduleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  function switchTab(nextTab: Tab, date: string = selectedDate) {
    const report = reports.find((r) => r.reportDate === date);
    setTab(nextTab);
    setContent(
      (nextTab === "manual" ? report?.manualContent : report?.generatedContent) ?? "",
    );
  }

  function selectDate(date: string) {
    setSelectedDate(date);
    setError(null);
    const report = reports.find((r) => r.reportDate === date);
    switchTab(defaultTab(report), date);
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "生成に失敗しました。");
        return;
      }
      setReports((prev) => upsertByDate(prev, json.data as Report));
      setTab("generated");
      setContent((json.data as Report).generatedContent ?? "");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${selectedDate}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "保存に失敗しました。");
        return;
      }
      setReports((prev) => upsertByDate(prev, json.data as Report));
      setTab("manual");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <GoalsDashboard
        scope="weekly"
        periodKey={mondayOf(selectedDate)}
        periodLabel={`${mondayOf(selectedDate)}の週`}
        goals={initialGoals}
      />
      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
      <div className="flex shrink-0 flex-col gap-4 lg:w-72">
        <Card
          title={`${selectedDate} のスケジュール`}
          icon={<CalendarClock className="h-4 w-4" />}
        >
          {scheduleLoading ? (
            <p className="text-xs text-ink-soft">読み込み中...</p>
          ) : daySchedule.length === 0 ? (
            <EmptyState message="この日の予定はありません。" />
          ) : (
            <ul className="flex flex-col gap-1">
              {[...daySchedule]
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((s) => (
                  <li key={s.id} className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 font-mono text-xs text-ink-soft">
                      {s.startTime}
                      {s.endTime ? `-${s.endTime}` : ""}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{s.title}</span>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card title="履歴(日付ごと)">
          {reports.length === 0 ? (
            <EmptyState message="まだ日報がありません。" />
          ) : (
            <ul className="flex max-h-[360px] flex-col gap-1 overflow-y-auto">
              {reports.map((r) => (
                <li key={r.reportDate}>
                  <button
                    onClick={() => selectDate(r.reportDate)}
                    className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                      selectedDate === r.reportDate
                        ? "bg-accent-soft"
                        : "hover:bg-accent-soft/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink">{r.reportDate}</span>
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
      </div>

      <Card
        title="日報を作成・編集"
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
            value={selectedDate}
            onChange={(e) => selectDate(e.target.value)}
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
          placeholder="「生成」を押すと、その日の完了タスクとメモから日報が自動作成されます。"
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

      <Link
        href="/reports/weekly"
        className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-accent/40 bg-accent-soft/30 px-4 py-3 text-sm text-ink hover:bg-accent-soft/60"
      >
        <span>日報が整理できたら、次は週報をAIで作成しましょう。</span>
        <ArrowRight className="h-4 w-4 shrink-0 text-accent" />
      </Link>
    </div>
  );
}
