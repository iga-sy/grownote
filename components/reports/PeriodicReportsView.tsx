"use client";

import { useState } from "react";
import { CalendarClock, CalendarRange } from "lucide-react";
import { WeeklyReportsView } from "@/components/reports/WeeklyReportsView";
import { MonthlyReportsView } from "@/components/reports/MonthlyReportsView";
import type { MonthlyReport, WeeklyReport } from "@/lib/types";

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-surface text-ink shadow-sm ring-1 ring-accent/15"
          : "text-ink-soft hover:text-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function PeriodicReportsView({
  initialWeeklyReports,
  initialMonthlyReports,
}: {
  initialWeeklyReports: WeeklyReport[];
  initialMonthlyReports: MonthlyReport[];
}) {
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex max-w-xs gap-1 rounded-lg bg-accent-soft/40 p-1">
        <TabButton
          active={tab === "weekly"}
          onClick={() => setTab("weekly")}
          icon={<CalendarClock className="h-3.5 w-3.5" />}
          label="週報"
        />
        <TabButton
          active={tab === "monthly"}
          onClick={() => setTab("monthly")}
          icon={<CalendarRange className="h-3.5 w-3.5" />}
          label="月報"
        />
      </div>

      {tab === "weekly" ? (
        <WeeklyReportsView initialReports={initialWeeklyReports} />
      ) : (
        <MonthlyReportsView initialReports={initialMonthlyReports} />
      )}
    </div>
  );
}
