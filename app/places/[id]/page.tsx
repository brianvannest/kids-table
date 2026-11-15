import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { settings, labelFor } from "@/lib/settings";
import { requireApprovedMember } from "@/lib/session";
import { getRestaurant } from "@/lib/restaurants";
import { Card } from "@/components/ui/Card";
import { VisitsSection } from "./VisitsSection";
import { TagPill } from "@/components/ui/TagPill";

export const metadata: Metadata = { title: `A ${settings.item.singular}`, robots: { index: false, follow: false } };

async function PlaceDetails({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const member = await requireApprovedMember();
  const { id } = await params;
  const place = await getRestaurant(id);
  if (!place) notFound();

  const where = [labelFor(settings.areas, place.area), labelFor(settings.foodTypes, place.foodType)].filter(Boolean).join(" · ");
  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold leading-9 sm:text-4xl sm:leading-10">{place.name}</h1>
        {where && <p className="text-muted">{where}</p>}
      </header>
      <Card className="grid max-w-xl gap-4">
        {place.features.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Features">
            {place.features.map((f) => (
              <li key={f}>
                <TagPill>{labelFor(settings.features, f)}</TagPill>
              </li>
            ))}
          </ul>
        )}
        <p>{place.public ? "Anyone can see this place on the public page." : "Only approved members can see this place."}</p>
        {place.lastChecked && <p className="text-sm text-muted">Last checked {place.lastChecked}.</p>}
      </Card>
      <VisitsSection userId={member.id} restaurantId={place.id} />
      <p>
        <Link href="/places">Back to all {settings.item.plural}</Link>
      </p>
    </div>
  );
}

export default function PlacePage({ params }: PageProps<"/places/[id]">) {
  return (
    <Suspense fallback={<p role="status">Loading...</p>}>
      <PlaceDetails params={params} />
    </Suspense>
  );
}
