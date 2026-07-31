function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** ローカルタイムゾーンでの 'YYYY-MM-DD' を返す(toISOString()はUTC変換で日付がずれるため使わない) */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function mondayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toIsoDate(d);
}

/** 15分刻みの時刻候補('00:00'〜'23:45')。datalistのサジェスト用。 */
export const TIME_OPTIONS_15MIN: string[] = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4)
    .toString()
    .padStart(2, "0");
  const m = ((i % 4) * 15).toString().padStart(2, "0");
  return `${h}:${m}`;
});

/** 業務時間帯(8:00〜22:00)の15分刻み候補。タスク・スケジュールの時刻datalist用。 */
export const WORK_HOUR_TIME_OPTIONS: string[] = TIME_OPTIONS_15MIN.filter((t) => {
  const [h, m] = t.split(":").map(Number);
  const minutes = h * 60 + m;
  return minutes >= 8 * 60 && minutes <= 22 * 60;
});
