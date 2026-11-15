import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { settings, labelFor } from "@/lib/settings";
import { requireApprovedMember } from "@/lib/session";
import { buildMemberFilter, hasFilters, parseFilters, type RawParams } from "@/lib/publicFilters";
import { listMemberRestaurants } from "@/lib/restaurants";
import { getRatingSummaries, type RatingSummary } from "@/lib/reviews";
import { isDueForLook } from "@/lib/reviewRules";
import { isOwner } from "@/lib/memberRules";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { TagPill } from "@/components/ui/TagPill";
import { PublicFilters } from "../PublicFilters";

export const metadata: Metadata = { title: `All ${settings.item.plural}`, robots: { index: false, follow: false } };

// Every place, private ones too, for people the owner has approved. Anyone else is sent away
// before the database is asked for a single place.
async function PlacesList({ searchParams }: { searchParams: Promise<RawParams> }) {
  await connection();
  const member = await requireApprovedMember();
  const owner = isOwner(member);
  const today = new Date().toISOString().slice(0, 10);
  const filters = parseFilters(await searchParams, settings);

  let places;
  let ratings = new Map<string, RatingSummary>();
  try {
    places = await listMemberRestaurants(buildMemberFilter(filters));
    ratings = await getRatingSummaries(places.map((p) => p.id));
  } catch (error) {
    console.error("Couldn't list places for a member:", error instanceof Error ? error.message : error);
    return (
      <Notice kind="error">
        <p className="font-bold">The list isn&apos;t available right now.</p>
        <p>Try again in a minute.</p>
      </Notice>
    );
  }

  // Members see every choice, because every place is visible to them.
  const options = {
    areas: settings.areas.map((a) => a.key),
    foodTypes: settings.foodTypes.map((f) => f.key),
    features: settings.features.map((f) => f.key),
  };

  return (
    <div className="grid gap-6">
      <PublicFilters key={JSON.stringify(filters)} filters={filters} options={options} action="/places" />
      <section aria-labelledby="results-heading" className="grid gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="results-heading" className="text-[22px] font-extrabold leading-7">
            <span role="status">
              {places.length} {places.length === 1 ? settings.item.singular : settings.item.plural}
            </span>
          </h2>
          {hasFilters(filters) && <Link href="/places">Clear filters</Link>}
        </div>
        {places.length === 0 ? (
          <Notice kind="info">
            <p className="font-bold">No {settings.item.plural} match those choices.</p>
            <p>
              Try fewer features, or <Link href="/places">clear the filters</Link>. Can&apos;t find it? <Link href="/places/new">Add it</Link>.
            </p>
          </Notice>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {places.map((p) => {
              const where = [labelFor(settings.areas, p.area), labelFor(settings.foodTypes, p.foodType)].filter(Boolean).join(" · ");
              return (
                <li key={p.id}>
                  <Card className="h-full">
                    <h3 className="text-lg font-extrabold leading-6">
                      <Link href={`/places/${p.id}`}>{p.name}</Link>
                    </h3>
                    {where && <p className="mt-0.5 text-sm text-muted">{where}</p>}
                    {ratings.get(p.id)?.average != null && (
                      <p className="mt-1 text-sm">
                        <span className="font-bold tabular-nums">{ratings.get(p.id)?.average} out of 5</span>{" "}
                        <span className="text-muted">
                          ({ratings.get(p.id)?.count} {ratings.get(p.id)?.count === 1 ? "review" : "reviews"})
                        </span>
                      </p>
                    )}
                    {(p.features.length > 0 || !p.public || (owner && isDueForLook(p.lastChecked, today))) && (
                      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Features">
                        {!p.public && (
                          <li>
                            <TagPill tone="plain">Members only</TagPill>
                          </li>
                        )}
                        {owner && isDueForLook(p.lastChecked, today) && (
                          <li>
                            <TagPill tone="sun">Due for a fresh look</TagPill>
                          </li>
                        )}
                        {p.features.map((f) => (
                          <li key={f}>
                            <TagPill>{labelFor(settings.features, f)}</TagPill>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function PlacesPage({ searchParams }: PageProps<"/places">) {
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="grid gap-2">
          <h1 className="text-3xl font-extrabold leading-9 sm:text-4xl sm:leading-10">All {settings.item.plural}</h1>
          <p className="max-w-prose text-muted">Everything the group has saved, including places that aren&apos;t public.</p>
        </div>
        <Link href="/places/new" className={buttonClass("secondary")}>
          Add a {settings.item.singular}
        </Link>
      </header>
      <Suspense fallback={<SkeletonCards count={4} label={`Loading ${settings.item.plural}`} />}>
        <PlacesList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
