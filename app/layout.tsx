import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { TopNav } from "@/components/nav/TopNav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GrowNote",
  description: "タスク・目標・メモ・AI日報生成を1画面にまとめたダッシュボード",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} ${notoSansJp.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col text-ink">
        <TopNav />
        {children}
      </body>
    </html>
  );
}
