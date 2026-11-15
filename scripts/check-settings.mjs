// Checks your settings before you launch, and says what's wrong in plain words.
//
//   npm run check:settings            checks the settings for your own computer
//   npm run check:settings -- --live  checks them the way the live site needs them
//
// It never prints a secret. For each setting it says whether it's there, how long it is, and
// whether it looks right. Run it with .env.local loaded: the npm script does that for you.
import { authProblems, MIN_SECRET_LENGTH } from "../lib/authConfig.ts";

const live = process.argv.includes("--live");
const env = process.env;
const lines = [];
const say = (ok, name, text) => lines.push(`${ok ? "OK     " : "PROBLEM"}  ${name}: ${text}`);

const uri = (env.MONGODB_URI ?? "").trim();
if (!uri) say(false, "MONGODB_URI", "not set. Copy the connection string from Atlas into .env.local.");
else if (!/^mongodb(\+srv)?:\/\//.test(uri)) say(false, "MONGODB_URI", "set, but it doesn't start with mongodb+srv://. Check you copied the whole string.");
else if (uri.includes("<db_password>") || uri.includes("<password>")) say(false, "MONGODB_URI", "set, but it still contains the placeholder for the password. Replace it with the real one.");
else say(true, "MONGODB_URI", `set (${uri.length} characters)`);

const secret = (env.BETTER_AUTH_SECRET ?? "").trim();
if (!secret) say(false, "BETTER_AUTH_SECRET", "not set. Make one in your own terminal and put it in .env.local.");
else if (secret.length < MIN_SECRET_LENGTH) say(false, "BETTER_AUTH_SECRET", `set, but only ${secret.length} characters. It needs at least ${MIN_SECRET_LENGTH}.`);
else say(true, "BETTER_AUTH_SECRET", `set (${secret.length} characters)`);

const address = (env.BETTER_AUTH_URL ?? "").trim();
if (!address) say(!live, "BETTER_AUTH_URL", live ? "not set. On the live site it must be the live address, starting with https://." : "not set. That's fine on your own computer: it defaults to http://localhost:3000.");
else if (live && !address.startsWith("https://")) say(false, "BETTER_AUTH_URL", "set, but the live site needs an address that starts with https://.");
else say(true, "BETTER_AUTH_URL", `set (${address})`);

const owner = (env.OWNER_EMAIL ?? "").trim();
if (!owner) say(false, "OWNER_EMAIL", "not set. Nobody can become the owner until it is.");
else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(owner)) say(false, "OWNER_EMAIL", "set, but it doesn't look like an email address.");
else say(true, "OWNER_EMAIL", "set");

for (const l of lines) console.log(l);
// The app itself uses the same rules, so what this says is what the app will do.
const problems = authProblems(env, live);
const ready = !lines.some((l) => l.startsWith("PROBLEM")) && problems.length === 0;
console.log(ready ? "\nReady." : "\nNot ready yet. Fix the lines marked PROBLEM and run this again.");
process.exit(ready ? 0 : 1);
