"use client";

import Link from "next/link";
import { useActionState } from "react";
import { settings } from "@/lib/settings";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Select, TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/Notice";
import { addPlace, type AddPlaceState } from "./actions";

const start: AddPlaceState = { message: null, existingId: null, values: null };

// The form for a place the search didn't find. Area and food are required and chosen from the
// lists, so the filters on every page keep working. A new place starts out members-only.
//
// React clears a form after an action finishes. So that a mistake doesn't wipe what someone
// typed, the action sends their answers back, and the fields start from those. Changing the key
// makes the fields start over from the new answers.
export function AddPlaceForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(addPlace, start);
  const v = state.values;
  return (
    <form action={action} className="grid max-w-xl gap-4">
      {state.message && (
        <Notice kind="error">
          <p>{state.message}</p>
          {state.existingId && (
            <p>
              <Link href={`/places/${state.existingId}`}>Open it</Link>
            </p>
          )}
        </Notice>
      )}
      <div key={JSON.stringify(v)} className="grid gap-4">
        <TextField label="Name" name="name" defaultValue={v?.name ?? name} required maxLength={80} autoComplete="off" />
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          <Select label="Area" name="area" options={settings.areas} anyLabel="Choose an area" required defaultValue={v?.area ?? ""} />
          <Select label="Food" name="food" options={settings.foodTypes} anyLabel="Choose a kind of food" required defaultValue={v?.food ?? ""} />
        </div>
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-1 p-0 text-sm font-bold">Features</legend>
          <div className="flex flex-wrap gap-2">
            {settings.features.map((f) => (
              <Chip key={f.key} name="feature" value={f.key} label={f.label} defaultChecked={v?.features.includes(f.key) ?? false} />
            ))}
          </div>
        </fieldset>
      </div>
      <p className="text-sm text-muted">New places are only visible to members. The owner decides what goes on the public page.</p>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding..." : `Add this ${settings.item.singular}`}
        </Button>
      </div>
    </form>
  );
}
