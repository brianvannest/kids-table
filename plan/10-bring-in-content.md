# Phase 10: bring in your content

Read `plan/00-app-plan.md`, `plan/08-data-model.md`, and `plan/09-connect-database.md` first. This phase does two jobs. It puts everything that makes the app yours into one settings file, and it lets the owner bring in a list from a spreadsheet, with a check before anything is saved.

## Goal

One settings file names the app and its lists. A CSV import page shows what would happen to every row, and saves nothing until the owner confirms.

## What to build

- `lib/settings.ts`: the app name, the tagline, what a restaurant and a visit are called, and the lists of areas, food types, and features. Each choice has a key (stored in the database) and a label (what people see). Use the lists in `plan/08-data-model.md`.
- Plain functions that check each row of a spreadsheet, in `lib/importRows.ts`, with tests. They need no database and no browser.
- `lib/restaurants.ts`: the only file that touches the restaurants collection. The database itself must refuse a second copy of the same restaurant, using a unique rule on the name and area.
- An import page at `/import`: choose a CSV file, see a preview, then confirm. Show the list of restaurants already in the database underneath.
- The sample files in the `data` folder: `sample-restaurants.csv` (clean) and `sample-restaurants-messy.csv`.
- The home page, the page titles, and the import page take every name from the settings file.

## The spreadsheet columns

`name` (required), `area`, `foodType`, `features` (separated by semicolons), `public` (yes or no), `lastChecked` (like 2026-11-02). Match column names loosely: `Food Type`, `food_type`, and `foodType` are the same column.

## What happens to each row

- **Ready.** Everything made sense. Quiet fixes are fine: capital letters, extra spaces, `Y` for yes, and dates written as 10/20/2026.
- **Warning.** The row has a name, but a cell couldn't be understood: an area, food type, or feature that isn't in the settings list, a yes-or-no that isn't one, or a date that can't be read or is in the future. By default these rows are not imported. The owner can choose to import them anyway, with those cells left blank.
- **Skipped.** There's no name, or the same place appears twice in the file, or it's already in the database.

## Rules for this phase

- Nothing is saved at the preview step.
- The server checks the file again when the owner confirms. Never trust the rows the browser sends. Check the type, and cap the file at about 200 KB and 500 rows.
- Match the same place by name and area, ignoring capital letters and punctuation.
- A server action can be called by anyone, not only from the page. **Until sign-in exists, the import must refuse to run on the live site.** Chapter 12 replaces that with "only the owner".
- Use the owner's words for every message. No jargon.
- Don't use my real database for tests. Use the sample files.
- Tell me what each command does before you run it.

## Done when

- `npm test` passes.
- The messy sample shows 4 ready, 4 with warnings, and 2 skipped.
- Importing the clean sample puts 8 restaurants in the list.
- Changing only `lib/settings.ts` changes the app's name and wording.
- `/import` says it's switched off in a production build.
- `npm run lint` and `npm run build` both pass.

## Out of scope

Editing or deleting a single restaurant, photos, sign-in, and the public page. Those are later phases.
