import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapRoadmap } from "@/lib/types";
import { buildRoadmapPrompt, generateRoadmap } from "@/lib/gemini";
import { todayIso } from "@/lib/date";

export const dynamic = "force-dynamic";

interface GoalRow {
  title: string;
  progress: number;
  target_date: string | null;
}

async function fetchGoals(period: string): Promise<GoalRow[]> {
  return await db
    .prepare(
      "SELECT title, progress, target_date FROM goals WHERE period = ? ORDER BY created_at DESC",
    )
    .all(period) as never as GoalRow[];
}

export async function POST() {
  const today = todayIso();

  const longtermGoals = await fetchGoals("longterm");
  const monthlyGoals = await fetchGoals("monthly");
  const weeklyGoals = await fetchGoals("weekly");

  const upcomingTasks = await db
    .prepare(
      `SELECT title, due_date FROM tasks
       WHERE is_done = 0
       ORDER BY (due_date IS NULL), due_date, due_time
       LIMIT 10`,
    )
    .all() as { title: string; due_date: string | null }[];

  const prompt = buildRoadmapPrompt(
    today,
    longtermGoals.map((g) => ({
      title: g.title,
      progress: g.progress,
      targetDate: g.target_date,
    })),
    monthlyGoals.map((g) => ({
      title: g.title,
      progress: g.progress,
      targetDate: g.target_date,
    })),
    weeklyGoals.map((g) => ({
      title: g.title,
      progress: g.progress,
      targetDate: g.target_date,
    })),
    upcomingTasks.map((t) => ({ title: t.title, dueDate: t.due_date })),
  );

  let content: string;
  try {
    content = await generateRoadmap(prompt);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ロードマップの生成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const result = await db
    .prepare("INSERT INTO roadmaps (content) VALUES (?)")
    .run(content);

  const row = await db
    .prepare("SELECT * FROM roadmaps WHERE id = ?")
    .get(result.lastInsertRowid);

  return NextResponse.json({ data: mapRoadmap(row as never) });
}
