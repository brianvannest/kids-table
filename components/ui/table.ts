// One set of classes for every table in the app, so they all look alike. A table is just a plain
// <table>; there's no table component to learn.
//
// A table that can scroll sideways must be reachable from the keyboard, or a keyboard user can't
// scroll it. Give its wrapper tabIndex={0}, role="region", and an aria-label that names it.
export const table = {
  wrap: "overflow-x-auto rounded-card border border-line bg-card",
  table: "w-full min-w-[640px] border-collapse text-left text-sm",
  th: "bg-sand px-3 py-2 font-bold text-ink",
  td: "border-t border-line px-3 py-2 align-top",
} as const;
