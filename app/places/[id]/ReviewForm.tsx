"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/fields";
import { Notice } from "@/components/ui/Notice";
import { saveReview, type SaveReviewState } from "./reviewActions";

const start: SaveReviewState = { message: null, values: null, saved: 0 };

const RATINGS = [
  { key: "5", label: "5. Loved it" },
  { key: "4", label: "4. Really good" },
  { key: "3", label: "3. It was fine" },
  { key: "2", label: "2. Not great" },
  { key: "1", label: "1. Wouldn't go back" },
];

const labelClass = "mb-1 block text-sm font-bold";

// Your own review of a place. If you already wrote one, the form starts from it, and saving
// replaces it. After a mistake the form keeps what was typed.
export function ReviewForm({ restaurantId, existing }: { restaurantId: string; existing: { rating: number; note: string } | null }) {
  const [state, action, pending] = useActionState(saveReview, start);
  const v = state.values;
  const rating = v?.rating ?? (existing ? String(existing.rating) : "");
  const note = v?.note ?? existing?.note ?? "";
  return (
    <form action={action} className="grid max-w-xl gap-4">
      {state.message && (
        <Notice kind="error">
          <p>{state.message}</p>
        </Notice>
      )}
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <div key={`${rating}|${note}|${state.saved}`} className="grid gap-4">
        <Select label="Your rating" name="rating" options={RATINGS} anyLabel="Choose a rating" required defaultValue={rating} />
        <div>
          <label htmlFor="review-note" className={labelClass}>
            Your note (optional)
          </label>
          <textarea
            id="review-note"
            name="note"
            rows={3}
            maxLength={500}
            defaultValue={note}
            className="tt-transition block min-h-11 w-full rounded-control border-[1.5px] border-edge bg-card px-3 py-2 text-base text-ink placeholder:text-muted"
          />
        </div>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : existing ? "Update my review" : "Save my review"}
        </Button>
      </div>
    </form>
  );
}
