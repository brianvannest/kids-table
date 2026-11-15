// The rules for reviews and for how fresh a listing is. Plain functions with no imports, so they
// can be tested alone.
//
// Everything arrives from a browser, so nothing is trusted. A rating is a whole number from 1 to 5,
// and nothing else: not "4/5", not "great!", not 4.5, not stars.

export const MAX_REVIEW_NOTE = 500;

export type Review = { rating: number; note: string };
export type ReviewResult = { ok: true; review: Review } | { ok: false; message: string };

const text = (value: unknown): string => (typeof value === "string" ? value : "");

export function checkReview(raw: { rating: unknown; note: unknown }): ReviewResult {
  const rating = text(raw.rating);
  // Exactly one digit from 1 to 5. A stricter test than Number(): "4.0", " 4", "04", and "4e0" all fail.
  if (!/^[1-5]$/.test(rating)) return { ok: false, message: "Please choose a rating from 1 to 5." };

  const note = text(raw.note).replace(/\r\n/g, "\n").trim();
  if (note.length > MAX_REVIEW_NOTE) return { ok: false, message: `The note is too long. The limit is ${MAX_REVIEW_NOTE} characters.` };

  return { ok: true, review: { rating: Number(rating), note } };
}

/** The group's average rating to one decimal place, and how many reviews it's based on. */
export function summarizeRatings(ratings: readonly number[]): { count: number; average: number | null } {
  const valid = ratings.filter((r) => Number.isInteger(r) && r >= 1 && r <= 5);
  if (valid.length === 0) return { count: 0, average: null };
  const sum = valid.reduce((a, b) => a + b, 0);
  return { count: valid.length, average: Math.round((sum / valid.length) * 10) / 10 };
}

/** The date n months before a date, as YYYY-MM-DD. The day is kept, or the month's last day if it's shorter. */
export function monthsBefore(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const total = y * 12 + (m - 1) - n;
  const year = Math.floor(total / 12);
  const month = total % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(d, lastDay))).toISOString().slice(0, 10);
}

/** Has it been more than six months since the owner last checked this place? A place never checked is due too. */
export function isDueForLook(lastChecked: string | null, today: string): boolean {
  if (!lastChecked) return true;
  return lastChecked < monthsBefore(today, 6);
}
