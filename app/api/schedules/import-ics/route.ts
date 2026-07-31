import { NextResponse } from "next/server";
import * as ical from "node-ical";
import db from "@/lib/db";
import { mapSchedule } from "@/lib/types";

export const dynamic = "force-dynamic";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { icsText } = body as { icsText?: string };

  if (!icsText) {
    return NextResponse.json({ error: "icsText は必須です。" }, { status: 400 });
  }

  let parsed: ical.CalendarResponse;
  try {
    parsed = ical.sync.parseICS(icsText);
  } catch {
    return NextResponse.json(
      { error: "icsファイルの解析に失敗しました。ファイル形式を確認してください。" },
      { status: 400 },
    );
  }

  const insert = await db.prepare(
    "INSERT INTO schedules (title, date, start_time, end_time, memo) VALUES (?, ?, ?, ?, ?)",
  );

  const createdIds: number[] = [];
  for (const key of Object.keys(parsed)) {
    const component = parsed[key];
    if (!component || component.type !== "VEVENT") continue;
    if (!(component.start instanceof Date)) continue;

    const summary =
      typeof component.summary === "string"
        ? component.summary
        : (component.summary?.val ?? "(タイトルなし)");

    const start = component.start;
    const end = component.end instanceof Date ? component.end : null;

    const result = await insert.run(
      summary,
      formatDate(start),
      formatTime(start),
      end ? formatTime(end) : null,
      "Outlookから取り込み",
    );
    createdIds.push(Number(result.lastInsertRowid));
  }

  if (createdIds.length === 0) {
    return NextResponse.json(
      { error: "取り込める予定が見つかりませんでした。" },
      { status: 400 },
    );
  }

  const placeholders = createdIds.map(() => "?").join(",");
  const rows = await db
    .prepare(`SELECT * FROM schedules WHERE id IN (${placeholders}) ORDER BY date, start_time`)
    .all(...createdIds);

  return NextResponse.json({
    data: rows.map((r) => mapSchedule(r as never)),
    count: createdIds.length,
  });
}
