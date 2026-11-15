import "server-only";
import type { Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { RestaurantDraft } from "@/lib/importRows";

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
  /** Who added it. Null for imports, until sign-in exists (Chapter 12). */
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
