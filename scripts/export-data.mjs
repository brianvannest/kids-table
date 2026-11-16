// Saves a copy of your data to your own computer, as plain JSON files you can open in any text editor.
//
//   npm run export:data
//
// It only reads. It saves the restaurants, the reviews, the visits, and the list of people (names, emails,
// roles, and status). It deliberately leaves out the password records, the sign-in sessions, and the guess
// counters: you never need a copy of those, and they're the most sensitive things you have.
//
// The files are written to a folder called exports/. That folder is in .gitignore, so it can't be saved to
// GitHub by accident. These files hold your members' emails and private visits. Keep them off shared drives.
import { MongoClient } from "mongodb";
import { mkdirSync, writeFileSync } from "node:fs";

const uri = process.env.MONGODB_URI?.trim();
if (!uri) {
  console.error("MONGODB_URI isn't set. Run this with npm run export:data, so it can read .env.local.");
  process.exit(1);
}
const dbName = process.env.MONGODB_DB?.trim() || "kidstable";
const COLLECTIONS = ["restaurants", "reviews", "visits", "user"];

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
try {
  await client.connect();
  const db = client.db(dbName);
  const folder = `exports/${dbName}-${new Date().toISOString().slice(0, 10)}`;
  mkdirSync(folder, { recursive: true });
  for (const name of COLLECTIONS) {
    const docs = await db.collection(name).find({}).toArray();
    writeFileSync(`${folder}/${name}.json`, JSON.stringify(docs, null, 2));
    console.log(`${name}: ${docs.length} ${docs.length === 1 ? "record" : "records"}`);
  }
  console.log(`\nSaved to ${folder}/`);
  console.log("These files hold private information. Don't commit them, email them, or put them in a shared folder.");
} catch (error) {
  console.error("Couldn't export:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.close();
}
