"use server";

import { revalidatePath } from "next/cache";
import { memberForAction } from "@/lib/session";
import { addMyVisit, deleteMyVisit } from "@/lib/visits";
import { checkVisit } from "@/lib/visitRules";

/** What the person typed, sent back with an error so the form doesn't wipe their notes. */
export type LogVisitState = { message: string | null; notes: string | null; saved: number };

// A server action can be called by anyone who sends the right request. So each one checks, itself,
// that the caller is an approved member. And the person a visit belongs to is never read from the
// form. It's the signed-in person, every time, so no form can log a visit for someone else.
export async function logVisit(previous: LogVisitState, formData: FormData): Promise<LogVisitState> {
  const rawNotes = formData.get("notes");
  const typedNotes = typeof rawNotes === "string" ? rawNotes.slice(0, 600) : "";

  const member = await memberForAction();
  if (!member) return { message: "Sign in as an approved member to log a visit.", notes: typedNotes, saved: previous.saved };

  const checked = checkVisit({ date: formData.get("date"), notes: formData.get("notes") }, new Date().toISOString().slice(0, 10));
  if (!checked.ok) return { message: checked.message, notes: typedNotes, saved: previous.saved };

  const restaurantId = formData.get("restaurantId");
  const saved = await addMyVisit(member.id, typeof restaurantId === "string" ? restaurantId : "", checked.visit);
  if (!saved) return { message: "We couldn't find that place.", notes: typedNotes, saved: previous.saved };

  revalidatePath("/places/[id]", "page");
  revalidatePath("/visits");
  return { message: null, notes: null, saved: previous.saved + 1 };
}

export async function deleteVisit(formData: FormData): Promise<void> {
  const member = await memberForAction();
  if (!member) return;
  const visitId = formData.get("visitId");
  if (typeof visitId !== "string") return;
  // The query includes the member's own id, so someone else's visit can't be deleted this way.
  await deleteMyVisit(member.id, visitId);
  revalidatePath("/places/[id]", "page");
  revalidatePath("/visits");
}
