import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = Number((await context.params).id);
  await db.prepare("DELETE FROM notes WHERE id = ?").run(id);
  return NextResponse.json({ data: true });
}
