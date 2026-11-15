import type { Metadata } from "next";
import { Suspense } from "react";
import { getDb, isDatabaseConfigured } from "@/lib/mongodb";

export const metadata: Metadata = { title: "Status · The Kids' Table" };

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
  const state = await checkDatabase();
  switch (state.kind) {
    case "not-set":
      return (
        <p>
          <strong>Not set up yet.</strong> The app has no <code>MONGODB_URI</code>. Add it to{" "}
          <code>.env.local</code>, then restart the app.
        </p>
      );
    case "connected":
      return (
        <p>
          <strong>Connected.</strong> The app reached the database named <code>{state.name}</code>.
        </p>
      );
    case "rejected":
      return (
        <p>
          <strong>The database said no.</strong> The username or password in <code>MONGODB_URI</code> was
          rejected.
        </p>
      );
    case "unreachable":
      return (
        <p>
          <strong>Couldn&apos;t reach the database.</strong> Check that your current IP address is on the
          Atlas IP Access List, and that <code>MONGODB_URI</code> is complete.
        </p>
      );
  }
}

export default function StatusPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Status</h1>
      <Suspense fallback={<p>Checking the database...</p>}>
        <DatabaseStatus />
      </Suspense>
    </main>
  );
}
