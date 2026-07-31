import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapBookmark } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = Number((await context.params).id);
  const body = await request.json();
  const { title, url, category } = body as {
    title?: string;
    url?: string;
    category?: string | null;
  };

  const existing = await db
    .prepare("SELECT * FROM bookmarks WHERE id = ?")
    .get(id);
  if (!existing) {
    return NextResponse.json({ error: "見つかりません。" }, { status: 404 });
  }

  await db.prepare(
    `UPDATE bookmarks SET
       title = COALESCE(?, title),
       url = COALESCE(?, url),
       category = ?
     WHERE id = ?`,
  ).run(
    title ?? null,
    url ?? null,
    category !== undefined ? category : (existing as { category: string | null }).category,
    id,
  );

  const row = await db.prepare("SELECT * FROM bookmarks WHERE id = ?").get(id);
  return NextResponse.json({ data: mapBookmark(row as never) });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = Number((await context.params).id);
  await db.prepare("DELETE FROM bookmarks WHERE id = ?").run(id);
  return NextResponse.json({ data: true });
}
