import type { ReactNode } from "react";

// White, with a faint border and a faint shadow. A card isn't a link and isn't a control, so it
// gets no hover and no pointer.
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-line bg-card p-4 shadow-card ${className}`}>{children}</div>;
}
