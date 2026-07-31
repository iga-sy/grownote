export type Priority = "low" | "medium" | "high";
export type TaskRepeat = "none" | "daily" | "weekdays" | "weekly";
export type NoteCategory = "insight" | "learning" | "problem" | "note";
export type GoalPeriod = "longterm" | "weekly" | "monthly";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string | null;
  dueDate: string | null;
  dueTime: string | null;
  priority: Priority;
  repeat: TaskRepeat;
  isDone: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string | null;
  memo: string | null;
  taskId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: number;
  taskId: number | null;
  scheduleId: number | null;
  category: NoteCategory;
  content: string;
  createdAt: string;
}

export interface Memo {
  id: number;
  content: string;
  createdAt: string;
}

export interface Bookmark {
  id: number;
  title: string;
  url: string;
  category: string | null;
  createdAt: string;
}

export interface Goal {
  id: number;
  title: string;
  period: GoalPeriod;
  progress: number;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: number;
  reportDate: string;
  manualContent: string | null;
  generatedContent: string | null;
  taskIdsSnapshot: number[];
  generatedBy: "gemini" | "manual";
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReport {
  id: number;
  weekStartDate: string;
  weekEndDate: string;
  manualContent: string | null;
  generatedContent: string | null;
  generatedBy: "gemini" | "manual";
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyReport {
  id: number;
  yearMonth: string;
  manualContent: string | null;
  generatedContent: string | null;
  generatedBy: "gemini" | "manual";
  createdAt: string;
  updatedAt: string;
}

export interface Roadmap {
  id: number;
  content: string;
  generatedAt: string;
}

interface TaskRow {
  id: number;
  title: string;
  description: string | null;
  file_url: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: string;
  repeat: string;
  is_done: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ScheduleRow {
  id: number;
  title: string;
  date: string;
  start_time: string;
  end_time: string | null;
  memo: string | null;
  task_id: number | null;
  created_at: string;
  updated_at: string;
}

interface NoteRow {
  id: number;
  task_id: number | null;
  schedule_id: number | null;
  category: string;
  content: string;
  created_at: string;
}

interface MemoRow {
  id: number;
  content: string;
  created_at: string;
}

interface BookmarkRow {
  id: number;
  title: string;
  url: string;
  category: string | null;
  created_at: string;
}

interface GoalRow {
  id: number;
  title: string;
  period: string;
  progress: number;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

interface ReportRow {
  id: number;
  report_date: string;
  manual_content: string | null;
  generated_content: string | null;
  task_ids_snapshot: string | null;
  generated_by: string;
  created_at: string;
  updated_at: string;
}

interface WeeklyReportRow {
  id: number;
  week_start_date: string;
  week_end_date: string;
  manual_content: string | null;
  generated_content: string | null;
  generated_by: string;
  created_at: string;
  updated_at: string;
}

interface MonthlyReportRow {
  id: number;
  year_month: string;
  manual_content: string | null;
  generated_content: string | null;
  generated_by: string;
  created_at: string;
  updated_at: string;
}

interface RoadmapRow {
  id: number;
  content: string;
  generated_at: string;
}

export function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    fileUrl: row.file_url,
    dueDate: row.due_date,
    dueTime: row.due_time,
    priority: row.priority as Priority,
    repeat: row.repeat as TaskRepeat,
    isDone: row.is_done === 1,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSchedule(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    memo: row.memo,
    taskId: row.task_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapNote(
  row: NoteRow & { task_title?: string | null; schedule_title?: string | null },
): Note & { taskTitle?: string | null; scheduleTitle?: string | null } {
  return {
    id: row.id,
    taskId: row.task_id,
    scheduleId: row.schedule_id,
    category: row.category as NoteCategory,
    content: row.content,
    createdAt: row.created_at,
    taskTitle: row.task_title ?? undefined,
    scheduleTitle: row.schedule_title ?? undefined,
  };
}

export function mapMemo(row: MemoRow): Memo {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
  };
}

export function mapBookmark(row: BookmarkRow): Bookmark {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    category: row.category,
    createdAt: row.created_at,
  };
}

export function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    period: row.period as GoalPeriod,
    progress: row.progress,
    targetDate: row.target_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapReport(row: ReportRow): Report {
  return {
    id: row.id,
    reportDate: row.report_date,
    manualContent: row.manual_content,
    generatedContent: row.generated_content,
    taskIdsSnapshot: row.task_ids_snapshot
      ? (JSON.parse(row.task_ids_snapshot) as number[])
      : [],
    generatedBy: row.generated_by as "gemini" | "manual",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWeeklyReport(row: WeeklyReportRow): WeeklyReport {
  return {
    id: row.id,
    weekStartDate: row.week_start_date,
    weekEndDate: row.week_end_date,
    manualContent: row.manual_content,
    generatedContent: row.generated_content,
    generatedBy: row.generated_by as "gemini" | "manual",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMonthlyReport(row: MonthlyReportRow): MonthlyReport {
  return {
    id: row.id,
    yearMonth: row.year_month,
    manualContent: row.manual_content,
    generatedContent: row.generated_content,
    generatedBy: row.generated_by as "gemini" | "manual",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRoadmap(row: RoadmapRow): Roadmap {
  return {
    id: row.id,
    content: row.content,
    generatedAt: row.generated_at,
  };
}
