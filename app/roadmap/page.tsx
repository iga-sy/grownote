import db from "@/lib/db";
import { mapGoal } from "@/lib/types";
import { RoadmapView } from "@/components/dashboard/RoadmapView";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const rows = await db
    .prepare("SELECT * FROM goals ORDER BY created_at DESC")
    .all();
  const goals = rows.map((r) => mapGoal(r as never));

  return (
    <div className="flex flex-1 flex-col">
      <RoadmapView initialGoals={goals} />
    </div>
  );
}
