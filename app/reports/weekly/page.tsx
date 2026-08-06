import db from "@/lib/db";
import { mapGoal, mapMonthlyReport, mapWeeklyReport } from "@/lib/types";
import { PeriodicReportsView } from "@/components/reports/PeriodicReportsView";

export const dynamic = "force-dynamic";

export default async function WeeklyReportsPage() {
  const weeklyRows = await db
    .prepare("SELECT * FROM weekly_reports ORDER BY week_start_date DESC")
    .all();
  const monthlyRows = await db
    .prepare("SELECT * FROM monthly_reports ORDER BY year_month DESC")
    .all();
  const goalRows = await db
    .prepare("SELECT * FROM goals ORDER BY created_at DESC")
    .all();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold text-ink">週報・月報</h1>
        <p className="text-sm text-ink-soft">
          日報を積み上げて週報を、週報を積み上げて月報をAIが自動生成します。
        </p>
      </div>
      <PeriodicReportsView
        initialWeeklyReports={weeklyRows.map((r) => mapWeeklyReport(r as never))}
        initialMonthlyReports={monthlyRows.map((r) => mapMonthlyReport(r as never))}
        initialGoals={goalRows.map((r) => mapGoal(r as never))}
      />
    </div>
  );
}
