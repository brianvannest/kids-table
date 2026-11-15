"use server";

import { revalidatePath } from "next/cache";
import { ownerForAction } from "@/lib/session";
import { setRestaurantChecked, setRestaurantPublic } from "@/lib/restaurants";

// What a stranger sees is decided here, so these check that the caller is the owner, themselves.
// A member, someone waiting, and a stranger all get nothing, even if they send the request by hand.

function refresh() {
  revalidatePath("/places/[id]", "page");
  revalidatePath("/places");
  revalidatePath("/");
}

/** Shows a place on the public page ("yes") or takes it off ("no"). Any other value does nothing. */
export async function changeVisibility(formData: FormData): Promise<void> {
  const owner = await ownerForAction();
  if (!owner) {
    console.error("Refused a visibility change from someone who isn't the owner.");
    return;
  }
  const id = formData.get("restaurantId");
  const value = formData.get("public");
  if (typeof id !== "string" || (value !== "yes" && value !== "no")) return;
  if (await setRestaurantPublic(id, value === "yes")) refresh();
}

/** Records that the owner looked this place over today. */
export async function markChecked(formData: FormData): Promise<void> {
  const owner = await ownerForAction();
  if (!owner) return;
  const id = formData.get("restaurantId");
  if (typeof id !== "string") return;
  if (await setRestaurantChecked(id, new Date().toISOString().slice(0, 10))) refresh();
}
