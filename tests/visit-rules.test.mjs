// Run with: npm test
// Tests the rules for logging a visit, with no database and no browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, checkVisit, isRealDate, MAX_NOTES } from "../lib/visitRules.ts";

const TODAY = "2026-11-15";

test("a real date in the past with notes passes", () => {
  const r = checkVisit({ date: "2026-10-19", notes: "Went early, the patio was empty" }, TODAY);
  assert.equal(r.ok, true);
  assert.deepEqual(r.visit, { date: "2026-10-19", notes: "Went early, the patio was empty" });
});

test("notes are optional and are trimmed", () => {
  assert.equal(checkVisit({ date: TODAY, notes: "" }, TODAY).visit.notes, "");
  assert.equal(checkVisit({ date: TODAY, notes: "   fun   " }, TODAY).visit.notes, "fun");
  assert.equal(checkVisit({ date: TODAY, notes: undefined }, TODAY).visit.notes, "");
});

test("today is fine, and so is one day of slack for time zones", () => {
  assert.equal(checkVisit({ date: TODAY }, TODAY).ok, true);
  assert.equal(checkVisit({ date: "2026-11-16" }, TODAY).ok, true);
});

test("anything further ahead is the future", () => {
  assert.equal(checkVisit({ date: "2026-11-17" }, TODAY).ok, false);
  assert.equal(checkVisit({ date: "2030-01-01" }, TODAY).ok, false);
});

test("a date that doesn't exist is refused", () => {
  for (const bad of ["2026-02-31", "2026-13-01", "2026-00-10", "2026-11-00", "2025-02-29"]) {
    assert.equal(isRealDate(bad), false, bad);
    assert.equal(checkVisit({ date: bad }, TODAY).ok, false, bad);
  }
  assert.equal(isRealDate("2024-02-29"), true, "a leap day is real");
});

test("a date in the wrong shape is refused", () => {
  for (const bad of ["11/15/2026", "2026-1-5", "yesterday", "2026-11-15T00:00:00Z", " ", "20261115"]) {
    assert.equal(checkVisit({ date: bad }, TODAY).ok, false, bad);
  }
});

test("a date long ago is refused", () => {
  assert.equal(checkVisit({ date: "0026-03-02" }, TODAY).ok, false);
  assert.equal(checkVisit({ date: "1999-12-31" }, TODAY).ok, false);
  assert.equal(checkVisit({ date: "2000-01-01" }, TODAY).ok, true);
});

test("notes have a limit", () => {
  assert.equal(checkVisit({ date: TODAY, notes: "a".repeat(MAX_NOTES) }, TODAY).ok, true);
  assert.equal(checkVisit({ date: TODAY, notes: "a".repeat(MAX_NOTES + 1) }, TODAY).ok, false);
});

test("values that aren't text never crash", () => {
  for (const bad of [null, undefined, 5, {}, ["2026-11-15"], true]) {
    assert.equal(checkVisit({ date: bad, notes: bad }, TODAY).ok, false);
  }
  assert.equal(checkVisit({ date: TODAY, notes: { $ne: 1 } }, TODAY).visit.notes, "", "non-text notes become empty");
});

test("addDays crosses month and year ends", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
});
