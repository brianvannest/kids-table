import { CheckIcon } from "./icons";

// A filter you can switch on, drawn as a pill. Underneath it's a real checkbox, hidden from sight
// but not from the keyboard or a screen reader. When it's on, the pill turns teal and shows a
// check, so the state never depends on color alone.
export function Chip({ name, value, label, defaultChecked }: { name: string; value: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="inline-flex cursor-pointer">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="tt-transition inline-flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] border-edge bg-card px-4 text-sm font-bold text-teal peer-checked:border-teal peer-checked:bg-teal peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal [&>svg]:hidden peer-checked:[&>svg]:block">
        <CheckIcon />
        {label}
      </span>
    </label>
  );
}
