import db from "@/lib/db";
import { mapReport } from "@/lib/types";
import { DailyReportsView } from "@/components/reports/DailyReportsView";

export const dynamic = "force-dynamic";

export default async function DailyReportsPage() {
  const rows = await db
    .prepare("SELECT * FROM reports ORDER BY report_date DESC")
    .all();
  const reports = rows.map((r) => mapReport(r as never));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold text-ink">日報</h1>
        <p className="text-sm text-ink-soft">
          その日の完了タスクとメモから、AIが日報を自動生成します。過去の日報は日付ごとに一覧できます。
        </p>
      </div>
      <DailyReportsView initialReports={reports} />
    </div>
  );
}
