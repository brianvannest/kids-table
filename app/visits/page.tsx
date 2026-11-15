import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { settings } from "@/lib/settings";
import { requireApprovedMember } from "@/lib/session";
import { listMyVisits } from "@/lib/visits";
import { Notice } from "@/components/ui/Notice";

export const metadata: Metadata = { title: `My ${settings.visit.plural}`, robots: { index: false, follow: false } };

async function MyVisits() {
  await connection();
  const user = await requireApprovedMember();

  let visits;
  try {
    visits = await listMyVisits(user.id);
  } catch (error) {
    console.error("Couldn't list visits:", error instanceof Error ? error.message : error);
    return (
      <Notice kind="error">
        <p>Couldn&apos;t read your {settings.visit.plural}. Try again in a minute.</p>
      </Notice>
    );
  }

  if (visits.length === 0) {
    return (
      <Notice kind="info">
        <p className="font-bold">You haven&apos;t logged a {settings.visit.singular} yet.</p>
        <p>
          Open a {settings.item.singular} from <Link href="/places">the list</Link> and log one.
        </p>
      </Notice>
    );
  }

  return (
    <ul className="grid max-w-2xl overflow-hidden rounded-card border border-line bg-card" aria-label={`Your ${settings.visit.plural}`}>
      {visits.map((v) => (
        <li key={v.id} className="border-t border-line px-4 py-3 first:border-t-0">
          <p className="font-bold">
            <span className="tabular-nums">{v.date}</span> <span aria-hidden="true">·</span>{" "}
            <Link href={`/places/${v.restaurantId}`}>{v.placeName}</Link>
          </p>
          {v.notes && <p className="whitespace-pre-line break-words">{v.notes}</p>}
        </li>
      ))}
    </ul>
  );
}

export default function VisitsPage() {
  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold leading-9 sm:text-4xl sm:leading-10">My {settings.visit.plural}</h1>
        <p className="max-w-prose text-muted">Every {settings.visit.singular} you&apos;ve logged, newest first. Only you can see this page.</p>
      </header>
      <Suspense fallback={<p role="status">Loading...</p>}>
        <MyVisits />
      </Suspense>
    </div>
  );
}
