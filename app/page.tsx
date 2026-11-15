import { Suspense } from "react";
import { settings } from "@/lib/settings";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { PublicList } from "./PublicList";

// The public page. Anyone can open it. It shows only the places the owner marked public, and only
// their name, area, food, and features: no photos, no reviews, no ratings.
//
// The heading is built ahead of time. The search form and the list depend on the web address and
// the database, so they're built when someone asks, inside <Suspense>.
export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold leading-9 sm:text-4xl sm:leading-10">{settings.home.heading}</h1>
        <p className="max-w-prose text-muted">{settings.home.intro}</p>
      </header>
      <Suspense fallback={<SkeletonCards count={4} label={`Loading ${settings.item.plural}`} />}>
        <PublicList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
