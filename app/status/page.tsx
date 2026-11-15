import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getDb, isDatabaseConfigured } from "@/lib/mongodb";
import { Notice } from "@/components/ui/Notice";

// Not for search engines, and (in production) not for details either. A stranger who finds this
// page learns only whether the app is working.
export const metadata: Metadata = { title: "Status", robots: { index: false, follow: false } };

type DatabaseState =
  | { kind: "not-set" }
  | { kind: "connected"; name: string }
  | { kind: "rejected" }
  | { kind: "unreachable" };

// Asks the database a yes-or-no question. It never returns the connection string, the password,
// or the raw error, so none of them can end up on the page.
async function checkDatabase(): Promise<DatabaseState> {
  if (!isDatabaseConfigured()) return { kind: "not-set" };
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return { kind: "connected", name: db.databaseName };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const message = error instanceof Error ? error.message : "";
    // The details go to the terminal where you run the app. The page only says what to check.
    console.error("Database check failed:", name, message);
    return /auth/i.test(message) ? { kind: "rejected" } : { kind: "unreachable" };
  }
}

async function DatabaseStatus() {
  await connection();
  const state = await checkDatabase();

  // On the live site, say only whether it works. The database's name, the setting's name, and
  // what to check are for the person running the app on their own computer.
  if (process.env.NODE_ENV === "production") {
    return state.kind === "connected" ? (
      <Notice kind="success">
        <p className="font-bold">Connected.</p>
      </Notice>
    ) : (
      <Notice kind="error">
        <p className="font-bold">Not connected.</p>
      </Notice>
    );
  }

  switch (state.kind) {
    case "not-set":
      return (
        <Notice kind="warning">
          <p className="font-bold">Not set up yet.</p>
          <p>
            The app has no <code>MONGODB_URI</code>. Add it to <code>.env.local</code>, then restart the app.
          </p>
        </Notice>
      );
    case "connected":
      return (
        <Notice kind="success">
          <p className="font-bold">Connected.</p>
          <p>
            The app reached the database named <code>{state.name}</code>.
          </p>
        </Notice>
      );
    case "rejected":
      return (
        <Notice kind="error">
          <p className="font-bold">The database said no.</p>
          <p>
            The username or password in <code>MONGODB_URI</code> was rejected.
          </p>
        </Notice>
      );
    case "unreachable":
      return (
        <Notice kind="error">
          <p className="font-bold">Couldn&apos;t reach the database.</p>
          <p>
            Check that your current IP address is on the Atlas IP Access List, and that <code>MONGODB_URI</code> is
            complete.
          </p>
        </Notice>
      );
  }
}

export default function StatusPage() {
  return (
    <div className="grid max-w-xl gap-4">
      <h1 className="text-3xl font-extrabold leading-9 sm:text-4xl sm:leading-10">Status</h1>
      <Suspense fallback={<p role="status">Checking the database...</p>}>
        <DatabaseStatus />
      </Suspense>
    </div>
  );
}
