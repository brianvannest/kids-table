import type { Metadata } from "next";
import { Suspense } from "react";
import { settings } from "@/lib/settings";
import { ImportForm } from "./ImportForm";
import { RestaurantList } from "./RestaurantList";

export const metadata: Metadata = { title: `Import ${settings.item.plural} · ${settings.appName}` };

export default function ImportPage() {
  // The import writes to the database, and there's no sign-in yet (Chapter 12), so it's switched
  // off on the live site. It works when you run the app on your own computer.
  if (process.env.NODE_ENV === "production") {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Import is off here</h1>
        <p>
          Importing writes to the database, so it&apos;s switched off on the live site until sign-in is added in Chapter 12.
          Run the app on your own computer to use it.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Bring in your {settings.item.plural}</h1>
        <p className="max-w-2xl text-lg text-zinc-700">
          Choose a spreadsheet saved as CSV. I&apos;ll check every row and show you what would happen before anything is saved.
        </p>
        <p className="max-w-2xl text-sm text-zinc-600">
          Columns: <code>name</code> (required), <code>area</code>, <code>foodType</code>, <code>features</code> (separate with a
          semicolon), <code>public</code> (yes or no), <code>lastChecked</code> (like 2026-11-02). The choices for area, food type, and
          features come from <code>lib/settings.ts</code>.
        </p>
      </header>

      <ImportForm item={settings.item} />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">In the database now</h2>
        <Suspense fallback={<p>Loading the list...</p>}>
          <RestaurantList />
        </Suspense>
      </section>
    </main>
  );
}
