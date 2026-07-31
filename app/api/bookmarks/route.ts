import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapBookmark } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .prepare("SELECT * FROM bookmarks ORDER BY created_at DESC")
    .all();
  return NextResponse.json({ data: rows.map((r) => mapBookmark(r as never)) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, url, category } = body as {
    title?: string;
    url?: string;
    category?: string;
  };

  if (!title || !url) {
    return NextResponse.json(
      { error: "title と url は必須です。" },
      { status: 400 },
    );
  }

  const result = await db
    .prepare(
      "INSERT INTO bookmarks (title, url, category) VALUES (?, ?, ?)",
    )
    .run(title, url, category ?? null);

  const row = await db
    .prepare("SELECT * FROM bookmarks WHERE id = ?")
    .get(result.lastInsertRowid);

  return NextResponse.json({ data: mapBookmark(row as never) }, { status: 201 });
}
