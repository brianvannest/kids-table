import type { Metadata } from "next";
import { Suspense } from "react";
import { settings } from "@/lib/settings";
import { Notice } from "@/components/ui/Notice";
import { ImportForm } from "./ImportForm";
import { RestaurantList } from "./RestaurantList";

export const metadata: Metadata = {
  title: `Import ${settings.item.plural}`,
  robots: { index: false, follow: false },
};

export default function ImportPage() {
  // The import writes to the database, and there's no sign-in yet (Chapter 12), so it's switched
  // off on the live site. It works when you run the app on your own computer.
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="grid max-w-2xl gap-4">
        <h1 className="text-3xl font-extrabold leading-9 sm:text-4xl sm:leading-10">Import is off here</h1>
        <Notice kind="info">
          <p>
            Importing writes to the database, so it&apos;s switched off on the live site until sign-in is added in Chapter 12.
            Run the app on your own computer to use it.
          </p>
        </Notice>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <header className="grid max-w-prose gap-3">
        <h1 className="text-3xl font-extrabold leading-9 sm:text-4xl sm:leading-10">Bring in your {settings.item.plural}</h1>
        <p>Choose a spreadsheet saved as CSV. I&apos;ll check every row and show you what would happen before anything is saved.</p>
        <p className="text-sm text-muted">
          Columns: <code>name</code> (required), <code>area</code>, <code>foodType</code>, <code>features</code> (separate with a
          semicolon), <code>public</code> (yes or no), <code>lastChecked</code> (like 2026-11-02). The choices for area, food type, and
          features come from <code>lib/settings.ts</code>.
        </p>
      </header>

      <ImportForm item={settings.item} />

      <section className="grid gap-3">
        <h2 className="text-[22px] font-extrabold leading-7">In the database now</h2>
        <Suspense fallback={<p role="status">Loading the list...</p>}>
          <RestaurantList />
        </Suspense>
      </section>
    </div>
  );
}
