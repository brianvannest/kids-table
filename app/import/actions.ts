"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { settings } from "@/lib/settings";
import { checkRows, countByStatus, type RowReport, type RowStatus } from "@/lib/importRows";
import { findExisting, insertDrafts, restaurantKey } from "@/lib/restaurants";
import { ownerForAction } from "@/lib/session";

const MAX_CHARS = 200_000;
const MAX_ROWS = 500;

export type Preview =
  | { ok: false; message: string }
  | { ok: true; reports: RowReport[]; counts: Record<RowStatus, number> };

export type ImportResult = { ok: false; message: string } | { ok: true; inserted: number };

// A server action can be called by anyone who sends the right request, not just by the page that
// shows the button. So the check happens here, inside the action: only the owner may import.
async function notAllowed(): Promise<string | null> {
  if (!(await ownerForAction())) return "Only the owner can import. Sign in as the owner and try again.";
  return null;
}

async function checkText(csvText: unknown): Promise<{ ok: true; reports: RowReport[] } | { ok: false; message: string }> {
  const blocked = await notAllowed();
  if (blocked) return { ok: false, message: blocked };

  // Never trust what the browser sent. Check its type and its size before doing anything with it.
  if (typeof csvText !== "string" || !csvText.trim()) return { ok: false, message: "That file is empty." };
  if (csvText.length > MAX_CHARS) return { ok: false, message: "That file is too big. The limit is about 200 KB." };

  const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: "greedy", delimiter: "," });
  const headers = (parsed.meta.fields ?? []).map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  if (!headers.includes("name")) {
    return { ok: false, message: 'I couldn\'t find a "name" column. The first row should name each column.' };
  }
  if (parsed.data.length === 0) return { ok: false, message: "That file has a header but no rows." };
  if (parsed.data.length > MAX_ROWS) return { ok: false, message: `That file has more than ${MAX_ROWS} rows. Split it up.` };

  const today = new Date().toISOString().slice(0, 10);
  const reports = checkRows(parsed.data, settings, today);

  // Places already in the database are skipped, not added twice.
  const drafts = reports.flatMap((r) => (r.draft ? [r.draft] : []));
  const existing = await findExisting(drafts);
  for (const r of reports) {
    if (r.draft && existing.has(restaurantKey(r.draft))) {
      r.status = "skipped";
      r.notes = ["This place is already in your list."];
      r.draft = null;
    }
  }
  return { ok: true, reports };
}

/** Checks the file and says what would happen. Saves nothing. */
export async function previewImport(csvText: string): Promise<Preview> {
  const checked = await checkText(csvText);
  if (!checked.ok) return checked;
  return { ok: true, reports: checked.reports, counts: countByStatus(checked.reports) };
}

/** Checks the file again, on the server, and saves the rows that are allowed in. */
export async function runImport(csvText: string, includeWarnings: boolean): Promise<ImportResult> {
  const checked = await checkText(csvText);
  if (!checked.ok) return checked;
  const chosen = checked.reports.flatMap((r) =>
    r.draft && (r.status === "ready" || (includeWarnings === true && r.status === "warning")) ? [r.draft] : [],
  );
  const { inserted } = await insertDrafts(chosen);
  revalidatePath("/import");
  return { ok: true, inserted };
}
