// Run with: npm test
// What a stranger's web address can and can't ask for. No database, no browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { settings } from "../lib/settings.ts";
import { parseFilters, buildPublicFilter, hasFilters } from "../lib/publicFilters.ts";

test("no parameters: everything public, and nothing else", () => {
  const f = parseFilters({}, settings);
  assert.deepEqual(f, { q: "", area: null, foodType: null, features: [] });
  assert.deepEqual(buildPublicFilter(f), { public: true });
  assert.equal(hasFilters(f), false);
});

test("good values are kept", () => {
  const f = parseFilters({ q: " Pony  burg ", area: "heights", food: "burgers", feature: ["patio", "playground"] }, settings);
  assert.deepEqual(f, { q: "Pony burg", area: "heights", foodType: "burgers", features: ["patio", "playground"] });
  const filter = buildPublicFilter(f);
  assert.equal(filter.public, true);
  assert.equal(filter.area, "heights");
  assert.equal(filter.foodType, "burgers");
  assert.deepEqual(filter.features, { $all: ["patio", "playground"] });
  assert.deepEqual(filter.$and, [{ nameKey: { $regex: "pony" } }, { nameKey: { $regex: "burg" } }]);
  assert.equal(hasFilters(f), true);
});

test("values that aren't on the settings lists are thrown away", () => {
  const f = parseFilters({ area: "atlantis", food: "<script>", feature: ["patio", "rooftop", "patio"] }, settings);
  assert.equal(f.area, null);
  assert.equal(f.foodType, null);
  assert.deepEqual(f.features, ["patio"]);
});

test("no parameter can ask for private places or add its own filter", () => {
  const f = parseFilters(
    { public: "false", $where: "sleep(5000)", nameKey: "x", "q[$ne]": "", createdBy: "someone", feature: "patio" },
    settings,
  );
  const filter = buildPublicFilter(f);
  assert.equal(filter.public, true);
  assert.deepEqual(Object.keys(filter).sort(), ["features", "public"]);
});

test("search text can't smuggle in a pattern", () => {
  const nasty = ["(.*)+$ [a-z]* \\", "a.b*c", "^^^", "\d{1,1000}", "(a+)+b", "x|y"];
  for (const q of nasty) {
    const filter = buildPublicFilter(parseFilters({ q }, settings));
    for (const part of filter.$and ?? []) {
      // Only plain letters and numbers ever reach the database as a search term.
      assert.match(part.nameKey.$regex, /^[a-z0-9]+$/, `unsafe term from: ${q}`);
    }
  }
  assert.equal(buildPublicFilter(parseFilters({ q: "^^^ $$$" }, settings)).$and, undefined);
});

test("long search text is cut off, and only the first few words count", () => {
  const f = parseFilters({ q: "x".repeat(500) }, settings);
  assert.equal(f.q.length, 60);
  const g = parseFilters({ q: "a b c d e f g h i j" }, settings);
  assert.equal(buildPublicFilter(g).$and.length, 6);
});

test("a repeated parameter uses its first value", () => {
  const f = parseFilters({ area: ["katy", "heights"], q: ["one", "two"] }, settings);
  assert.equal(f.area, "katy");
  assert.equal(f.q, "one");
});
