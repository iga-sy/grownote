import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapMonthlyReport } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (month) {
    const row = await db
      .prepare("SELECT * FROM monthly_reports WHERE year_month = ?")
      .get(month);
    return NextResponse.json({
      data: row ? mapMonthlyReport(row as never) : null,
    });
  }

  const rows = await db
    .prepare("SELECT * FROM monthly_reports ORDER BY year_month DESC")
    .all();
  return NextResponse.json({
    data: rows.map((r) => mapMonthlyReport(r as never)),
  });
}
