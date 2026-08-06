"use client";

import { useState } from "react";
import { CalendarClock, CalendarRange } from "lucide-react";
import { WeeklyReportsView } from "@/components/reports/WeeklyReportsView";
import { MonthlyReportsView } from "@/components/reports/MonthlyReportsView";
import type { Goal, MonthlyReport, WeeklyReport } from "@/lib/types";

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
  initialGoals,
}: {
  initialWeeklyReports: WeeklyReport[];
  initialMonthlyReports: MonthlyReport[];
  initialGoals: Goal[];
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

      <div className="relative flex flex-1 flex-col">
        <div
          className={
            tab === "weekly"
              ? "flex flex-1 flex-col"
              : "invisible pointer-events-none absolute inset-0 flex flex-1 flex-col overflow-hidden"
          }
        >
          <WeeklyReportsView
            initialReports={initialWeeklyReports}
            initialGoals={initialGoals}
          />
        </div>
        <div
          className={
            tab === "monthly"
              ? "flex flex-1 flex-col"
              : "invisible pointer-events-none absolute inset-0 flex flex-1 flex-col overflow-hidden"
          }
        >
          <MonthlyReportsView
            initialReports={initialMonthlyReports}
            initialGoals={initialGoals}
          />
        </div>
      </div>
    </div>
  );
}
