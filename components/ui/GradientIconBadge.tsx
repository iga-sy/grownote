import type { ReactNode } from "react";

export function GradientIconBadge({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-2 text-white shadow-sm shadow-accent/40">
      {children}
    </span>
  );
}
