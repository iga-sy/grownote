import { NextResponse } from "next/server";
import db from "@/lib/db";
import { buildGoalSuggestionPrompt, generateGoalSuggestions } from "@/lib/gemini";
import { addDays, todayIso } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { period } = body as { period?: string };

  if (period !== "weekly" && period !== "monthly") {
    return NextResponse.json(
      { error: "period は weekly か monthly を指定してください。" },
      { status: 400 },
    );
  }

  let reports: { label: string; content: string }[];

  if (period === "weekly") {
    const since = addDays(todayIso(), -14);
    const rows = await db
      .prepare(
        `SELECT report_date, COALESCE(manual_content, generated_content) AS content
         FROM reports
         WHERE report_date >= ?
         ORDER BY report_date DESC`,
      )
      .all(since) as { report_date: string; content: string | null }[];
    reports = rows
      .filter((r) => r.content)
      .map((r) => ({ label: r.report_date, content: r.content as string }));
  } else {
    const since = addDays(todayIso(), -56);
    const rows = await db
      .prepare(
        `SELECT week_start_date, week_end_date, COALESCE(manual_content, generated_content) AS content
         FROM weekly_reports
         WHERE week_start_date >= ?
         ORDER BY week_start_date DESC`,
      )
      .all(since) as {
      week_start_date: string;
      week_end_date: string;
      content: string | null;
    }[];
    reports = rows
      .filter((r) => r.content)
      .map((r) => ({
        label: `${r.week_start_date} 〜 ${r.week_end_date}`,
        content: r.content as string,
      }));
  }

  const prompt = buildGoalSuggestionPrompt(period, reports);

  try {
    const suggestions = await generateGoalSuggestions(prompt);
    return NextResponse.json({ data: suggestions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "目標提案の生成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
