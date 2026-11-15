"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongodb";
import { ownerForAction } from "@/lib/session";
import { endSessions, userFilter } from "@/lib/members";
import { MEMBER_ACTIONS, applyAction, readRole, readStatus, type MemberAction } from "@/lib/memberRules";

// A server action can be called by anyone who sends the right request, not just by the button on
// the Members page. So this checks, itself, that the caller is the owner. Then it checks that the
// action makes sense for that person: a waiting person can be approved, a member can be removed,
// and nobody can change the owner. Everything the browser sent is treated as untrusted.
export async function changeMember(formData: FormData): Promise<void> {
  const owner = await ownerForAction();
  if (!owner) {
    console.error("Refused a member change from someone who isn't the owner.");
    return;
  }

  const userId = formData.get("userId");
  const action = formData.get("action");
  if (typeof userId !== "string" || typeof action !== "string" || !userId || userId.length > 64) return;
  if (!MEMBER_ACTIONS.includes(action as MemberAction)) return;

  const users = (await getDb()).collection("user");
  const target = await users.findOne(userFilter(userId), { projection: { role: 1, status: 1 } });
  if (!target) return;

  const next = applyAction({ role: readRole(target.role), status: readStatus(target.status) }, action);
  if (!next) return;

  await users.updateOne({ _id: target._id }, { $set: { status: next, updatedAt: new Date() } });
  // Someone who was declined or removed is signed out everywhere, right away.
  if (next === "removed") await endSessions(String(target._id));
  revalidatePath("/members");
}
