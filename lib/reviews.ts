import "server-only";
import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { summarizeRatings, type Review } from "@/lib/reviewRules";
import { toObjectId } from "@/lib/visits";

// Reviews belong to the whole group: every approved member can read them. A person writes one
// review per restaurant, and can change or delete only their own. Reviews by someone who has since
// been removed are hidden and left out of the averages. If they're let back in, their reviews return.
// Strangers and people who are waiting never reach any of this: the pages and actions check first.

type ReviewDoc = {
  restaurantId: ObjectId;
  userId: string;
  rating: number;
  note: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ReviewView = { id: string; name: string; rating: number; note: string; updated: string; mine: boolean };
export type RatingSummary = { count: number; average: number | null };

const MAX_LISTED = 200;
const globalForIndexes = globalThis as unknown as { kidsTableReviewIndexes?: Promise<unknown> };

async function reviewsCollection(): Promise<Collection<ReviewDoc>> {
  const db = await getDb();
  const collection = db.collection<ReviewDoc>("reviews");
  // The database refuses a second review by the same person for the same place. Checking in code
  // isn't enough on its own: two taps at once could both pass the check.
  globalForIndexes.kidsTableReviewIndexes ??= collection.createIndex({ restaurantId: 1, userId: 1 }, { unique: true, name: "one_review_each" });
  await globalForIndexes.kidsTableReviewIndexes;
  return collection;
}

/** The people whose reviews count: approved members, by id, with their names. */
async function activeMembers(): Promise<Map<string, string>> {
  const db = await getDb();
  const docs = await db.collection("user").find({ status: "member" }).project<{ _id: ObjectId; name?: string }>({ name: 1 }).limit(500).toArray();
  return new Map(docs.map((d) => [String(d._id), String(d.name ?? "Someone")]));
}

/** Every visible review of one place, newest first, with the signed-in person's own marked. */
export async function listReviewsForPlace(restaurantId: string, currentUserId: string): Promise<ReviewView[]> {
  const place = toObjectId(restaurantId);
  if (!place) return [];
  const [collection, members] = await Promise.all([reviewsCollection(), activeMembers()]);
  const docs = await collection.find({ restaurantId: place, userId: { $in: [...members.keys()] } }).sort({ updatedAt: -1 }).limit(MAX_LISTED).toArray();
  return docs.map((d) => ({
    id: d._id.toString(),
    name: members.get(d.userId) ?? "Someone",
    rating: d.rating,
    note: d.note,
    updated: d.updatedAt.toISOString().slice(0, 10),
    mine: d.userId === currentUserId,
  }));
}

/** The group's average and count for each of these places. A place with no reviews isn't in the result. */
export async function getRatingSummaries(restaurantIds: readonly string[]): Promise<Map<string, RatingSummary>> {
  const ids = restaurantIds.map(toObjectId).filter((id): id is ObjectId => id !== null);
  if (ids.length === 0) return new Map();
  const [collection, members] = await Promise.all([reviewsCollection(), activeMembers()]);
  const docs = await collection
    .find({ restaurantId: { $in: ids }, userId: { $in: [...members.keys()] } })
    .project<{ restaurantId: ObjectId; rating: number }>({ restaurantId: 1, rating: 1 })
    .toArray();
  const byPlace = new Map<string, number[]>();
  for (const d of docs) byPlace.set(String(d.restaurantId), [...(byPlace.get(String(d.restaurantId)) ?? []), d.rating]);
  return new Map([...byPlace].map(([id, ratings]) => [id, summarizeRatings(ratings)]));
}

/** This person's own review of a place, or null. */
export async function getMyReview(userId: string, restaurantId: string): Promise<Review | null> {
  const place = toObjectId(restaurantId);
  if (!place) return null;
  const doc = await (await reviewsCollection()).findOne({ restaurantId: place, userId });
  return doc ? { rating: doc.rating, note: doc.note } : null;
}

/** Saves this person's review, replacing their earlier one for the place. False if the place doesn't exist. */
export async function saveMyReview(userId: string, restaurantId: string, review: Review): Promise<boolean> {
  const place = toObjectId(restaurantId);
  if (!place) return false;
  const db = await getDb();
  if (!(await db.collection("restaurants").countDocuments({ _id: place }))) return false;
  const collection = await reviewsCollection();
  const now = new Date();
  const write = () =>
    collection.updateOne(
      { restaurantId: place, userId },
      { $set: { rating: review.rating, note: review.note, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
  try {
    await write();
  } catch (error) {
    // Two saves at the same moment can both try to insert. The unique index stops the second, so
    // try once more: this time it finds the first one and updates it.
    if ((error as { code?: number }).code !== 11000) throw error;
    await write();
  }
  return true;
}

/** Deletes this person's own review of a place. Someone else's review can't be reached this way. */
export async function deleteMyReview(userId: string, restaurantId: string): Promise<boolean> {
  const place = toObjectId(restaurantId);
  if (!place) return false;
  const result = await (await reviewsCollection()).deleteOne({ restaurantId: place, userId });
  return result.deletedCount === 1;
}
