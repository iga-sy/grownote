import { NextResponse } from "next/server";
import db from "@/lib/db";
import { mapRoadmap } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const row = await db
    .prepare("SELECT * FROM roadmaps ORDER BY generated_at DESC LIMIT 1")
    .get();
  return NextResponse.json({ data: row ? mapRoadmap(row as never) : null });
}
