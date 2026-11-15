import "server-only";
import { ObjectId, type Collection, type Filter } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { RestaurantDraft } from "@/lib/importRows";
import { publicProjection } from "@/lib/publicFilters";

// Everything the app does with the restaurants collection lives here, so the rules (one document
// per place, how a place is stored) are in one spot. Server-only, like the connection itself.

export type RestaurantDoc = {
  name: string;
  /** The name with case and punctuation removed. With the area, it makes a place unique. */
  nameKey: string;
  area: string | null;
  foodType: string | null;
  features: string[];
  public: boolean;
  lastChecked: Date | null;
  /** Filled in by Chapter 13. */
  photos: string[];
  createdAt: Date;
  /** Who added it. Null for imports so far. */
  createdBy: string | null;
};

/** A restaurant as the pages see it: plain values only, nothing that can't be sent to the browser. */
export type RestaurantView = {
  id: string;
  name: string;
  area: string | null;
  foodType: string | null;
  features: string[];
  public: boolean;
  lastChecked: string | null;
};

const globalForIndexes = globalThis as unknown as { kidsTableIndexes?: Promise<unknown> };

export async function restaurantsCollection(): Promise<Collection<RestaurantDoc>> {
  const db = await getDb();
  const collection = db.collection<RestaurantDoc>("restaurants");
  // The database itself refuses a second copy of the same place. Checking in code isn't enough:
  // two people importing at the same moment could both pass the check.
  globalForIndexes.kidsTableIndexes ??= collection.createIndex(
    { nameKey: 1, area: 1 },
    { unique: true, name: "one_per_name_and_area" },
  );
  await globalForIndexes.kidsTableIndexes;
  return collection;
}

export async function listRestaurants(): Promise<RestaurantView[]> {
  const collection = await restaurantsCollection();
  const docs = await collection.find({}).sort({ nameKey: 1 }).toArray();
  return docs.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    area: d.area,
    foodType: d.foodType,
    features: d.features,
    public: d.public,
    lastChecked: d.lastChecked ? d.lastChecked.toISOString().slice(0, 10) : null,
  }));
}

const MAX_MEMBER_RESULTS = 100;

const toView = (d: RestaurantDoc & { _id: ObjectId }): RestaurantView => ({
  id: d._id.toString(),
  name: d.name,
  area: d.area,
  foodType: d.foodType,
  features: d.features,
  public: d.public,
  lastChecked: d.lastChecked ? d.lastChecked.toISOString().slice(0, 10) : null,
});

/**
 * Places for signed-in members, private ones included. Only call this for someone who has been
 * checked as an approved member. The filter comes from `buildMemberFilter`.
 */
export async function listMemberRestaurants(filter: Record<string, unknown>): Promise<RestaurantView[]> {
  const collection = await restaurantsCollection();
  const docs = await collection.find(filter as Filter<RestaurantDoc>).sort({ nameKey: 1 }).limit(MAX_MEMBER_RESULTS).toArray();
  return docs.map(toView);
}

/** One place by its id, or null. An id that isn't a real id finds nothing instead of failing. */
export async function getRestaurant(id: string): Promise<RestaurantView | null> {
  if (!ObjectId.isValid(id) || String(new ObjectId(id)) !== id) return null;
  const collection = await restaurantsCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  return doc ? toView(doc) : null;
}

export type NewRestaurant = { name: string; nameKey: string; area: string; foodType: string; features: string[]; createdBy: string };

/**
 * Saves one place added by a member. It starts out members-only: deciding what's public is the
 * owner's job. If the same name in the same area exists, the database refuses it and this says so.
 */
export async function insertRestaurant(
  place: NewRestaurant,
): Promise<{ kind: "added"; id: string } | { kind: "exists"; id: string | null }> {
  const collection = await restaurantsCollection();
  try {
    const result = await collection.insertOne({
      name: place.name,
      nameKey: place.nameKey,
      area: place.area,
      foodType: place.foodType,
      features: place.features,
      public: false,
      lastChecked: null,
      photos: [],
      createdAt: new Date(),
      createdBy: place.createdBy,
    });
    return { kind: "added", id: result.insertedId.toString() };
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    const existing = await collection.findOne({ nameKey: place.nameKey, area: place.area }, { projection: { _id: 1 } });
    return { kind: "exists", id: existing ? existing._id.toString() : null };
  }
}

