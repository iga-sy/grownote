import db from "@/lib/db";
import { mapTask } from "@/lib/types";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const rows = await db
    .prepare("SELECT * FROM tasks WHERE due_date IS NOT NULL ORDER BY due_date, due_time")
    .all();
  const tasks = rows.map((r) => mapTask(r as never));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold text-ink">カレンダー</h1>
        <p className="text-sm text-ink-soft">タスクの締切(日付・時刻)を月間表示します。</p>
      </div>
      <MonthCalendar tasks={tasks} />
    </div>
  );
}
