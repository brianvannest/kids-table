import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { settings, labelFor } from "@/lib/settings";
import { requireApprovedMember } from "@/lib/session";
import { buildMemberFilter, parseFilters, type RawParams } from "@/lib/publicFilters";
import { listMemberRestaurants } from "@/lib/restaurants";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/Notice";
import { AddPlaceForm } from "./AddPlaceForm";

export const metadata: Metadata = { title: `Add a ${settings.item.singular}`, robots: { index: false, follow: false } };

const MAX_SHOWN = 8;

// Search first. Most places someone wants to add are already in the list, so this looks for the
// name before offering to add it. Only if the person says "none of these" does the form appear.
async function Finder({ searchParams }: { searchParams: Promise<RawParams> }) {
  await connection();
  await requireApprovedMember();
  const raw = await searchParams;
  const q = parseFilters({ q: raw.q }, settings).q;
  const adding = raw.add === "1" && q.length > 0;

  const matches = q ? (await listMemberRestaurants(buildMemberFilter({ q, area: null, foodType: null, features: [] }))).slice(0, MAX_SHOWN) : [];

  return (
    <div className="grid gap-6">
      <Form action="/places/new" role="search" aria-label={`Look for a ${settings.item.singular}`} className="grid max-w-xl gap-3">
        <TextField label={`What's the ${settings.item.singular} called?`} name="q" type="search" defaultValue={q} autoComplete="off" maxLength={60} />
        <div>
          <Button type="submit" variant={q ? "secondary" : "primary"}>
            Search
          </Button>
        </div>
      </Form>

      {q && matches.length > 0 && (
        <section aria-labelledby="found-heading" className="grid max-w-xl gap-3">
          <h2 id="found-heading" className="text-[22px] font-extrabold leading-7">
            Is it one of these?
          </h2>
          <ul className="grid gap-3">
            {matches.map((m) => (
              <li key={m.id}>
                <Card>
                  <p className="font-bold">
                    <Link href={`/places/${m.id}`}>{m.name}</Link>
                  </p>
                  <p className="text-sm text-muted">
                    {[labelFor(settings.areas, m.area), labelFor(settings.foodTypes, m.foodType)].filter(Boolean).join(" · ")}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {q && matches.length === 0 && (
        <Notice kind="info">
          <p>
            Nothing in the list is called &ldquo;{q}&rdquo;.
          </p>
        </Notice>
      )}

      {q && !adding && (
        <div>
          <Link href={`/places/new?${new URLSearchParams({ q, add: "1" })}`} className={buttonClass(matches.length > 0 ? "secondary" : "primary")}>
            None of these. Add &ldquo;{q}&rdquo;
          </Link>
        </div>
      )}

      {adding && (
        <section aria-labelledby="add-heading" className="grid gap-4">
          <h2 id="add-heading" className="text-[22px] font-extrabold leading-7">
            Add it
          </h2>
          <AddPlaceForm key={q} name={q} />
        </section>
      )}
    </div>
  );
}

export default function NewPlacePage({ searchParams }: PageProps<"/places/new">) {
  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold leading-9 sm:text-4xl sm:leading-10">Add a {settings.item.singular}</h1>
        <p className="max-w-prose text-muted">Look for it first, so the same place doesn&apos;t end up in the list twice.</p>
      </header>
      <Suspense fallback={<p role="status">Loading...</p>}>
        <Finder searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
