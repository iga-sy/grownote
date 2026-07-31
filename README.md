# GrowNote

新入社員向け統合ワークスペース。スケジュール・タスク・目標・クイックリンク・作業メモ・AI日報/週報/月報生成・ロードマップ・カレンダーを統合したNext.jsアプリです。

## 解決したい課題

- タスク・締切・予定が多く全体像を把握しづらい
- 参照資料や使うサイトが散らばっている
- 業務中の気付き・学び・困りごとを記録できず、振り返りや日報作成に時間がかかる
- 自分の成長や目標に向けたロードマップが見えにくい

## 画面構成

トップナビ(全ページ共通)で以下を切り替えます。

- **ダッシュボード(`/`)**: クイックリンク・1日のスケジュール(タイムテーブル)・タスク・リアルタイム作業メモ
- **カレンダー(`/calendar`)**: タスクの締切(日付+時刻)を月間カレンダーで表示
- **日報(`/reports/daily`)**: 日付ごとの完了タスク・メモからAIが日報を自動生成。過去の日報を日付ごとに一覧
- **週報(`/reports/weekly`)**: 選択した週(月〜日)の日報を積み上げてAIが週報を自動生成
- **月報(`/reports/monthly`)**: 選択した月の週報を積み上げてAIが月報を自動生成
- **ロードマップ(`/roadmap`)**: 長期・今月・今週の目標の登録・進捗管理(進捗リング付き)と、それらと未完了タスクから「今何をすべきか」をAIが逆算して提案。目標管理はこのページに集約されています

### ダッシュボードの機能詳細

- 📌 クイックリンク: ブックマーク(URL・タイトル)の登録・一覧表示
- 🕐 1日のスケジュール: タイムテーブル形式で時間帯のある予定を表示。Outlookからエクスポートした`.ics`ファイルを取り込み可能
- ✅ タスク: 締切(日付+時刻)のあるTODOリスト、完了/未完了切り替え
- 📝 リアルタイム作業メモ: スケジュール上で選択した予定に紐付く気付き・学び・困りごとメモの投稿・表示

## 技術スタック

- Next.js (App Router, TypeScript)
- Tailwind CSS v4(カスタムカラーテーマ), lucide-react
- SQLite (`node:sqlite` — Node.js標準搭載のDatabaseSync)
- Gemini API (`@google/genai`)
- `node-ical` — Outlookエクスポートの`.ics`(iCalendar)パース

## セットアップ

```bash
npm install
cp .env.example .env.local
# .env.local の GEMINI_API_KEY に実際のAPIキーを設定
npm run dev
```

`http://localhost:3000` を開くとダッシュボードが表示されます。初回アクセス時に `db/shinnyu.db` が自動生成され、9テーブル(tasks, schedules, notes, bookmarks, goals, reports, weekly_reports, monthly_reports, roadmaps)が作成されます。

## 環境変数 (`.env.local`)

| 変数名 | 説明 | デフォルト |
|---|---|---|
| `GEMINI_API_KEY` | Gemini APIキー(必須。未設定の場合、AI生成系の機能は分かりやすいエラーメッセージを返します) | なし |
| `GEMINI_MODEL` | 使用するGeminiモデル名。新規プロジェクトでは古いモデル名(例: `gemini-2.5-flash`)が使えないことがあるため、基本は`gemini-flash-latest`のようなエイリアスを推奨 | `gemini-flash-latest` |

## カラーテーマ・デザインシステム

セージグリーン×クリームを基調にした「安心感・清潔感・成長を感じる」デザインです。`app/globals.css` の `:root` で以下を定義し、`color-mix()`でサーフェス色・アクセントの濃淡・境界線色を自動生成しています。

| 変数 | 役割 | 値 |
|---|---|---|
| `--color-base` | ページ背景(クリーム) | `#f4ebda` |
| `--color-accent` | メインアクセント(セージグリーン) | `#8ea38c` |
| `--color-accent-2` | AI要素のグラデーション先(暖かみのあるゴールド) | `#cf9f5f` |
| `--color-ink` | テキスト(ダークチャコール) | `#262724` |

