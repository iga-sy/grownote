"use client";

import { useMemo, useState } from "react";
import {
  Link2,
  ListChecks,
  NotebookPen,
  Plus,
  Repeat,
  Send,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { addDays, todayIso, WORK_HOUR_TIME_OPTIONS } from "@/lib/date";
import type { Memo, Priority, Task, TaskRepeat } from "@/lib/types";

const PRIORITY_LABEL: Record<Priority, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const PRIORITY_DOT: Record<Priority, string> = {
  low: "priority-dot priority-dot-low",
  medium: "priority-dot priority-dot-medium",
  high: "priority-dot priority-dot-high",
};

const REPEAT_LABEL: Record<TaskRepeat, string> = {
  none: "繰り返しなし",
  daily: "毎日",
  weekdays: "平日(月〜金)",
  weekly: "毎週",
};

function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <span
      title={`優先度: ${PRIORITY_LABEL[priority]}`}
      aria-label={`優先度: ${PRIORITY_LABEL[priority]}`}
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${PRIORITY_DOT[priority]}`}
    />
  );
}

function compareTasks(a: Task, b: Task): number {
  if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
  const ad = a.dueDate ?? "9999-99-99";
  const bd = b.dueDate ?? "9999-99-99";
  if (ad !== bd) return ad.localeCompare(bd);
  const at = a.dueTime ?? "99:99";
  const bt = b.dueTime ?? "99:99";
  return at.localeCompare(bt);
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-surface text-ink shadow-sm"
          : "text-ink-soft hover:text-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function TaskDetailPanel({
  task,
  onSave,
}: {
  task: Task;
  onSave: (id: number, description: string | null, fileUrl: string | null) => Promise<void>;
}) {
  const [description, setDescription] = useState(task.description ?? "");
  const [fileUrl, setFileUrl] = useState(task.fileUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await onSave(task.id, description.trim() || null, fileUrl.trim() || null);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col gap-2 rounded-md border border-border bg-accent-soft/25 p-2"
    >
      <textarea
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          setSaved(false);
        }}
        placeholder="概要メモを入力..."
        rows={2}
        className="resize-none rounded-md border border-border bg-surface px-2 py-1 text-xs"
      />
      <div className="flex items-center gap-2">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <input
          value={fileUrl}
          onChange={(e) => {
            setFileUrl(e.target.value);
            setSaved(false);
          }}
          placeholder="ファイルリンク(URL)を入力..."
          className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1 text-xs"
        />
      </div>
      <div className="flex items-center justify-between">
        {task.fileUrl ? (
          <a
            href={task.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-xs text-accent-dark hover:underline"
          >
            {task.fileUrl}
          </a>
        ) : (
          <span />
        )}
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="!px-3 !py-1 !text-xs"
        >
          {saved ? "保存しました" : "保存"}
        </Button>
      </div>
    </div>
  );
}

function TaskListPanel({
  tasks,
  onToggleDone,
  onAdd,
  onDelete,
  onUpdate,
}: {
  tasks: Task[];
  onToggleDone: (id: number, isDone: boolean) => Promise<void>;
  onAdd: (
    title: string,
    dueDate: string | null,
    dueTime: string | null,
    repeat: TaskRepeat,
    priority: Priority,
  ) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, description: string | null, fileUrl: string | null) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [repeat, setRepeat] = useState<TaskRepeat>("none");
  const [priority, setPriority] = useState<Priority>("medium");
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const sorted = useMemo(() => [...tasks].sort(compareTasks), [tasks]);
  const monthLimit = useMemo(() => addDays(todayIso(), 30), []);
  const withinMonth = useMemo(
    () => sorted.filter((t) => !t.dueDate || t.dueDate <= monthLimit),
    [sorted, monthLimit],
  );
  const visible = showAll ? sorted : withinMonth;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(title.trim(), dueDate || null, dueTime || null, repeat, priority);
      setTitle("");
      setDueDate("");
      setDueTime("");
      setRepeat("none");
      setPriority("medium");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タスクを入力"
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            lang="en-CA"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
          />
          <input
            type="time"
            list="task-due-time-options"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            placeholder="任意の時刻も入力可"
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
          />
          <datalist id="task-due-time-options">
            {WORK_HOUR_TIME_OPTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1">
            <span className="text-xs text-ink-soft">優先度</span>
            {(Object.keys(PRIORITY_LABEL) as Priority[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPriority(key)}
                title={PRIORITY_LABEL[key]}
                aria-label={`優先度: ${PRIORITY_LABEL[key]}`}
                className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  priority === key ? "ring-2 ring-accent ring-offset-1" : ""
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${PRIORITY_DOT[key]}`} />
              </button>
            ))}
          </div>
          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as TaskRepeat)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
          >
            {(Object.keys(REPEAT_LABEL) as TaskRepeat[]).map((key) => (
              <option key={key} value={key}>
                {REPEAT_LABEL[key]}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={submitting} className="ml-auto">
            <Plus className="h-4 w-4" />
            追加
          </Button>
        </div>
      </form>

      {tasks.length > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-soft">
            {showAll
              ? `すべて表示中(${sorted.length}件)`
              : `1ヶ月以内を表示中(${visible.length}/${sorted.length}件)`}
          </span>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="font-medium text-accent-dark hover:underline"
          >
            {showAll ? "1ヶ月以内のみ表示" : "すべて表示"}
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState message="タスクがまだありません。" />
      ) : (
        <ul className="flex flex-col gap-1 overflow-y-auto">
          {visible.map((t) => (
            <li
              key={t.id}
              onClick={() => setExpandedId((id) => (id === t.id ? null : t.id))}
              className={`flex cursor-pointer flex-col gap-1.5 rounded-md border px-2 py-1.5 text-sm transition-colors ${
                expandedId === t.id
                  ? "border-accent/30 bg-accent-soft/30"
                  : "border-transparent hover:bg-accent-soft/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={t.isDone}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onToggleDone(t.id, e.target.checked)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                <PriorityDot priority={t.priority} />
                <span
                  className={`min-w-0 flex-1 truncate ${
                    t.isDone ? "text-ink-soft line-through" : ""
                  }`}
                >
                  {t.title}
                </span>
                {t.fileUrl && (
                  <Link2 className="h-3 w-3 shrink-0 text-accent-dark" />
                )}
                {t.repeat !== "none" && (
                  <Repeat className="h-3 w-3 shrink-0 text-ink-soft" />
                )}
                {(t.dueDate || t.dueTime) && (
                  <span className="shrink-0 text-xs text-ink-soft">
                    {t.dueDate}
                    {t.dueTime ? ` ${t.dueTime}` : ""}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(t.id);
                  }}
                  aria-label="削除"
                  className="shrink-0 text-ink-soft hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {expandedId === t.id && (
                <TaskDetailPanel task={t} onSave={onUpdate} />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function FreeMemoPanel({
  memos,
  onAdd,
  onDelete,
}: {
  memos: Memo[];
  onAdd: (content: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(content.trim());
      setContent("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="思いついたこと・忘れたくないことを自由に書いておけます..."
          rows={2}
          className="resize-none rounded-md border border-border bg-surface px-2 py-1 text-sm"
        />
        <Button type="submit" disabled={submitting} className="self-end">
          <Send className="h-4 w-4" />
          追加
        </Button>
      </form>

      {memos.length === 0 ? (
        <EmptyState message="自由メモはまだありません。" />
      ) : (
        <ul className="flex flex-col gap-2 overflow-y-auto">
          {memos.map((m) => (
            <li
              key={m.id}
              className="group rounded-md border-l-4 border-accent-2 bg-accent-soft/40 p-2 text-sm"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs text-ink-soft">
                  {m.createdAt.slice(0, 16).replace("T", " ")}
                </span>
                <button
                  onClick={() => onDelete(m.id)}
                  aria-label="削除"
                  className="shrink-0 text-ink-soft opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="whitespace-pre-wrap break-words text-ink">
                {m.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function Tasks({
  tasks,
  onToggleDone,
  onAdd,
  onDelete,
  onUpdate,
  memos,
  onAddMemo,
  onDeleteMemo,
}: {
  tasks: Task[];
  onToggleDone: (id: number, isDone: boolean) => Promise<void>;
  onAdd: (
    title: string,
    dueDate: string | null,
    dueTime: string | null,
    repeat: TaskRepeat,
    priority: Priority,
  ) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, description: string | null, fileUrl: string | null) => Promise<void>;
  memos: Memo[];
  onAddMemo: (content: string) => Promise<void>;
  onDeleteMemo: (id: number) => Promise<void>;
}) {
  const [tab, setTab] = useState<"tasks" | "memo">("tasks");

  return (
    <Card title="タスク & メモ" icon={<ListChecks className="h-4 w-4" />}>
      <div className="flex gap-1 rounded-lg bg-accent-soft/40 p-1">
        <TabButton
          active={tab === "tasks"}
          onClick={() => setTab("tasks")}
          icon={<ListChecks className="h-3.5 w-3.5" />}
          label="タスク一覧"
        />
        <TabButton
          active={tab === "memo"}
          onClick={() => setTab("memo")}
          icon={<NotebookPen className="h-3.5 w-3.5" />}
          label="自由メモ"
        />
      </div>

      {tab === "tasks" ? (
        <TaskListPanel
          tasks={tasks}
          onToggleDone={onToggleDone}
          onAdd={onAdd}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ) : (
        <FreeMemoPanel memos={memos} onAdd={onAddMemo} onDelete={onDeleteMemo} />
      )}
    </Card>
  );
}