const keyOf = (d: Pick<RestaurantDraft, "nameKey" | "area">) => `${d.nameKey}|${d.area ?? ""}`;

/** Which of these places are already in the database? Returns their keys. */
export async function findExisting(drafts: readonly RestaurantDraft[]): Promise<Set<string>> {
  if (drafts.length === 0) return new Set();
  const collection = await restaurantsCollection();
  const found = await collection
    .find({ $or: drafts.map((d) => ({ nameKey: d.nameKey, area: d.area })) })
    .project<{ nameKey: string; area: string | null }>({ nameKey: 1, area: 1 })
    .toArray();
  return new Set(found.map(keyOf));
}

export { keyOf as restaurantKey };

/** Saves places. A place that turns out to exist already is skipped, not an error. */
export async function insertDrafts(drafts: readonly RestaurantDraft[]): Promise<{ inserted: number }> {
  if (drafts.length === 0) return { inserted: 0 };
  const collection = await restaurantsCollection();
  const now = new Date();
  const docs: RestaurantDoc[] = drafts.map((d) => ({
    name: d.name,
    nameKey: d.nameKey,
    area: d.area,
    foodType: d.foodType,
    features: d.features,
    public: d.public,
    lastChecked: d.lastChecked ? new Date(`${d.lastChecked}T00:00:00.000Z`) : null,
    photos: [],
    createdAt: now,
    createdBy: null,
  }));
  try {
    const result = await collection.insertMany(docs, { ordered: false });
    return { inserted: result.insertedCount };
  } catch (error) {
    // Error code 11000 means "that place already exists". The others in the batch still went in.
    const e = error as { code?: number; result?: { insertedCount?: number }; insertedCount?: number };
    if (e.code === 11000) return { inserted: e.result?.insertedCount ?? e.insertedCount ?? 0 };
    throw error;
  }
}

// ---- What a stranger sees --------------------------------------------------------------------

/** A restaurant as the public page sees it. There is no id, no `public`, no date, no photos. */
export type PublicRestaurantView = {
  /** A stable key for a list. It's the name key and the area, never a database id. */
  key: string;
  name: string;
  area: string | null;
  foodType: string | null;
  features: string[];
};

type PublicDoc = Pick<RestaurantDoc, "name" | "nameKey" | "area" | "foodType" | "features">;

const MAX_PUBLIC_RESULTS = 60;

/** Public restaurants matching a filter built by `buildPublicFilter`. */
export async function listPublicRestaurants(filter: Record<string, unknown>): Promise<PublicRestaurantView[]> {
  const collection = await restaurantsCollection();
  const docs = await collection
    .find(filter as Filter<RestaurantDoc>)
    .project<PublicDoc>(publicProjection())
    .sort({ nameKey: 1 })
    .limit(MAX_PUBLIC_RESULTS)
    .toArray();
  return docs.map((d) => ({
    key: `${d.nameKey}|${d.area ?? ""}`,
    name: d.name,
    area: d.area,
    foodType: d.foodType,
    features: d.features,
  }));
}

/**
 * What the public places have between them, so the filters only offer choices that lead somewhere.
 * It looks only at public places, so a private place can never show up as a choice.
 */
export async function getPublicOverview(): Promise<{ total: number; areas: string[]; foodTypes: string[]; features: string[] }> {
  const collection = await restaurantsCollection();
  const onlyPublic = { public: true };
  const [total, areas, foodTypes, features] = await Promise.all([
    collection.countDocuments(onlyPublic),
    collection.distinct("area", onlyPublic),
    collection.distinct("foodType", onlyPublic),
    collection.distinct("features", onlyPublic),
  ]);
  const text = (values: unknown[]) => values.filter((v): v is string => typeof v === "string");
  return { total, areas: text(areas), foodTypes: text(foodTypes), features: text(features) };
}
