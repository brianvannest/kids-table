// Run with: npm test
// Tests the spreadsheet checks on their own: no database, no browser. Node runs the TypeScript
// files directly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import { settings } from "../lib/settings.ts";
import { checkRows, countByStatus, nameKeyOf } from "../lib/importRows.ts";

const TODAY = "2026-11-15";

function reportsFor(file) {
  const text = readFileSync(new URL(`../data/${file}`, import.meta.url), "utf8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: "greedy" });
  return checkRows(parsed.data, settings, TODAY);
}

test("the clean sample file is all ready, 8 places", () => {
  const reports = reportsFor("sample-restaurants.csv");
  assert.deepEqual(countByStatus(reports), { ready: 8, warning: 0, skipped: 0 });
  const zebra = reports[0].draft;
  assert.equal(zebra.name, "Zigzag Zebra Pizzeria");
  assert.equal(zebra.area, "heights");
  assert.equal(zebra.foodType, "pizza");
  assert.deepEqual(zebra.features, ["patio", "playground"]);
  assert.equal(zebra.public, true);
  assert.equal(zebra.lastChecked, "2026-11-02");
});

test("the messy sample file: 4 ready, 4 warnings, 2 skipped", () => {
  const reports = reportsFor("sample-restaurants-messy.csv");
  assert.deepEqual(countByStatus(reports), { ready: 4, warning: 4, skipped: 2 });
  const byLine = Object.fromEntries(reports.map((r) => [r.line, r]));
  // Sloppy but understandable cells are fixed quietly.
  assert.equal(byLine[2].status, "ready");
  assert.equal(byLine[2].draft.area, "heights");
  assert.equal(byLine[2].draft.public, true);
  assert.equal(byLine[3].status, "ready");
  assert.equal(byLine[3].draft.area, "katy");
  assert.equal(byLine[3].draft.lastChecked, "2026-10-20");
  // "kinda" is not a feature the group has decided on.
  assert.match(byLine[4].notes.join(" "), /playground \(kinda\)/);
  assert.deepEqual(byLine[4].draft.features, []);
  // A food type that isn't in the list, a date nobody can read, and a maybe.
  assert.match(byLine[6].notes.join(" "), /Brunch/);
  assert.equal(byLine[6].draft.foodType, null);
  assert.match(byLine[7].notes.join(" "), /sometime in October/);
  assert.equal(byLine[7].draft.lastChecked, null);
  assert.match(byLine[8].notes.join(" "), /maybe/);
  assert.equal(byLine[8].draft.public, false);
  // No name, and the same place twice.
  assert.equal(byLine[9].status, "skipped");
  assert.match(byLine[9].notes[0], /no name/i);
  assert.equal(byLine[10].status, "skipped");
  assert.match(byLine[10].notes[0], /line 2/);
});

test("dates: both formats work, impossible and future dates don't", () => {
  const row = (lastChecked) => checkRows([{ name: "A", lastChecked }], settings, TODAY)[0];
  assert.equal(row("2026-1-5").draft.lastChecked, "2026-01-05");
  assert.equal(row("3/2/2026").draft.lastChecked, "2026-03-02");
  assert.equal(row("2026-02-30").draft.lastChecked, null);
  assert.equal(row("2027-01-01").draft.lastChecked, null);
  assert.match(row("2027-01-01").notes[0], /future/);
});

test("header names are matched loosely", () => {
  const [r] = checkRows([{ Name: " Hayloft   Barbecue ", "Food Type": "BBQ", Last_Checked: "2026-11-05" }], settings, TODAY);
  assert.equal(r.status, "ready");
  assert.equal(r.draft.name, "Hayloft Barbecue");
  assert.equal(r.draft.foodType, "bbq");
});

test("two spellings of one place get the same key", () => {
  assert.equal(nameKeyOf("Zigzag Zebra Pizzeria"), nameKeyOf("  zigzag  zebra pizzeria! "));
});

test("a file saved by Excel (with an invisible byte-order mark) still finds the name column", () => {
  const text = "\uFEFFname,area,foodType,features,public,lastChecked\nMango Moon Tacos,Katy,Tacos,patio,yes,2026-10-20\n";
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: "greedy", delimiter: "," });
  assert.ok(parsed.meta.fields.some((f) => f.toLowerCase().replace(/[^a-z]/g, "") === "name"));
  const [r] = checkRows(parsed.data, settings, TODAY);
  assert.equal(r.status, "ready");
  assert.equal(r.draft.name, "Mango Moon Tacos");
});

test("semicolons inside the features cell don't confuse the column split", () => {
  const text = "name,features,public\nZigzag Zebra Pizzeria,patio;playground,yes\n";
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: "greedy", delimiter: "," });
  const [r] = checkRows(parsed.data, settings, TODAY);
  assert.deepEqual(r.draft.features, ["patio", "playground"]);
});
