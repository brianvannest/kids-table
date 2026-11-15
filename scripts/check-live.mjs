// A final check of a running copy of the app, from the outside, the way a stranger would see it.
//
//   npm run check:live -- https://your-app.vercel.app
//   npm run check:live -- https://your-app.vercel.app --private "The Spotted Spoon,Dandelion Dumpling House"
//   npm run check:live -- http://localhost:3000 --local
//
// It only sends ordinary requests. It never makes an account and never prints a secret. It does
// send several wrong sign-ins on purpose, to prove the guess limit works, so your own sign-in from
// this computer will say "too many tries" for about a minute afterwards.
//
//   --private "A,B"   names of private places. They must not appear anywhere on the public page.
//   --local           skip the one check that only makes sense on the real host (see below).

const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? "").replace(/\/$/, "");
const local = args.includes("--local");
// Only read the names if --private was given. (indexOf is -1 when it isn't, and args[0] would be the address.)
const privateAt = args.indexOf("--private");
const privateNames = (privateAt >= 0 ? (args[privateAt + 1] ?? "") : "").split(",").map((s) => s.trim()).filter(Boolean);
if (!base) {
  console.error('Give the address to check, for example: npm run check:live -- https://your-app.vercel.app');
  process.exit(2);
}

const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "OK     " : "PROBLEM"}  ${name}${detail ? "  (" + detail + ")" : ""}`);
};
const get = (path, init = {}) => fetch(base + path, { redirect: "manual", ...init });
const textOf = (html) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

// 1. The public page loads and has its list.
const home = await get("/");
const homeHtml = await home.text();
check("The public page loads", home.status === 200, String(home.status));
check("The public page is showing its list, not an error", !/list isn.t available|isn&#x27;t available|isn&apos;t available/.test(homeHtml), "if this fails, the settings aren't in yet");

// 2. Headers.
const wanted = ["x-content-type-options", "x-frame-options", "content-security-policy", "referrer-policy", "permissions-policy"];
const missing = wanted.filter((h) => !home.headers.get(h));
check("The security headers are on", missing.length === 0, missing.length ? "missing: " + missing.join(", ") : "");
check("The page doesn't announce which framework it uses", !home.headers.get("x-powered-by"));

// 3. Signed out, every private page sends you to sign in.
for (const path of ["/members", "/import", "/places", "/places/new", "/visits"]) {
  const r = await get(path);
  const to = r.headers.get("location") ?? "";
  check(`Signed out, ${path} sends you to sign in`, [301, 302, 303, 307, 308].includes(r.status) && to.includes("/sign-in"), `${r.status} ${to}`);
}

// 4. The sign-in system answers, and says nothing about itself.
const session = await get("/api/auth/get-session");
check("Nobody is signed in, and the sign-in system says so", session.status === 200 && (await session.text()).trim() === "null", String(session.status));
const status = textOf(await (await get("/status")).text());
check("The status page says only Connected or Not connected", /Connected|Not connected/.test(status) && !/MONGODB|cluster|mongodb\.net|kidstable/i.test(status));

// 5. A sign-in sent from another website is refused.
const bad = JSON.stringify({ email: "launch-check@example.com", password: "not a real password" });
const evil = await get("/api/auth/sign-in/email", { method: "POST", headers: { "content-type": "application/json", origin: "https://evil.example" }, body: bad });
// If this computer was already stopped by the guess limit (for example, you ran this check a moment
// ago), the limit answers first, and these two checks can't be answered. Say so instead of failing.
const limited = evil.status === 429;
if (limited) console.log("SKIPPED  A sign-in sent from another website is refused  (the guess limit is holding this computer right now. Wait a minute and run it again)");
else check("A sign-in sent from another website is refused", evil.status === 403, String(evil.status));

// 6. Wrong passwords: the same plain answer each time, then the limit.
const codes = [];
for (let i = 0; i < 8; i++) {
  const r = await get("/api/auth/sign-in/email", { method: "POST", headers: { "content-type": "application/json", origin: base }, body: bad });
  codes.push(r.status);
}
if (limited) console.log("SKIPPED  A wrong password gets a plain 'no', never an error  (the guess limit is holding this computer right now)");
else check("A wrong password gets a plain 'no', never an error", codes[0] === 401, String(codes[0]));
check("Too many wrong guesses from one address are stopped", codes.includes(429), codes.join(" "));

// 7. The limit can't be dodged by changing a header. This only means something on the real host,
// which decides the visitor's address itself. On your own computer there's no host to do that.
if (local) {
  console.log("SKIPPED  Changing a header doesn't dodge the guess limit  (--local: only the real host can answer this)");
} else {
  const after = [];
  for (let i = 0; i < 4; i++) {
    const r = await get("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json", origin: base, "x-forwarded-for": `203.0.113.${10 + i}`, "x-real-ip": `203.0.113.${50 + i}` },
      body: bad,
    });
    after.push(r.status);
  }
  check("Changing a header doesn't dodge the guess limit", after.every((c) => c === 429), after.join(" "));
}

// 8. Private places never appear on the public page.
if (privateNames.length) {
  // A search echoes what you typed back into the search box, so searching for a whole name would
  // put the name on the page for an innocent reason. Search for its longest word instead, and look
  // for the whole name.
  const pages = [homeHtml];
  for (const n of privateNames) {
    const word = n.split(/\s+/).sort((a, b) => b.length - a.length)[0];
    pages.push(await (await get("/?q=" + encodeURIComponent(word))).text());
  }
  const leaked = privateNames.filter((n) => pages.some((p) => p.includes(n)));
  check("No private place appears on the public page, or in a search for its name", leaked.length === 0, leaked.length ? "found: " + leaked.join(", ") : "");
} else {
  console.log('SKIPPED  Private places stay private  (add --private "Name One,Name Two" to check)');
}

const failed = results.filter((x) => !x).length;
console.log(failed === 0 ? `\nAll ${results.length} checks passed.` : `\n${failed} of ${results.length} checks found a problem.`);
process.exit(failed ? 1 : 0);
