import "server-only";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { readRole, readStatus, type Role, type Status } from "@/lib/memberRules";

// Reads the people who have accounts. Only the owner's page and the owner's action use this.
// The sign-in system keeps its people in a collection called "user".

export type MemberRow = { id: string; name: string; email: string; role: Role; status: Status; joined: string };

/**
 * A person's id as the database stores it. The sign-in system may keep it as an ObjectId or as
 * plain text, so this matches either form. Anything that isn't a real id matches nothing.
 */
export function userFilter(id: string): { _id: ObjectId } | { id: string } {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id ? { _id: new ObjectId(id) } : { id };
}

const order: Record<Status, number> = { waiting: 0, member: 1, removed: 2 };

/** Everyone, waiting people first so the owner sees who needs an answer. */
export async function listMembers(): Promise<MemberRow[]> {
  const db = await getDb();
  const docs = await db
    .collection("user")
    .find({}, { projection: { name: 1, email: 1, role: 1, status: 1, createdAt: 1 } })
    .limit(500)
    .toArray();
  return docs
    .map((d) => ({
      id: String(d._id),
      name: String(d.name ?? ""),
      email: String(d.email ?? ""),
      role: readRole(d.role),
      status: readStatus(d.status),
      joined: d.createdAt instanceof Date ? d.createdAt.toISOString().slice(0, 10) : "",
    }))
    .sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
}

/** Ends every sign-in a person has, so a removal takes effect on their next click. */
export async function endSessions(userId: string): Promise<void> {
  const db = await getDb();
  const ids: (string | ObjectId)[] = [userId];
  if (ObjectId.isValid(userId)) ids.push(new ObjectId(userId));
  await db.collection("session").deleteMany({ userId: { $in: ids } });
}
