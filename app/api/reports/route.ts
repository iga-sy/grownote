import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapReport } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (date) {
    const row = await db
      .prepare("SELECT * FROM reports WHERE report_date = ?")
      .get(date);
    return NextResponse.json({ data: row ? mapReport(row as never) : null });
  }

  const rows = await db
    .prepare("SELECT * FROM reports ORDER BY report_date DESC")
    .all();
  return NextResponse.json({ data: rows.map((r) => mapReport(r as never)) });
}
