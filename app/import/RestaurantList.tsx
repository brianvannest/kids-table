import { connection } from "next/server";
import { settings, labelFor } from "@/lib/settings";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { listRestaurants } from "@/lib/restaurants";
import { Notice } from "@/components/ui/Notice";
import { table } from "@/components/ui/table";

// What is in the database right now, private places included. This is the owner's view, and it's
// only on the import page, which is off on the live site. Runs on the server, reads live data, so
// the page wraps it in Suspense.
export async function RestaurantList() {
  // Says "this part is built when someone asks for the page", not ahead of time. The database
  // driver reads the clock when it connects, and Next.js only allows that at request time.
  await connection();
  if (!isDatabaseConfigured()) {
    return (
      <Notice kind="warning">
        <p>The database isn&apos;t set up yet. See the status page.</p>
      </Notice>
    );
  }
  let rows;
  try {
    rows = await listRestaurants();
  } catch (error) {
    console.error("Couldn't list restaurants:", error instanceof Error ? error.message : error);
    return (
      <Notice kind="error">
        <p>Couldn&apos;t read the list. Check the status page.</p>
      </Notice>
    );
  }
  if (rows.length === 0) {
    return (
      <Notice kind="info">
        <p>No {settings.item.plural} yet. Import a file above to add some.</p>
      </Notice>
    );
  }
  return (
    <div className={table.wrap} tabIndex={0} role="region" aria-label={`The ${settings.item.plural} in the database. Scrolls sideways on a small screen.`}>
      <table className={table.table}>
        <caption className="sr-only">The {settings.item.plural} in the database</caption>
        <thead>
          <tr>
            <th scope="col" className={table.th}>Name</th>
            <th scope="col" className={table.th}>Area</th>
            <th scope="col" className={table.th}>Food</th>
            <th scope="col" className={table.th}>Features</th>
            <th scope="col" className={table.th}>Public</th>
            <th scope="col" className={table.th}>Last checked</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className={`${table.td} font-bold`}>{r.name}</td>
              <td className={table.td}>{labelFor(settings.areas, r.area)}</td>
              <td className={table.td}>{labelFor(settings.foodTypes, r.foodType)}</td>
              <td className={table.td}>{r.features.map((f) => labelFor(settings.features, f)).join(", ")}</td>
              <td className={table.td}>{r.public ? "Yes" : "No"}</td>
              <td className={`${table.td} tabular-nums`}>{r.lastChecked ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
