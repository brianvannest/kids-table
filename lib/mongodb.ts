import "server-only";
import { MongoClient, type Db } from "mongodb";

// The only place the app opens a connection to MongoDB. The "server-only" import above makes
// the build fail if any code that runs in the browser ever imports this file, so the connection
// string can't leak into a page someone downloads.

// Keep one client for as long as the server runs. In development, Next.js reloads modules often,
// so the client lives on globalThis, where a reload can't lose it and open a second connection.
const globalForMongo = globalThis as unknown as { kidsTableMongo?: Promise<MongoClient> };

/** True when MONGODB_URI is set. It says nothing about whether the value works. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local.");
  const client = new MongoClient(uri, { appName: "kids-table", serverSelectionTimeoutMS: 8000 });
  const connecting = client.connect();
  // If the first attempt fails, forget it so the next request can try again.
  connecting.catch(() => {
    if (globalForMongo.kidsTableMongo === connecting) globalForMongo.kidsTableMongo = undefined;
  });
  return connecting;
}

/** The app's database. Call it from server code only. */
export async function getDb(): Promise<Db> {
  globalForMongo.kidsTableMongo ??= connect();
  const client = await globalForMongo.kidsTableMongo;
  return client.db(process.env.MONGODB_DB ?? "kidstable");
}
