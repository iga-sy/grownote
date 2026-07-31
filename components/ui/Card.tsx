import type { ReactNode } from "react";

export function Card({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`animate-fade-in flex flex-col rounded-lg border border-border bg-surface p-6 shadow-md shadow-navy/5 ${className}`}
    >
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight text-ink">
        {icon}
        {title}
      </h2>
      <div className="flex flex-1 flex-col gap-3">{children}</div>
    </section>
  );
}
