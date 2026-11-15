import type { RestaurantView } from "@/lib/restaurants";
import { isDueForLook } from "@/lib/reviewRules";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TagPill } from "@/components/ui/TagPill";
import { changeVisibility, markChecked } from "./ownerActions";

// Only the owner sees this, and only the owner's actions can do what it does: each one checks
// again, because a button being hidden isn't protection.
export function OwnerControls({ place }: { place: RestaurantView }) {
  const today = new Date().toISOString().slice(0, 10);
  const due = isDueForLook(place.lastChecked, today);
  return (
    <section aria-labelledby="owner-heading" className="grid gap-3">
      <h2 id="owner-heading" className="text-[22px] font-extrabold leading-7">
        Owner controls
      </h2>
      <Card className="grid max-w-xl gap-5">
        <div className="grid gap-2">
          <p className="font-bold">On the public page</p>
          <p>
            {place.public
              ? "Anyone can see this place's name, area, food, and features. Reviews, notes, and visits stay private."
              : "Not shown. Only approved members can see it."}
          </p>
          <form action={changeVisibility}>
            <input type="hidden" name="restaurantId" value={place.id} />
            <input type="hidden" name="public" value={place.public ? "no" : "yes"} />
            <Button type="submit" variant={place.public ? "secondary" : "primary"}>
              {place.public ? "Take off the public page" : "Show on the public page"}
            </Button>
          </form>
        </div>
        <div className="grid gap-2">
          <p className="flex flex-wrap items-center gap-2 font-bold">
            Last checked {due && <TagPill tone="sun">Due for a fresh look</TagPill>}
          </p>
          <p>{place.lastChecked ? `You last checked this place on ${place.lastChecked}.` : "You haven't checked this place yet."}</p>
          <form action={markChecked}>
            <input type="hidden" name="restaurantId" value={place.id} />
            <Button type="submit" variant="secondary">
              Mark as checked today
            </Button>
          </form>
        </div>
      </Card>
    </section>
  );
}