テーマ色を変更したい場合はこれらの変数を書き換えるだけで全コンポーネントに反映されます。フォントは Inter(欧文)+ Noto Sans JP(和文)。カードは角丸8px・シャドウ・フェードインアニメーション付き、目標の進捗は `ProgressRing`(SVG円形プログレス)で表示し、AI生成ボタン・カードアイコンはセージ→ゴールドのグラデーションで強調しています。

## Outlook予定の取り込みについて

Microsoft Graph APIのようなOAuth連携ではなく、Outlook/Office365でエクスポートした`.ics`ファイルをアップロードする方式を採用しています(認証設定が不要ですぐ使えるため)。ダッシュボードの「1日のスケジュール」カードにある「Outlookから取り込み」ボタンから`.ics`ファイルを選択すると、含まれる予定がスケジュールとして一括登録されます。重複チェックは行わないため、同じファイルを二重に取り込むと予定が重複登録される点にご注意ください。

## DBについて

`better-sqlite3` ではなく、Node.js v22.5+ に標準搭載されている `node:sqlite`(`DatabaseSync`)を採用しています。ネイティブビルドが不要なため、Visual Studio Build Toolsのインストールなしで動作します。

`npm run dev` / `npm run build` の前に `predev` / `prebuild` フックで `scripts/init-db.mjs` が自動実行され、DBファイルの作成とWALモードへの切り替えを単一プロセスで済ませます(Next.jsのビルドは複数ワーカープロセスを並列起動するため、これを省くと初回ビルド時に`database is locked`エラーが発生することがあります)。

## 週報・月報のテンプレについて

社内の週報・月報テンプレ(①今月の目標/②達成度合い/③来月への改善案、週次の①やったこと②分からなかったこと③来週試すこと、技術力・課題解決力・実行力・コミュニケーション力・主体性成長力の5つの技量観点)を参考に、`lib/gemini.ts` のプロンプトでMarkdown見出し構成として再現しています。スプレッドシートの全項目(技量チェックボックスのグリッドなど)を完全に再現するのではなく、内容の骨子をAIが文章として生成する形です。実際のテンプレに近づけたい場合は `buildWeeklyReportPrompt` / `buildMonthlyReportPrompt` の見出し構成を調整してください。

## ディレクトリ構成

```
app/
  page.tsx                    # ダッシュボード(Server Component)
  calendar/page.tsx           # カレンダー(タスク締切の月間表示)
  reports/daily/page.tsx      # 日報
  reports/weekly/page.tsx     # 週報
  reports/monthly/page.tsx    # 月報
  roadmap/page.tsx            # ロードマップ
  api/                        # Route Handlers
components/
  ui/                         # Card, Button, Badge, EmptyState
  nav/TopNav.tsx               # 全ページ共通のトップナビ
  dashboard/                  # QuickLinks, GoalTracker, Schedule, Tasks, WorkMemo, DashboardClient, RoadmapView
  calendar/MonthCalendar.tsx
  reports/                    # DailyReportsView, WeeklyReportsView, MonthlyReportsView
lib/
  db.ts                       # node:sqlite 接続 + スキーマ初期化
  types.ts                    # 型定義 + row→camelCaseマッパー
  gemini.ts                   # Geminiクライアント + 日報/週報/月報/ロードマップのプロンプト生成
db/
  schema.sql                  # DDL(実データの shinnyu.db は実行時生成・gitignore対象)
```

## 動作確認

```bash
npm run build   # 型チェック + 本番ビルド
npm run dev     # 開発サーバー
```

- スケジュールで予定を選択 → 作業メモがその予定に紐付いて表示されます
- Outlookの.icsファイルを取り込むと、該当日のスケジュールに反映されます
- カレンダーでタスクの締切(日付+時刻)を月表示で確認できます
- 日報/週報/月報はそれぞれ専用ページで、日付・週・月ごとの履歴一覧と生成・編集・保存が行えます
- ロードマップ画面で「目標から逆算して提案する」→ 長期・今月・今週の目標と未完了タスクをもとに、今すべきことをAIが提案します
