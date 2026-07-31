import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapMemo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .prepare("SELECT * FROM memos ORDER BY created_at DESC")
    .all();
  return NextResponse.json({ data: rows.map((r) => mapMemo(r as never)) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { content } = body as { content?: string };

  if (!content) {
    return NextResponse.json({ error: "content は必須です。" }, { status: 400 });
  }

  const result = await db
    .prepare("INSERT INTO memos (content) VALUES (?)")
    .run(content);

  const row = await db.prepare("SELECT * FROM memos WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json({ data: mapMemo(row as never) }, { status: 201 });
}
