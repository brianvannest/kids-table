import Link from "next/link";
import { connection } from "next/server";
import { settings, labelFor } from "@/lib/settings";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { buildPublicFilter, hasFilters, parseFilters, type RawParams } from "@/lib/publicFilters";
import { getPublicOverview, listPublicRestaurants, type PublicRestaurantView } from "@/lib/restaurants";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { TagPill } from "@/components/ui/TagPill";
import { PublicFilters } from "./PublicFilters";

type Loaded =
  | { kind: "ready"; places: PublicRestaurantView[]; overview: Awaited<ReturnType<typeof getPublicOverview>> }
  | { kind: "unavailable" };

// Reads from the database. Returns a result instead of building page content inside a try, which
// React doesn't allow.
async function load(filter: Record<string, unknown>): Promise<Loaded> {
  if (!isDatabaseConfigured()) return { kind: "unavailable" };
  try {
    const [overview, places] = await Promise.all([getPublicOverview(), listPublicRestaurants(filter)]);
    return { kind: "ready", overview, places };
  } catch (error) {
    // The details go to the terminal. A visitor only ever sees the generic message below.
    console.error("Couldn't load the public list:", error instanceof Error ? error.message : error);
    return { kind: "unavailable" };
  }
}

function PlaceCard({ place }: { place: PublicRestaurantView }) {
  const where = [labelFor(settings.areas, place.area), labelFor(settings.foodTypes, place.foodType)].filter(Boolean).join(" · ");
  return (
    <li>
      <Card className="h-full">
        <h2 className="text-lg font-extrabold leading-6">{place.name}</h2>
        {where && <p className="mt-0.5 text-sm text-muted">{where}</p>}
        {place.features.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Features">
            {place.features.map((f) => (
              <li key={f}>
                <TagPill>{labelFor(settings.features, f)}</TagPill>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </li>
  );
}

// The part of the page that depends on the web address and the database. It runs when someone asks
// for the page, which is why page.tsx wraps it in <Suspense>.
export async function PublicList({ searchParams }: { searchParams: Promise<RawParams> }) {
  await connection();
  const filters = parseFilters(await searchParams, settings);
  const loaded = await load(buildPublicFilter(filters));

  if (loaded.kind === "unavailable") {
    return (
      <Notice kind="error">
        <p className="font-bold">The list isn&apos;t available right now.</p>
        <p>Try again in a minute.</p>
        {process.env.NODE_ENV !== "production" && (
          <p className="mt-2 text-sm">
            For you, running this on your own computer: check <a href="/status">the status page</a>.
          </p>
        )}
      </Notice>
    );
  }

  const { places, overview } = loaded;
  const options = { areas: overview.areas, foodTypes: overview.foodTypes, features: overview.features };

  // Nothing is public at all: a different situation from "nothing matches".
  if (overview.total === 0) {
    return (
      <Notice kind="info">
        <p className="font-bold">No {settings.item.plural} are public yet.</p>
        <p>The owner chooses which ones to share. Check back soon.</p>
      </Notice>
    );
  }

  const count = places.length;
  return (
    <div className="grid gap-6">
      {/* The key makes the form start fresh when the filters change, so "Clear filters" really clears it. */}
      <PublicFilters key={JSON.stringify(filters)} filters={filters} options={options} />

      <section aria-labelledby="results-heading" className="grid gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="results-heading" className="text-[22px] font-extrabold leading-7">
            <span role="status">
              {count} {count === 1 ? settings.item.singular : settings.item.plural}
            </span>
          </h2>
          {hasFilters(filters) && <Link href="/">Clear filters</Link>}
        </div>

        {count === 0 ? (
          <Notice kind="info">
            <p className="font-bold">No {settings.item.plural} match those choices.</p>
            <p>
              Try fewer features, or <Link href="/">clear the filters</Link>.
            </p>
          </Notice>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {places.map((p) => (
              <PlaceCard key={p.key} place={p} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
