import { GoogleGenAI } from "@google/genai";

const modelName = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY が設定されていません。.env.local を確認してください。",
    );
  }
  return new GoogleGenAI({ apiKey });
}

async function callGemini(prompt: string): Promise<string> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });
  const text = response.text;
  if (!text) {
    throw new Error("Gemini APIからの応答が空でした。");
  }
  return text;
}

const CATEGORY_LABEL: Record<string, string> = {
  insight: "気付き",
  learning: "学び",
  problem: "困りごと",
  note: "メモ",
};

const SKILL_FRAMEWORK = `
- 技術力(Technical): 業務遂行に必要な知識・技術(開発知識/クラウド基礎/データベース/業務知識/ツール活用)
- 課題解決力(Thinking): 目的理解・分析・仮説構築を通じて課題を解決する力(情報収集/分析/課題把握/仮説構築/要件理解)
- 実行力(Execution): 期限と品質を担保しながらやり切る力(遂行/品質管理/期限管理/リスク管理/手戻り防止)
- コミュニケーション力(Communication): 周囲と協働しながら成果を出す力(報連相/調整/レビュー依頼/表現/関係構築)
- 主体性・成長力(Mindset): 自走し学習し改善し続ける姿勢(自走/学習/振り返り/改善/挑戦姿勢/未経験領域への取り組み)`;

interface TaskForReport {
  title: string;
  description?: string | null;
}

interface NoteForReport {
  category: string;
  content: string;
  contextTitle?: string | null;
}

export function buildDailyReportPrompt(
  date: string,
  tasks: TaskForReport[],
  notes: NoteForReport[],
): string {
  const taskLines = tasks.length
    ? tasks
        .map((t) => `- ${t.title}${t.description ? `: ${t.description}` : ""}`)
        .join("\n")
    : "(本日完了したタスクの記録なし)";

  const noteLines = notes.length
    ? notes
        .map((n) => {
          const label = CATEGORY_LABEL[n.category] ?? n.category;
          const contextRef = n.contextTitle ? `(${n.contextTitle})` : "";
          return `- [${label}]${contextRef} ${n.content}`;
        })
        .join("\n")
    : "(メモの記録なし)";

  return `あなたは新入社員の日報作成を支援するアシスタントです。
以下の「本日完了したタスク」と「作業メモ」をもとに、${date} の日報を日本語で作成してください。

# 本日完了したタスク
${taskLines}

# 作業メモ(気付き・学び・困りごと)
${noteLines}

# 出力形式(Markdown、この3見出しのみを使用)
## 業務内容
## 学び・気づき
## 課題と解決策

- 「困りごと」に該当するメモがあれば、それに対する具体的な解決策や次のアクションを提案してください。
- 記録が少ない場合は、無理に水増しせず簡潔にまとめてください。
- 丁寧な「です・ます」調で書いてください。`;
}

export async function generateDailyReport(prompt: string): Promise<string> {
  return callGemini(prompt);
}

interface DailyReportForWeekly {
  date: string;
  content: string;
}

export function buildWeeklyReportPrompt(
  weekStartDate: string,
  weekEndDate: string,
  dailyReports: DailyReportForWeekly[],
  weeklyGoalTitle: string | null,
): string {
  const dailyLines = dailyReports.length
    ? dailyReports
        .map((d) => `### ${d.date}\n${d.content}`)
        .join("\n\n")
    : "(この期間の日報の記録なし)";

  return `あなたは新入社員の週報作成を支援するアシスタントです。
以下は ${weekStartDate} 〜 ${weekEndDate} の期間に書かれた日報です。これらを積み上げて集約し、週報を日本語で作成してください。

# 今週の目標
${weeklyGoalTitle ?? "(今週の目標は設定されていません)"}

# この期間の日報
${dailyLines}

# 出力形式(Markdown、この見出し構成のみを使用)
## 今週の計画・意識したこと
## ①やったこと
## ②分からなかった・確認したこと
## ③来週試すこと

- 日々の日報を単に並べるのではなく、共通するテーマや重要な出来事を要約してください。
- 「②分からなかった・確認したこと」は、日報内の困りごとや疑問点を中心にまとめてください。
- 「③来週試すこと」は①②を踏まえた具体的な次のアクションにしてください。
- 記録が少ない場合は、無理に水増しせず簡潔にまとめてください。
- 丁寧な「です・ます」調で書いてください。`;
}

export async function generateWeeklyReport(prompt: string): Promise<string> {
  return callGemini(prompt);
}

