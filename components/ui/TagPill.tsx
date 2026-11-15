import type { ReactNode } from "react";

// A small pill that names something. Mint ("teal") pills are for a restaurant's features. The
// other tones show the state of a row. Text is always ink on the tinted ones, never muted.
const tones = {
  teal: "bg-teal-soft text-teal",
  sun: "bg-sun-soft text-ink",
  mint: "bg-teal-soft text-ink",
  plain: "border-[1.5px] border-edge bg-cream text-ink",
} as const;

export function TagPill({ tone = "teal", icon, children }: { tone?: keyof typeof tones; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-bold leading-4 ${tones[tone]}`}>
      {icon}
      {children}
    </span>
  );
}
