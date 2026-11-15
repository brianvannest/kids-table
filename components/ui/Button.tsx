import type { ButtonHTMLAttributes } from "react";

// Two kinds of button. The primary one is tomato, and there is only one per view: it's the
// screen's main action. Everything else, including every button in a row of a list, is secondary.
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" };

const base =
  "tt-transition inline-flex min-h-11 items-center justify-center rounded-control px-5 font-extrabold disabled:cursor-not-allowed disabled:border-transparent disabled:bg-sand disabled:text-muted disabled:shadow-none";

const variants = {
  primary: "bg-tomato text-white shadow-primary hover:bg-tomato-dark",
  secondary: "border-[1.5px] border-teal bg-card text-teal hover:bg-teal-soft hover:text-teal-dark",
} as const;

export function Button({ variant = "primary", className = "", type = "button", ...rest }: Props) {
  return <button type={type} className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}
