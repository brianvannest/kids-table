// A teal circle with a person's first initial. No photos of people, ever. It's decoration: the
// person's name always sits beside it, so a screen reader skips it.
export function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal text-[13px] font-extrabold text-white"
    >
      {initial}
    </span>
  );
}
