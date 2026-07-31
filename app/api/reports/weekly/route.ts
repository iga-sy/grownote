import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapWeeklyReport } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");

  if (week) {
    const row = await db
      .prepare("SELECT * FROM weekly_reports WHERE week_start_date = ?")
      .get(week);
    return NextResponse.json({
      data: row ? mapWeeklyReport(row as never) : null,
    });
  }

  const rows = await db
    .prepare("SELECT * FROM weekly_reports ORDER BY week_start_date DESC")
    .all();
  return NextResponse.json({
    data: rows.map((r) => mapWeeklyReport(r as never)),
  });
}
