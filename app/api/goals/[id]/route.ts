import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapGoal } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = Number((await context.params).id);
  const body = await request.json();
  const { title, progress, targetDate, parentGoalId } = body as {
    title?: string;
    progress?: number;
    targetDate?: string | null;
    parentGoalId?: number | null;
  };

  const existing = await db.prepare("SELECT * FROM goals WHERE id = ?").get(id) as
    | { target_date: string | null; parent_goal_id: number | null }
    | undefined;
  if (!existing) {
    return NextResponse.json({ error: "見つかりません。" }, { status: 404 });
  }

  await db.prepare(
    `UPDATE goals SET
       title = COALESCE(?, title),
       progress = COALESCE(?, progress),
       target_date = ?,
       parent_goal_id = ?,
       updated_at = datetime('now', 'localtime')
     WHERE id = ?`,
  ).run(
    title ?? null,
    progress ?? null,
    targetDate !== undefined ? targetDate : existing.target_date,
    parentGoalId !== undefined ? parentGoalId : existing.parent_goal_id,
    id,
  );

  const row = await db.prepare("SELECT * FROM goals WHERE id = ?").get(id);
  return NextResponse.json({ data: mapGoal(row as never) });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = Number((await context.params).id);
  await db.prepare("DELETE FROM goals WHERE id = ?").run(id);
  return NextResponse.json({ data: true });
}
