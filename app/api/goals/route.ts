import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapGoal } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");

  const rows = period
    ? await db
        .prepare(
          "SELECT * FROM goals WHERE period = ? ORDER BY created_at DESC",
        )
        .all(period)
    : await db.prepare("SELECT * FROM goals ORDER BY created_at DESC").all();

  return NextResponse.json({ data: rows.map((r) => mapGoal(r as never)) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, period, targetDate } = body as {
    title?: string;
    period?: string;
    targetDate?: string;
  };

  if (
    !title ||
    (period !== "weekly" && period !== "monthly" && period !== "longterm")
  ) {
    return NextResponse.json(
      { error: "title と period(longterm|weekly|monthly)は必須です。" },
      { status: 400 },
    );
  }

  const result = await db
    .prepare(
      "INSERT INTO goals (title, period, target_date) VALUES (?, ?, ?)",
    )
    .run(title, period, targetDate ?? null);

  const row = await db.prepare("SELECT * FROM goals WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json({ data: mapGoal(row as never) }, { status: 201 });
}
