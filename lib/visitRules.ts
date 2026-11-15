// The rules for logging a visit. Plain functions with no imports, so they can be tested alone.
//
// Everything arrives from a browser, so nothing is trusted: the date might not be a date, the
// notes might be a megabyte, and neither might be text at all.

export const MAX_NOTES = 500;
/** No visit is older than this. It catches typing 0026 for 2026. */
export const EARLIEST_DATE = "2000-01-01";

export type Visit = { date: string; notes: string };
export type VisitResult = { ok: true; visit: Visit } | { ok: false; message: string };

/** A date written YYYY-MM-DD that exists on the calendar. "2026-02-31" does not. */
export function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** The date n days after (or before) a date, as YYYY-MM-DD. */
export function addDays(value: string, n: number): string {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");

/**
 * Checks a visit. `today` is the server's date in UTC. A person in Houston can still be on
 * yesterday's date when it's already tomorrow in UTC, and the other way round, so one day of
 * slack is allowed. Anything further ahead is the future, and refused.
 */
export function checkVisit(raw: { date: unknown; notes: unknown }, today: string): VisitResult {
  const date = text(raw.date).trim();
  if (!date) return { ok: false, message: "Please choose the date of the visit." };
  if (!isRealDate(date)) return { ok: false, message: "That doesn't look like a real date." };
  if (date > addDays(today, 1)) return { ok: false, message: "A visit can't be in the future." };
  if (date < EARLIEST_DATE) return { ok: false, message: "That date is too long ago." };

  const notes = text(raw.notes).replace(/\r\n/g, "\n").trim();
  if (notes.length > MAX_NOTES) return { ok: false, message: `The notes are too long. The limit is ${MAX_NOTES} characters.` };

  return { ok: true, visit: { date, notes } };
}
