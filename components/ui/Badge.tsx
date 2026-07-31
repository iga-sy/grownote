import type { ReactNode } from "react";

type Tone = "ink" | "amber" | "red" | "emerald" | "accent";

const TONE_CLASSES: Record<Tone, string> = {
  ink: "bg-black/5 text-ink-soft",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  emerald: "bg-emerald-100 text-emerald-700",
  accent: "bg-accent-soft text-ink",
};

export function Badge({
  tone = "ink",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
