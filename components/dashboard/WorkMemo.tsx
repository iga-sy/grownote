"use client";

import { useState } from "react";
import { NotebookPen, Send } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Note, NoteCategory, Schedule } from "@/lib/types";

const CATEGORY_LABEL: Record<NoteCategory, string> = {
  insight: "気付き",
  learning: "学び",
  problem: "困りごと",
  note: "メモ",
};

const CATEGORY_TONE: Record<NoteCategory, "accent" | "emerald" | "red" | "ink"> = {
  insight: "accent",
  learning: "emerald",
  problem: "red",
  note: "ink",
};

export function WorkMemo({
  selectedSchedule,
  notes,
  onAddNote,
}: {
  selectedSchedule: Schedule | null;
  notes: Note[];
  onAddNote: (category: NoteCategory, content: string) => Promise<void>;
}) {
  const [category, setCategory] = useState<NoteCategory>("insight");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onAddNote(category, content.trim());
      setContent("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="リアルタイム作業メモ" icon={<NotebookPen className="h-4 w-4" />}>
      {!selectedSchedule ? (
        <EmptyState message="左のスケジュールから予定を選択してください。" />
      ) : (
        <>
          <p className="truncate text-xs text-ink-soft">
            対象の予定: <span className="font-medium">{selectedSchedule.title}</span>
            <span className="ml-1 text-ink-soft">
              ({selectedSchedule.startTime}
              {selectedSchedule.endTime ? `-${selectedSchedule.endTime}` : ""})
            </span>
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NoteCategory)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
            >
              <option value="insight">気付き</option>
              <option value="learning">学び</option>
              <option value="problem">困りごと</option>
              <option value="note">メモ</option>
            </select>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="気付き・学び・困りごとを記録..."
              rows={2}
              className="resize-none rounded-md border border-border bg-surface px-2 py-1 text-sm"
            />
            <Button type="submit" disabled={submitting} className="self-end">
              <Send className="h-4 w-4" />
              投稿
            </Button>
          </form>

          {notes.length === 0 ? (
            <EmptyState message="この予定のメモはまだありません。" />
          ) : (
            <ul className="flex flex-col gap-2 overflow-y-auto">
              {notes.map((n) => (
                <li key={n.id} className="rounded-md bg-accent-soft/50 p-2 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <Badge tone={CATEGORY_TONE[n.category]}>
                      {CATEGORY_LABEL[n.category]}
                    </Badge>
                    <span className="text-xs text-ink-soft">
                      {n.createdAt.slice(0, 16).replace("T", " ")}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-ink">
                    {n.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}
