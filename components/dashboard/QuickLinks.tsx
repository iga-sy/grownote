"use client";

import { useState } from "react";
import { Bookmark as BookmarkIcon, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Bookmark } from "@/lib/types";

export function QuickLinks({
  bookmarks,
  onAdd,
  onDelete,
}: {
  bookmarks: Bookmark[];
  onAdd: (title: string, url: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(title.trim(), url.trim());
      setTitle("");
      setUrl("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="クイックリンク" icon={<BookmarkIcon className="h-4 w-4" />}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトル"
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
        />
        <Button type="submit" disabled={submitting} className="self-end">
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </form>

      {bookmarks.length === 0 ? (
        <EmptyState message="まだブックマークがありません。" />
      ) : (
        <ul className="flex flex-col gap-1 overflow-y-auto">
          {bookmarks.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-accent-soft/40"
            >
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center gap-1 text-sm text-accent-dark hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{b.title}</span>
              </a>
              <button
                onClick={() => onDelete(b.id)}
                aria-label="削除"
                className="shrink-0 text-ink-soft hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
