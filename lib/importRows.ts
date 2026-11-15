// Checks the rows of a spreadsheet before anything is saved. Plain functions with no imports,
// so they can be tested on their own, without a database or a browser.
//
// Each row ends up in one of three states:
//   ready    - everything made sense. It can be imported as is.
//   warning  - the row has a name, but some cells couldn't be understood. Those cells would be
//              left blank. The owner decides whether to import it that way or fix the spreadsheet.
//   skipped  - the row can't be imported (no name, or the same place appears twice).

export type Choice = { key: string; label: string };

export type ImportSettings = {
  areas: readonly Choice[];
  foodTypes: readonly Choice[];
  features: readonly Choice[];
};

export type RestaurantDraft = {
  name: string;
  /** The name with case, punctuation and extra spaces removed. Used to spot the same place twice. */
  nameKey: string;
  area: string | null;
  foodType: string | null;
  features: string[];
  public: boolean;
  /** YYYY-MM-DD, or null. */
  lastChecked: string | null;
};

export type RowStatus = "ready" | "warning" | "skipped";

export type RowReport = {
  /** The line number in the spreadsheet, counting the header as line 1. */
  line: number;
  name: string;
  status: RowStatus;
  notes: string[];
  draft: RestaurantDraft | null;
};

/** Lowercase, with anything that isn't a letter or number turned into a single space. */
export function simplify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function nameKeyOf(name: string): string {
  return simplify(name);
}

function matchChoice(value: string, list: readonly Choice[]): Choice | null {
  const v = simplify(value);
  if (!v) return null;
  return list.find((c) => simplify(c.key) === v || simplify(c.label) === v) ?? null;
}

// Header names are matched loosely: "Food Type", "food_type" and "foodType" are all the same column.
const COLUMNS = ["name", "area", "foodtype", "features", "public", "lastchecked"] as const;
type Column = (typeof COLUMNS)[number];

function normalizeRow(raw: Record<string, string | undefined>): Record<Column, string> {
  const out = Object.fromEntries(COLUMNS.map((c) => [c, ""])) as Record<Column, string>;
  for (const [header, value] of Object.entries(raw)) {
    const key = simplify(header).replace(/ /g, "") as Column;
    if ((COLUMNS as readonly string[]).includes(key)) out[key] = (value ?? "").trim();
  }
  return out;
}

/** Reads YYYY-MM-DD or M/D/YYYY. Returns the date as YYYY-MM-DD, or says why it can't. */
function readDate(value: string, today: string): { iso: string } | { problem: "unreadable" | "future" } {
  let y: number, m: number, d: number;
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (match) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if ((match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value))) {
    [m, d, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    return { problem: "unreadable" };
  }
  const real = new Date(Date.UTC(y, m - 1, d));
  if (real.getUTCFullYear() !== y || real.getUTCMonth() !== m - 1 || real.getUTCDate() !== d) {
    return { problem: "unreadable" };
  }
  const iso = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return iso > today ? { problem: "future" } : { iso };
}

function readYesNo(value: string): boolean | null {
  const v = value.trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(v)) return true;
  if (["no", "n", "false", "0", ""].includes(v)) return false;
  return null;
}

/**
 * Checks every row. `today` is YYYY-MM-DD (passed in so the result doesn't depend on the clock).
 * Rows that repeat a place already seen earlier in the same file are skipped.
 */
export function checkRows(
  rows: readonly Record<string, string | undefined>[],
  cfg: ImportSettings,
  today: string,
): RowReport[] {
  const seen = new Map<string, number>();
  return rows.map((raw, index) => {
    const line = index + 2;
    const row = normalizeRow(raw);
    const notes: string[] = [];

    const name = row.name.replace(/\s+/g, " ").trim();
    if (!name) {
      return { line, name: "", status: "skipped", notes: ["There's no name on this row."], draft: null };
    }

    let area: string | null = null;
    if (row.area) {
      const found = matchChoice(row.area, cfg.areas);
      if (found) area = found.key;
      else notes.push(`The area "${row.area}" isn't in the settings list. Left blank.`);
    }

    let foodType: string | null = null;
    if (row.foodtype) {
      const found = matchChoice(row.foodtype, cfg.foodTypes);
      if (found) foodType = found.key;
      else notes.push(`The food type "${row.foodtype}" isn't in the settings list. Left blank.`);
    }

    const features: string[] = [];
    for (const piece of row.features.split(/[;,|]/)) {
      const text = piece.trim();
      if (!text) continue;
      const found = matchChoice(text, cfg.features);
      if (!found) notes.push(`The feature "${text}" isn't in the settings list. Left out.`);
      else if (!features.includes(found.key)) features.push(found.key);
    }

    let isPublic = false;
    const yesNo = readYesNo(row.public);
    if (yesNo === null) notes.push(`"${row.public}" couldn't be read as yes or no. Set to no.`);
    else isPublic = yesNo;

    let lastChecked: string | null = null;
    if (row.lastchecked) {
      const date = readDate(row.lastchecked, today);
      if ("iso" in date) lastChecked = date.iso;
      else if (date.problem === "future") notes.push(`The date "${row.lastchecked}" is in the future. Left blank.`);
      else notes.push(`The date "${row.lastchecked}" couldn't be read. Left blank.`);
    }

    const nameKey = nameKeyOf(name);
    const sameAs = `${nameKey}|${area ?? ""}`;
    const earlier = seen.get(sameAs);
    if (earlier !== undefined) {
      return {
        line,
        name,
        status: "skipped",
        notes: [`This place is already on line ${earlier}. Only the first one is used.`],
        draft: null,
      };
    }
    seen.set(sameAs, line);

    const draft: RestaurantDraft = { name, nameKey, area, foodType, features, public: isPublic, lastChecked };
    return { line, name, status: notes.length ? "warning" : "ready", notes, draft };
  });
}

export function countByStatus(reports: readonly RowReport[]): Record<RowStatus, number> {
  const counts: Record<RowStatus, number> = { ready: 0, warning: 0, skipped: 0 };
  for (const r of reports) counts[r.status] += 1;
  return counts;
}
