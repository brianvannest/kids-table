import "server-only";
import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { Visit } from "@/lib/visitRules";

// Visits are private: only the person who logged one can see it, change it, or delete it, and that
// includes the owner. So every function here takes the signed-in person's id, and every query
// starts from it. There is no function that reads someone else's visits.

type VisitDoc = {
  userId: string;
  restaurantId: ObjectId;
  /** YYYY-MM-DD. A visit is a day, not a moment, so it's stored as the day. */
  date: string;
  notes: string;
  createdAt: Date;
};

export type VisitView = { id: string; restaurantId: string; date: string; notes: string };
export type VisitWithPlace = VisitView & { placeName: string };

const MAX_LISTED = 200;
const globalForIndexes = globalThis as unknown as { kidsTableVisitIndexes?: Promise<unknown> };

async function visitsCollection(): Promise<Collection<VisitDoc>> {
  const db = await getDb();
  const collection = db.collection<VisitDoc>("visits");
  globalForIndexes.kidsTableVisitIndexes ??= collection.createIndex({ userId: 1, restaurantId: 1, date: -1 }, { name: "my_visits" });
  await globalForIndexes.kidsTableVisitIndexes;
  return collection;
}

const toView = (d: VisitDoc & { _id: ObjectId }): VisitView => ({
  id: d._id.toString(),
  restaurantId: d.restaurantId.toString(),
  date: d.date,
  notes: d.notes,
});

/** A real id's shape, or null. `ObjectId.isValid` alone accepts any 12-character text. */
export function toObjectId(id: unknown): ObjectId | null {
  if (typeof id !== "string" || !ObjectId.isValid(id)) return null;
  const oid = new ObjectId(id);
  return String(oid) === id ? oid : null;
}

/** This person's visits to one place, newest first. */
export async function listMyVisitsForPlace(userId: string, restaurantId: string): Promise<VisitView[]> {
  const place = toObjectId(restaurantId);
  if (!place) return [];
  const collection = await visitsCollection();
  const docs = await collection.find({ userId, restaurantId: place }).sort({ date: -1, createdAt: -1 }).limit(MAX_LISTED).toArray();
  return docs.map(toView);
}

/** All of this person's visits, newest first, with the names of the places. */
export async function listMyVisits(userId: string): Promise<VisitWithPlace[]> {
  const collection = await visitsCollection();
  const docs = await collection.find({ userId }).sort({ date: -1, createdAt: -1 }).limit(MAX_LISTED).toArray();
  const ids = [...new Set(docs.map((d) => d.restaurantId.toString()))].map((id) => new ObjectId(id));
  const places = ids.length
    ? await (await getDb()).collection("restaurants").find({ _id: { $in: ids } }).project<{ _id: ObjectId; name: string }>({ name: 1 }).toArray()
    : [];
  const names = new Map(places.map((p) => [String(p._id), p.name]));
  return docs.map((d) => ({ ...toView(d), placeName: names.get(d.restaurantId.toString()) ?? "A place that was removed" }));
}

/** Saves a visit for this person. Returns false if the place doesn't exist. */
export async function addMyVisit(userId: string, restaurantId: string, visit: Visit): Promise<boolean> {
  const place = toObjectId(restaurantId);
  if (!place) return false;
  const db = await getDb();
  if (!(await db.collection("restaurants").countDocuments({ _id: place }))) return false;
  const collection = await visitsCollection();
  await collection.insertOne({ userId, restaurantId: place, date: visit.date, notes: visit.notes, createdAt: new Date() });
  return true;
}

/** Deletes one of this person's visits. Someone else's visit id deletes nothing. */
export async function deleteMyVisit(userId: string, visitId: string): Promise<boolean> {
  const id = toObjectId(visitId);
  if (!id) return false;
  const collection = await visitsCollection();
  const result = await collection.deleteOne({ _id: id, userId });
  return result.deletedCount === 1;
}
