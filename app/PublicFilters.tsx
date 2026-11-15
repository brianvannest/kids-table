import Form from "next/form";
import { settings } from "@/lib/settings";
import type { PublicFilters as Filters } from "@/lib/publicFilters";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Select, TextField } from "@/components/ui/fields";

type Options = { areas: string[]; foodTypes: string[]; features: string[] };

// The search form. It's a plain GET form: pressing the button puts the choices into the web
// address (/?q=pony&area=heights), so a filtered list is a link you can share, and it works even
// when JavaScript hasn't loaded. Nothing submits on its own when a control changes. The button is
// the only way, and it's the one tomato button on the screen.
//
// Only choices that lead somewhere are offered: the areas, food types, and features of the places
// the page can show. `action` is the page the form sends its choices to.
export function PublicFilters({ filters, options, action = "/" }: { filters: Filters; options: Options; action?: string }) {
  const areas = settings.areas.filter((a) => options.areas.includes(a.key));
  const foodTypes = settings.foodTypes.filter((f) => options.foodTypes.includes(f.key));
  const features = settings.features.filter((f) => options.features.includes(f.key));

  return (
    <Form action={action} role="search" aria-label={`Find a ${settings.item.singular}`} className="grid max-w-2xl gap-4">
      <TextField
        label="Search by name"
        name="q"
        type="search"
        defaultValue={filters.q}
        autoComplete="off"
        maxLength={60}
      />

      {features.length > 0 && (
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-1 p-0 text-sm font-bold">Features</legend>
          <div className="flex flex-wrap gap-2">
            {features.map((f) => (
              <Chip key={f.key} name="feature" value={f.key} label={f.label} defaultChecked={filters.features.includes(f.key)} />
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">Shows places that have every feature you pick.</p>
        </fieldset>
      )}

      {(areas.length > 0 || foodTypes.length > 0) && (
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          {areas.length > 0 && <Select label="Area" name="area" options={areas} anyLabel="Any area" defaultValue={filters.area ?? ""} />}
          {foodTypes.length > 0 && (
            <Select label="Food" name="food" options={foodTypes} anyLabel="Any food" defaultValue={filters.foodType ?? ""} />
          )}
        </div>
      )}

      <div>
        <Button type="submit">Show {settings.item.plural}</Button>
      </div>
    </Form>
  );
}
