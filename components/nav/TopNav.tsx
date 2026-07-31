"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  CalendarRange,
  Compass,
  Sprout,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/calendar", label: "カレンダー", icon: CalendarDays },
  { href: "/reports/daily", label: "日報", icon: FileText },
  { href: "/reports/weekly", label: "週報・月報", icon: CalendarRange },
  { href: "/roadmap", label: "ロードマップ", icon: Compass },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-1 overflow-x-auto px-4">
        <Link
          href="/"
          className="mr-2 flex shrink-0 items-center gap-1.5 py-3 pr-3 text-sm font-bold text-ink"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-2 text-white">
            <Sprout className="h-3.5 w-3.5" />
          </span>
          GrowNote
        </Link>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                active
                  ? "border-accent text-ink"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
