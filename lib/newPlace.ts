// Checks a new place a member typed in, before anything is saved. Plain functions with no imports,
// so they can be tested alone.
//
// Everything arrives from a browser, so nothing is trusted: the values might not even be text.
// Area, food, and features must come from the lists in the settings file. They are chosen, not
// typed, so the filters on every page keep working.

export type Choice = { key: string; label: string };

export type NewPlaceSettings = {
  areas: readonly Choice[];
  foodTypes: readonly Choice[];
  features: readonly Choice[];
};

export type NewPlace = { name: string; area: string; foodType: string; features: string[] };

export type NewPlaceResult = { ok: true; place: NewPlace } | { ok: false; message: string };

export const MAX_NAME_LENGTH = 80;

const text = (value: unknown): string => (typeof value === "string" ? value : "");

export function checkNewPlace(
  raw: { name: unknown; area: unknown; foodType: unknown; features: unknown },
  cfg: NewPlaceSettings,
): NewPlaceResult {
  // One space between words, none at the ends.
  const name = text(raw.name).replace(/\s+/g, " ").trim();
  if (!name) return { ok: false, message: "Please enter the name." };
  // A name made only of symbols would have nothing to search for.
  if (!/[a-z0-9]/i.test(name)) return { ok: false, message: "The name needs some letters or numbers in it." };
  if (name.length > MAX_NAME_LENGTH) return { ok: false, message: `That name is too long. The limit is ${MAX_NAME_LENGTH} characters.` };

  const area = text(raw.area);
  if (!cfg.areas.some((a) => a.key === area)) return { ok: false, message: "Please choose an area from the list." };

  const foodType = text(raw.foodType);
  if (!cfg.foodTypes.some((f) => f.key === foodType)) return { ok: false, message: "Please choose a kind of food from the list." };

  const picked = Array.isArray(raw.features) ? raw.features : [];
  const features: string[] = [];
  for (const value of picked) {
    const key = text(value);
    if (!cfg.features.some((f) => f.key === key)) return { ok: false, message: "One of those features isn't on the list." };
    if (!features.includes(key)) features.push(key);
  }

  return { ok: true, place: { name, area, foodType, features } };
}
