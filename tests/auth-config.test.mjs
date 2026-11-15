// Run with: npm test
// Tests the check for whether sign-in is set up, with no database and no browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { authProblems, isAuthConfigured } from "../lib/authConfig.ts";

const secret = "x".repeat(40);
const good = { MONGODB_URI: "set", BETTER_AUTH_SECRET: secret, BETTER_AUTH_URL: "https://kids-table.vercel.app" };

test("everything set on the live site is ready", () => {
  assert.deepEqual(authProblems(good, true), []);
  assert.equal(isAuthConfigured(good, true), true);
});

test("on your own computer the address isn't needed", () => {
  assert.deepEqual(authProblems({ MONGODB_URI: "set", BETTER_AUTH_SECRET: secret }, false), []);
});

test("each missing setting is named", () => {
  assert.deepEqual(authProblems({ ...good, MONGODB_URI: "" }, true), ["database"]);
  assert.deepEqual(authProblems({ ...good, BETTER_AUTH_SECRET: undefined }, true), ["secret"]);
  assert.deepEqual(authProblems({ ...good, BETTER_AUTH_URL: "" }, true), ["address"]);
  assert.deepEqual(authProblems({}, true), ["database", "secret", "address"]);
});

test("a secret that is too short is refused", () => {
  assert.deepEqual(authProblems({ ...good, BETTER_AUTH_SECRET: "x".repeat(31) }, true), ["secret"]);
  assert.deepEqual(authProblems({ ...good, BETTER_AUTH_SECRET: "x".repeat(32) }, true), []);
  assert.deepEqual(authProblems({ ...good, BETTER_AUTH_SECRET: " ".repeat(40) }, true), ["secret"], "spaces don't count");
});

test("a real address must be https, and only your own computer may use http", () => {
  assert.deepEqual(authProblems({ ...good, BETTER_AUTH_URL: "http://kids-table.vercel.app" }, true), ["address"]);
  assert.deepEqual(authProblems({ ...good, BETTER_AUTH_URL: "kids-table.vercel.app" }, true), ["address"]);
  assert.deepEqual(authProblems({ ...good, BETTER_AUTH_URL: "http://localhost.evil.example" }, true), ["address"], "a lookalike isn't localhost");
  assert.deepEqual(authProblems({ ...good, BETTER_AUTH_URL: "http://localhost:3000" }, true), [], "trying the finished build on your own computer");
  assert.deepEqual(authProblems({ ...good, BETTER_AUTH_URL: "http://127.0.0.1:3000" }, true), []);
  assert.deepEqual(authProblems({ ...good, BETTER_AUTH_URL: "http://localhost:3000" }, false), []);
});

test("the answer never contains a setting's value", () => {
  const out = JSON.stringify(authProblems({ MONGODB_URI: "super-secret-uri", BETTER_AUTH_SECRET: "short-secret", BETTER_AUTH_URL: "nope" }, true));
  assert.equal(out.includes("super-secret-uri") || out.includes("short-secret") || out.includes("nope"), false);
});
