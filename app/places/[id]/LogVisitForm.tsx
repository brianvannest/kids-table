"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/Notice";
import { logVisit, type LogVisitState } from "./actions";

const start: LogVisitState = { message: null, notes: null, saved: 0 };

// The date never changes while the page is open, so there is nothing to subscribe to.
const subscribeNever = () => () => {};

const labelClass = "mb-1 block text-sm font-bold";

/** Today's date on this person's own clock, as YYYY-MM-DD. The server's clock may be a day off. */
function localToday(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

// The form for logging a visit. The date starts as today, worked out in the browser so it matches
// the person's own calendar. After a mistake the notes stay as typed. After a save the form clears.
export function LogVisitForm({ restaurantId }: { restaurantId: string }) {
  const [state, action, pending] = useActionState(logVisit, start);
  // Today comes from the browser's clock. On the server it's empty, so the two always agree while
  // the page loads, and the date fills in right after. Once the person picks a date, theirs wins.
  const today = useSyncExternalStore(subscribeNever, localToday, () => "");
  const [picked, setPicked] = useState<string | null>(null);
  const date = picked ?? today;

  return (
    <form action={action} className="grid max-w-xl gap-4">
      {state.message && (
        <Notice kind="error">
          <p>{state.message}</p>
        </Notice>
      )}
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <TextField label="Date" name="date" type="date" required value={date} max={today || undefined} onChange={(e) => setPicked(e.target.value)} />
      <div key={state.notes ?? `saved-${state.saved}`}>
        <label htmlFor="visit-notes" className={labelClass}>
          Notes (only you can see these)
        </label>
        <textarea
          id="visit-notes"
          name="notes"
          rows={3}
          maxLength={500}
          defaultValue={state.notes ?? ""}
          className="tt-transition block min-h-11 w-full rounded-control border-[1.5px] border-edge bg-card px-3 py-2 text-base text-ink placeholder:text-muted"
        />
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Log this visit"}
        </Button>
      </div>
    </form>
  );
}
