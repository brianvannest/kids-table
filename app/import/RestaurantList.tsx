import { connection } from "next/server";
import { settings, labelFor } from "@/lib/settings";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { listRestaurants } from "@/lib/restaurants";

// What is in the database right now. Runs on the server, reads live data, so the page wraps it
// in Suspense (see page.tsx).
export async function RestaurantList() {
  // Says "this part is built when someone asks for the page", not ahead of time. The database
  // driver reads the clock when it connects, and Next.js only allows that at request time.
  await connection();
  if (!isDatabaseConfigured()) {
    return <p>The database isn&apos;t set up yet. See the status page.</p>;
  }
  let rows;
  try {
    rows = await listRestaurants();
  } catch (error) {
    console.error("Couldn't list restaurants:", error instanceof Error ? error.message : error);
    return <p>Couldn&apos;t read the list. Check the status page.</p>;
  }
  if (rows.length === 0) {
    return <p>No {settings.item.plural} yet. Import a file above to add some.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">The {settings.item.plural} in the database</caption>
        <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-600">
          <tr>
            <th scope="col" className="px-3 py-2">Name</th>
            <th scope="col" className="px-3 py-2">Area</th>
            <th scope="col" className="px-3 py-2">Food</th>
            <th scope="col" className="px-3 py-2">Features</th>
            <th scope="col" className="px-3 py-2">Public</th>
            <th scope="col" className="px-3 py-2">Last checked</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-zinc-200 align-top">
              <td className="px-3 py-2 font-medium">{r.name}</td>
              <td className="px-3 py-2">{labelFor(settings.areas, r.area)}</td>
              <td className="px-3 py-2">{labelFor(settings.foodTypes, r.foodType)}</td>
              <td className="px-3 py-2">{r.features.map((f) => labelFor(settings.features, f)).join(", ")}</td>
              <td className="px-3 py-2">{r.public ? "Yes" : "No"}</td>
              <td className="px-3 py-2 tabular-nums">{r.lastChecked ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
