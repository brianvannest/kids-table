// What a stranger's web address is allowed to ask the database for. Plain functions with no
// imports, so they can be tested alone.
//
// The address (/?q=pickle&area=heights&feature=patio) is typed by anyone, so nothing in it is
// trusted. Each value is checked against the lists in the settings file, and anything that isn't
// on a list is thrown away. Only these four names mean anything. Every other name in the address
// is ignored, and there is no way to ask for private places: `public: true` is always in the
// filter, and no address value can change it.

export type Choice = { key: string; label: string };

export type FilterSettings = {
  areas: readonly Choice[];
  foodTypes: readonly Choice[];
  features: readonly Choice[];
};

export type PublicFilters = {
  /** What was typed in the search box, trimmed. */
  q: string;
  area: string | null;
  foodType: string | null;
  features: string[];
};

export type RawParams = Record<string, string | string[] | undefined>;

const MAX_QUERY_LENGTH = 60;
const MAX_TERMS = 6;

// A copy of the simplifier in importRows.ts. It's repeated here so this file needs no imports
// and can be tested on its own. Both must match, because the stored name key uses it.
export function simplify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function many(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function pick(value: string | undefined, list: readonly Choice[]): string | null {
  return value !== undefined && list.some((c) => c.key === value) ? value : null;
}

/** Turns the address's parameters into filters, keeping only values the settings file knows. */
export function parseFilters(raw: RawParams, cfg: FilterSettings): PublicFilters {
  const q = (first(raw.q) ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH).trim();
  const features: string[] = [];
  for (const value of many(raw.feature)) {
    const key = pick(value, cfg.features);
    if (key && !features.includes(key)) features.push(key);
  }
  return {
    q,
    area: pick(first(raw.area), cfg.areas),
    foodType: pick(first(raw.food), cfg.foodTypes),
    features,
  };
}

/** The MongoDB filter. `public: true` is always there. */
export function buildPublicFilter(filters: PublicFilters): Record<string, unknown> {
  const filter: Record<string, unknown> = { public: true };
  const terms = simplify(filters.q).split(" ").filter(Boolean).slice(0, MAX_TERMS);
  // Every word typed must appear in the name. "pony burg" finds Pickle Pony Burgers.
  if (terms.length > 0) filter.$and = terms.map((t) => ({ nameKey: { $regex: escapeRegex(t) } }));
  if (filters.area) filter.area = filters.area;
  if (filters.foodType) filter.foodType = filters.foodType;
  if (filters.features.length > 0) filter.features = { $all: filters.features };
  return filter;
}

/**
 * For signed-in members: the same search, but private places count too. It starts from the public
 * filter and takes the one condition away, so a search means exactly the same thing in both places.
 * Only call this for someone who has been checked as an approved member.
 */
export function buildMemberFilter(filters: PublicFilters): Record<string, unknown> {
  const filter = buildPublicFilter(filters);
  delete filter.public;
  return filter;
}

export function hasFilters(filters: PublicFilters): boolean {
  return Boolean(filters.q || filters.area || filters.foodType || filters.features.length);
}

/**
 * The only fields a stranger is ever shown. The database id is left out on purpose: it carries
 * the moment the place was added. `public`, `lastChecked`, `createdBy`, and photos are never
 * sent either. A test checks that this list and the projection below stay in step.
 */
export const PUBLIC_FIELDS = ["name", "nameKey", "area", "foodType", "features"] as const;

/** The MongoDB projection that returns exactly the public fields and nothing else. */
export function publicProjection(): Record<string, 0 | 1> {
  const projection: Record<string, 0 | 1> = { _id: 0 };
  for (const field of PUBLIC_FIELDS) projection[field] = 1;
  return projection;
}
