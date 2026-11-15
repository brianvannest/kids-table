import type { ReactNode } from "react";
import { AlertIcon, CheckIcon, ErrorIcon, InfoIcon } from "./icons";

// A message to the person using the app. Always an icon and words, never color alone, and the
// text is always ink so it stays readable on every fill.
const kinds = {
  info: { fill: "bg-teal-soft", icon: <InfoIcon className="text-teal" />, role: "status" },
  success: { fill: "bg-teal-soft", icon: <CheckIcon size={20} className="text-teal" />, role: "status" },
  warning: { fill: "bg-sun-soft", icon: <AlertIcon className="text-ink" />, role: "status" },
  error: { fill: "bg-tomato-soft", icon: <ErrorIcon className="text-tomato" />, role: "alert" },
} as const;

export function Notice({ kind = "info", children }: { kind?: keyof typeof kinds; children: ReactNode }) {
  const k = kinds[kind];
  return (
    <div role={k.role} className={`flex items-start gap-3 rounded-control p-4 text-ink ${k.fill}`}>
      <span className="mt-0.5 shrink-0">{k.icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
