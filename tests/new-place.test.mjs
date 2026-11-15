// Run with: npm test
// Tests the checks on a new place a member typed in, and the member version of the search filter.
import { test } from "node:test";
import assert from "node:assert/strict";
import { settings } from "../lib/settings.ts";
import { checkNewPlace } from "../lib/newPlace.ts";
import { buildMemberFilter, buildPublicFilter, parseFilters } from "../lib/publicFilters.ts";

const good = { name: "Pickle Pony Burgers", area: "heights", foodType: "burgers", features: ["patio", "playground"] };

test("a complete place passes, with the name tidied", () => {
  const r = checkNewPlace({ ...good, name: "  Pickle   Pony  Burgers " }, settings);
  assert.equal(r.ok, true);
  assert.deepEqual(r.place, good);
});

test("a name is required, and must have a letter or number", () => {
  assert.equal(checkNewPlace({ ...good, name: "   " }, settings).ok, false);
  assert.equal(checkNewPlace({ ...good, name: "!!!" }, settings).ok, false);
  assert.equal(checkNewPlace({ ...good, name: "7-Eleven" }, settings).ok, true);
});

test("a name that is too long is refused", () => {
  assert.equal(checkNewPlace({ ...good, name: "a".repeat(81) }, settings).ok, false);
  assert.equal(checkNewPlace({ ...good, name: "a".repeat(80) }, settings).ok, true);
});

test("area and food must be chosen from the lists", () => {
  assert.equal(checkNewPlace({ ...good, area: "" }, settings).ok, false);
  assert.equal(checkNewPlace({ ...good, area: "mars" }, settings).ok, false);
  assert.equal(checkNewPlace({ ...good, foodType: "Pizza" }, settings).ok, false, "the label isn't the key");
  assert.equal(checkNewPlace({ ...good, foodType: "" }, settings).ok, false);
});

test("an unknown feature is refused, and a repeated one is counted once", () => {
  assert.equal(checkNewPlace({ ...good, features: ["patio", "pool"] }, settings).ok, false);
  const r = checkNewPlace({ ...good, features: ["patio", "patio"] }, settings);
  assert.deepEqual(r.place.features, ["patio"]);
  assert.deepEqual(checkNewPlace({ ...good, features: [] }, settings).place.features, []);
});

test("values that aren't text are refused or ignored, never crash", () => {
  for (const bad of [null, undefined, 5, {}, ["x"], true]) {
    assert.equal(checkNewPlace({ name: bad, area: bad, foodType: bad, features: bad }, settings).ok, false);
  }
  assert.deepEqual(checkNewPlace({ ...good, features: "patio" }, settings).place.features, [], "features must arrive as a list");
  assert.equal(checkNewPlace({ ...good, features: [{ $ne: 1 }] }, settings).ok, false);
});

test("the member filter is the public filter without the public condition", () => {
  const filters = parseFilters({ q: "pony burg", area: "heights", feature: ["patio"] }, settings);
  const pub = buildPublicFilter(filters);
  const mem = buildMemberFilter(filters);
  assert.equal(pub.public, true);
  assert.equal("public" in mem, false);
  const rest = { ...pub };
  delete rest.public;
  assert.deepEqual(mem, rest, "everything else is identical");
});

test("an address still can't smuggle anything into the member filter", () => {
  const filters = parseFilters({ q: "x", public: "false", "q[$ne]": "x", area: ["heights", "katy"] }, settings);
  const mem = buildMemberFilter(filters);
  assert.deepEqual(Object.keys(mem).sort(), ["$and", "area"]);
});
