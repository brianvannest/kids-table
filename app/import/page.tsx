import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { settings } from "@/lib/settings";
import { requireOwnerPage } from "@/lib/session";
import { ImportForm } from "./ImportForm";
import { RestaurantList } from "./RestaurantList";

export const metadata: Metadata = {
  title: `Import ${settings.item.plural}`,
  robots: { index: false, follow: false },
};

// Only the owner can see this page. Anyone else is sent away before anything is shown. The
// import action checks again for itself, because an action can be called without this page.
async function OwnerGate() {
  await connection();
  await requireOwnerPage();
  return (
    <>
      <ImportForm item={settings.item} />

      <section className="grid gap-3">
        <h2 className="text-[22px] font-extrabold leading-7">In the database now</h2>
        <Suspense fallback={<p role="status">Loading the list...</p>}>
          <RestaurantList />
        </Suspense>
      </section>
    </>
  );
}

export default function ImportPage() {
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
      <Suspense fallback={<p role="status">Loading...</p>}>
        <OwnerGate />
      </Suspense>
    </div>
  );
}
