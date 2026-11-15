// Run with: npm test
// Keeps the design consistent as screens are added. See docs in plan/screen-checklist.md.
//   1. Every color is a token in app/globals.css, and nothing else defines one.
//   2. Every approved text-on-background pair is readable (WCAG contrast).
//   3. The public query returns only the fields a stranger may see.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLIC_FIELDS, publicProjection, simplify as simplifyForSearch } from "../lib/publicFilters.ts";
import { simplify as simplifyForImport } from "../lib/importRows.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const css = readFileSync(join(root, "app/globals.css"), "utf8");

// ---- Tokens ------------------------------------------------------------------------------------
const tokens = Object.fromEntries([...css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6});/g)].map((m) => [m[1], m[2]]));

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(tokens[a]), luminance(tokens[b])].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test("the tokens are all there", () => {
  for (const name of ["tomato", "teal", "cream", "card", "line", "ink", "muted", "tomato-soft", "teal-soft", "white", "edge", "tomato-dark", "teal-dark", "sun-soft", "sand"]) {
    assert.ok(tokens[name], `missing token: ${name}`);
  }
});

// [text or border color, background, minimum ratio, why]
const PAIRS = [
  ["ink", "cream", 4.5, "body text on the page"],
  ["ink", "card", 4.5, "text on cards and inputs"],
  ["ink", "teal-soft", 4.5, "text on info and success notices"],
  ["ink", "tomato-soft", 4.5, "text on error notices"],
  ["ink", "sun-soft", 4.5, "text on warning notices"],
  ["ink", "sand", 4.5, "text in table headers"],
  ["muted", "cream", 4.5, "secondary text on the page"],
  ["muted", "card", 4.5, "secondary text on cards"],
  ["teal", "cream", 4.5, "links on the page"],
  ["teal", "card", 4.5, "links and chip text on white"],
  ["teal", "teal-soft", 4.5, "feature tag text"],
  ["white", "tomato", 4.5, "the primary button"],
  ["white", "tomato-dark", 4.5, "the primary button on hover"],
  ["white", "teal", 4.5, "a selected chip"],
  ["white", "teal-dark", 4.5, "a selected chip on hover"],
  ["teal-dark", "cream", 4.5, "link hover"],
  ["tomato", "tomato-soft", 4.5, "error icon"],
  ["edge", "cream", 3, "the border of a control on the page (WCAG 1.4.11)"],
  ["edge", "card", 3, "the border of a control on a card"],
];

for (const [fg, bg, min, why] of PAIRS) {
  test(`contrast: ${fg} on ${bg} is at least ${min}:1 (${why})`, () => {
    const ratio = contrast(fg, bg);
    assert.ok(ratio >= min, `${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${min}:1`);
  });
}

test("the sheet's line color is never used as a control border", () => {
  // `line` is for cards and dividers. Controls use `edge`. Their boundary has to be visible.
  assert.ok(contrast("line", "cream") < 3, "the line color is too faint to mark a control");
});

// ---- No stray styles ----------------------------------------------------------------------------
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (name === "node_modules" || name === ".next") return [];
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const sourceFiles = ["app", "components", "lib"].flatMap((d) => walk(join(root, d))).filter((f) => /\.(ts|tsx)$/.test(f));
const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

const PALETTE = "slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const RULES = [
  [/#[0-9a-fA-F]{3,8}\b/, "a hex color (use a token from globals.css)"],
  [new RegExp(`\\b(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline|accent|decoration)-(?:${PALETTE})-\\d{2,3}\\b`), "a default Tailwind palette color (the palette is removed)"],
  [/\b(?:bg|text|border)-(?:black)\b/, "black (use ink)"],
  [/\bfont-(?:thin|extralight|light|normal|semibold|black)\b/, "a font weight the app doesn't load (use medium, bold, or extrabold)"],
  [/\btext-(?:xs|\[(?:[0-9]|1[0-2])(?:\.\d+)?px\])/, "text smaller than 13px"],
];

for (const [pattern, what] of RULES) {
  test(`no source file uses ${what}`, () => {
    const hits = [];
    for (const file of sourceFiles) {
      const code = stripComments(readFileSync(file, "utf8"));
      const match = code.match(pattern);
      if (match) hits.push(`${relative(root, file)}: ${match[0]}`);
    }
    assert.deepEqual(hits, []);
  });
}

test("only chips and tags are fully round", () => {
  const hits = sourceFiles
    .filter((f) => !/(Chip|TagPill)\.tsx$/.test(f))
    .filter((f) => /rounded-full/.test(stripComments(readFileSync(f, "utf8"))))
    .map((f) => relative(root, f));
  assert.deepEqual(hits, []);
});

// ---- Public data ------------------------------------------------------------------------------
test("the public projection returns exactly the allowed fields", () => {
  const projection = publicProjection();
  assert.equal(projection._id, 0, "the database id must be left out");
  const included = Object.keys(projection).filter((k) => projection[k] === 1).sort();
  assert.deepEqual(included, [...PUBLIC_FIELDS].sort());
  for (const secret of ["public", "lastChecked", "createdBy", "createdAt", "photos"]) {
    assert.ok(!(secret in projection), `${secret} must never be in the public projection`);
  }
});

test("the search and import code agree on how a name is simplified", () => {
  for (const text of ["Zigzag Zebra Pizzeria", "  pickle PONY burgers!! ", "Sunny-Side Syrup House", "Cafeé #1", "", "a.b*c"]) {
    assert.equal(simplifyForSearch(text), simplifyForImport(text), `different for: ${JSON.stringify(text)}`);
  }
});
