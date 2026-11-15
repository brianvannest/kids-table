// Run with: npm test
// Tests the rules for reviews and for how fresh a listing is, with no database and no browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkReview, isDueForLook, monthsBefore, summarizeRatings, MAX_REVIEW_NOTE } from "../lib/reviewRules.ts";

test("a rating from 1 to 5 passes, as a number", () => {
  for (const r of ["1", "2", "3", "4", "5"]) {
    const result = checkReview({ rating: r, note: "" });
    assert.equal(result.ok, true, r);
    assert.equal(result.review.rating, Number(r));
  }
});

test("anything that isn't a single digit from 1 to 5 is refused", () => {
  for (const bad of ["0", "6", "10", "4/5", "great!", "4.5", "4.0", " 4", "4 ", "04", "-1", "4e0", "", "five", "⭐⭐⭐⭐"]) {
    assert.equal(checkReview({ rating: bad, note: "" }).ok, false, JSON.stringify(bad));
  }
});

test("values that aren't text never crash", () => {
  for (const bad of [null, undefined, 4, {}, ["4"], true]) {
    assert.equal(checkReview({ rating: bad, note: "" }).ok, false);
  }
  assert.equal(checkReview({ rating: "4", note: { $ne: 1 } }).review.note, "");
});

test("the note is optional, trimmed, and limited", () => {
  assert.equal(checkReview({ rating: "4", note: "  Loved the tots.  " }).review.note, "Loved the tots.");
  assert.equal(checkReview({ rating: "4", note: undefined }).review.note, "");
  assert.equal(checkReview({ rating: "4", note: "a".repeat(MAX_REVIEW_NOTE) }).ok, true);
  assert.equal(checkReview({ rating: "4", note: "a".repeat(MAX_REVIEW_NOTE + 1) }).ok, false);
});

test("the average is to one decimal place, with the count", () => {
  assert.deepEqual(summarizeRatings([4, 5, 4]), { count: 3, average: 4.3 });
  assert.deepEqual(summarizeRatings([3, 3]), { count: 2, average: 3 });
  assert.deepEqual(summarizeRatings([5]), { count: 1, average: 5 });
  assert.deepEqual(summarizeRatings([]), { count: 0, average: null });
});

test("the average ignores anything that isn't a rating", () => {
  assert.deepEqual(summarizeRatings([5, 0, 9, 4.5, NaN, 3]), { count: 2, average: 4 });
});

test("six months before a date keeps the day, or the month's last day", () => {
  assert.equal(monthsBefore("2026-11-15", 6), "2026-05-15");
  assert.equal(monthsBefore("2026-08-31", 6), "2026-02-28");
  assert.equal(monthsBefore("2024-08-31", 6), "2024-02-29");
  assert.equal(monthsBefore("2026-03-10", 6), "2025-09-10");
  assert.equal(monthsBefore("2026-01-01", 12), "2025-01-01");
});

test("a place is due for a fresh look after six months, or if it was never checked", () => {
  const today = "2026-11-15";
  assert.equal(isDueForLook("2026-04-10", today), true, "Sunny Side Syrup House");
  assert.equal(isDueForLook("2026-06-01", today), false, "Little Lighthouse Cafe");
  assert.equal(isDueForLook("2026-11-02", today), false);
  assert.equal(isDueForLook("2026-05-15", today), false, "exactly six months is not yet due");
  assert.equal(isDueForLook("2026-05-14", today), true);
  assert.equal(isDueForLook(null, today), true);
});
