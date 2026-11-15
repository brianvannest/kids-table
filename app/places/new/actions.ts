"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { settings } from "@/lib/settings";
import { nameKeyOf } from "@/lib/importRows";
import { checkNewPlace } from "@/lib/newPlace";
import { insertRestaurant } from "@/lib/restaurants";
import { memberForAction } from "@/lib/session";

/** What the person typed, sent back with an error so the form doesn't wipe their answers. */
export type SubmittedValues = { name: string; area: string; food: string; features: string[] };
export type AddPlaceState = { message: string | null; existingId: string | null; values: SubmittedValues | null };

const asText = (value: FormDataEntryValue | null, max: number): string => (typeof value === "string" ? value.slice(0, max) : "");

// A server action can be called by anyone who sends the right request, not just by the form. So it
// checks, itself, that the caller is an approved member. Then it checks everything the form sent.
// The search-first page is a courtesy to people. The real guard against the same place twice is
// the database's unique index on name and area.
export async function addPlace(_previous: AddPlaceState, formData: FormData): Promise<AddPlaceState> {
  const values: SubmittedValues = {
    name: asText(formData.get("name"), 80),
    area: asText(formData.get("area"), 40),
    food: asText(formData.get("food"), 40),
    features: formData.getAll("feature").map((f) => asText(f, 40)).slice(0, 10),
  };

  const member = await memberForAction();
  if (!member) return { message: "Sign in as an approved member to add a place.", existingId: null, values };

  const checked = checkNewPlace(
    { name: formData.get("name"), area: formData.get("area"), foodType: formData.get("food"), features: formData.getAll("feature") },
    settings,
  );
  if (!checked.ok) return { message: checked.message, existingId: null, values };

  const result = await insertRestaurant({ ...checked.place, nameKey: nameKeyOf(checked.place.name), createdBy: member.id });
  if (result.kind === "exists") {
    return { message: "That place is already in the list.", existingId: result.id, values };
  }
  revalidatePath("/places");
  // redirect() works by throwing, so it has to be the last thing that runs.
  redirect(`/places/${result.id}`);
}
