import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

// Form controls. Every one has a visible label, a border with enough contrast to see (the "edge"
// color), and is at least 44px tall. Text inside is 16px, because smaller makes iPhone Safari zoom
// the page when you tap.
const control =
  "tt-transition block min-h-11 w-full rounded-control border-[1.5px] border-edge bg-card px-3 text-base text-ink placeholder:text-muted";

const labelClass = "mb-1 block text-sm font-bold";

export function TextField({
  label,
  hint,
  id,
  ...rest
}: { label: string; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = id ?? rest.name ?? label;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  return (
    <div>
      <label htmlFor={fieldId} className={labelClass}>
        {label}
      </label>
      <input id={fieldId} aria-describedby={hintId} className={control} {...rest} />
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Select({
  label,
  options,
  anyLabel,
  id,
  ...rest
}: {
  label: string;
  options: readonly { key: string; label: string }[];
  /** The first choice, meaning "no filter", such as "Any area". */
  anyLabel: string;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const fieldId = id ?? rest.name ?? label;
  return (
    <div>
      <label htmlFor={fieldId} className={labelClass}>
        {label}
      </label>
      <select id={fieldId} className={control} {...rest}>
        <option value="">{anyLabel}</option>
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
