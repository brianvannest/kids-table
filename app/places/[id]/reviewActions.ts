"use server";

import { revalidatePath } from "next/cache";
import { memberForAction } from "@/lib/session";
import { deleteMyReview, saveMyReview } from "@/lib/reviews";
import { checkReview } from "@/lib/reviewRules";

/** What the person typed, sent back with an error so the form doesn't wipe it. */
export type SaveReviewState = { message: string | null; values: { rating: string; note: string } | null; saved: number };

const asText = (value: FormDataEntryValue | null, max: number): string => (typeof value === "string" ? value.slice(0, max) : "");

// Anyone who sends the right request can call a server action, so each one checks, itself, that the
// caller is an approved member. The person a review belongs to is the signed-in person, never a
// value from the form, and saving a second time replaces the first: it's one review per person.
export async function saveReview(previous: SaveReviewState, formData: FormData): Promise<SaveReviewState> {
  const values = { rating: asText(formData.get("rating"), 4), note: asText(formData.get("note"), 600) };

  const member = await memberForAction();
  if (!member) return { message: "Sign in as an approved member to write a review.", values, saved: previous.saved };

  const checked = checkReview({ rating: formData.get("rating"), note: formData.get("note") });
  if (!checked.ok) return { message: checked.message, values, saved: previous.saved };

  const restaurantId = formData.get("restaurantId");
  const ok = await saveMyReview(member.id, typeof restaurantId === "string" ? restaurantId : "", checked.review);
  if (!ok) return { message: "We couldn't find that place.", values, saved: previous.saved };

  revalidatePath("/places/[id]", "page");
  revalidatePath("/places");
  return { message: null, values: null, saved: previous.saved + 1 };
}

export async function deleteReview(formData: FormData): Promise<void> {
  const member = await memberForAction();
  if (!member) return;
  const restaurantId = formData.get("restaurantId");
  if (typeof restaurantId !== "string") return;
  // The query includes the member's own id, so this can only ever remove their own review.
  await deleteMyReview(member.id, restaurantId);
  revalidatePath("/places/[id]", "page");
  revalidatePath("/places");
}