interface WeeklyReportForMonthly {
  weekStartDate: string;
  weekEndDate: string;
  content: string;
}

export function buildMonthlyReportPrompt(
  yearMonth: string,
  weeklyReports: WeeklyReportForMonthly[],
  monthlyGoalTitle: string | null,
): string {
  const weeklyLines = weeklyReports.length
    ? weeklyReports
        .map((w) => `### ${w.weekStartDate} 〜 ${w.weekEndDate}\n${w.content}`)
        .join("\n\n")
    : "(この月の週報の記録なし)";

  return `あなたは新入社員の月報作成を支援するアシスタントです。
以下は ${yearMonth} の期間に作成された週報です。これらを積み上げて集約し、月報を日本語で作成してください。

# 今月の目標
${monthlyGoalTitle ?? "(今月の目標は設定されていません)"}

# この月の週報
${weeklyLines}

# 評価にあたって参考にする技量の観点
${SKILL_FRAMEWORK}

# 出力形式(Markdown、この見出し構成のみを使用)
## 1. 当月の業務を通して習得を目指したこと
## 2. 週次の振り返りまとめ
## 3. 1ヶ月を通して習得できたこと・気づき・改善したいこと
## 4. 今月の目標達成度合い(結果・事実)
## 5. 技量の観点での振り返り(上記5つの観点のうち特に発揮できたもの・課題が残ったものを具体的に)
## 6. 来月に向けての改善案

- 週報を単に並べるのではなく、月を通した傾向・成長・共通の課題を要約してください。
- 「5. 技量の観点での振り返り」では、5つの観点のうち根拠となるエピソードがあるものだけを取り上げてください。
- 記録が少ない場合は、無理に水増しせず簡潔にまとめてください。
- 丁寧な「です・ます」調で書いてください。`;
}

export async function generateMonthlyReport(prompt: string): Promise<string> {
  return callGemini(prompt);
}

interface GoalForRoadmap {
  title: string;
  progress: number;
  targetDate?: string | null;
}

interface TaskForRoadmap {
  title: string;
  dueDate?: string | null;
}

export function buildRoadmapPrompt(
  today: string,
  longtermGoals: GoalForRoadmap[],
  monthlyGoals: GoalForRoadmap[],
  weeklyGoals: GoalForRoadmap[],
  upcomingTasks: TaskForRoadmap[],
): string {
  const formatGoals = (goals: GoalForRoadmap[], emptyLabel: string) =>
    goals.length
      ? goals
          .map(
            (g) =>
              `- ${g.title}(進捗${g.progress}%${g.targetDate ? `、目標日:${g.targetDate}` : ""})`,
          )
          .join("\n")
      : emptyLabel;

  const taskLines = upcomingTasks.length
    ? upcomingTasks
        .map((t) => `- ${t.title}${t.dueDate ? `(締切:${t.dueDate})` : ""}`)
        .join("\n")
    : "(登録されている未完了タスクなし)";

  return `あなたは新入社員のキャリア形成を支援するコーチです。
今日の日付は ${today} です。以下の長期目標・月次目標・週次目標・未完了タスクの情報をもとに、目標から逆算して「今、何をすべきか」を具体的に提案してください。

# 長期的な目標(1年目・2年目終了時などに目指す姿)
${formatGoals(longtermGoals, "(長期目標は設定されていません)")}

# 今月の目標
${formatGoals(monthlyGoals, "(今月の目標は設定されていません)")}

# 今週の目標
${formatGoals(weeklyGoals, "(今週の目標は設定されていません)")}

# 現在の未完了タスク
${taskLines}

# 評価にあたって参考にする技量の観点
${SKILL_FRAMEWORK}

# 出力形式(Markdown、この見出し構成のみを使用)
## 長期目標から見た現在地
## 今月やるべきこと(月次目標からの逆算)
## 今週やるべきこと(週次目標からの逆算)
## 今日・明日の具体的なアクション提案

- 長期目標 → 今月 → 今週 → 今日、の順に一貫性を持たせ、上位の目標を達成するために下位で何をすべきかが繋がるようにしてください。
- 「今日・明日の具体的なアクション提案」は3つ程度、すぐに着手できる粒度で具体的に書いてください。
- 目標が何も設定されていない場合は、その旨を伝え、まず何を設定すべきかを提案してください。
- 丁寧な「です・ます」調で書いてください。`;
}

export async function generateRoadmap(prompt: string): Promise<string> {
  return callGemini(prompt);
}
