# Phase 14: keep your own records

Read `plan/00-app-plan.md`, `plan/08-data-model.md`, `plan/12-add-sign-in.md`, `plan/13-members-area.md`, `plan/design-system.md`, and `plan/screen-checklist.md` first. This phase lets each member log their visits to a restaurant, and keeps those visits private to the person who logged them.

## Goal

An approved member can log a visit (a date and optional notes) on any restaurant's page, see their own visits there and on a "My visits" page, and delete one. Nobody else can see, change, or delete a person's visits. That includes the owner.

## What to build

- **The rules as plain functions with tests,** in `lib/visitRules.ts`: the date must be a real calendar date written YYYY-MM-DD ("2026-02-31" is not one), not in the future, and not before the year 2000. Notes are optional, trimmed, and limited to 500 characters. Values that aren't text must never crash it. Compare against the server's date in UTC, with one day of slack so a person whose evening is already tomorrow in UTC isn't refused.
- **A `visits` collection,** with one document per visit: who logged it, which restaurant, the date as text (a visit is a day, not a moment), the notes, and when it was saved. Add an index on who, restaurant, and date.
- **Database functions in `lib/visits.ts`.** Every function takes the signed-in person's id, and every query starts from it. There must be no function that reads another person's visits. A place's id and a visit's id are checked for the exact shape of a real id before they go into a query.
- **On each restaurant's page, a "Your visits" section:** this person's visits to that place, newest first, a Delete button on each that asks first, and a form to log another. The date starts as today on the person's own clock (worked out in the browser, not on the server) and can't be picked in the future. The notes box says only the person can see it.
- **A "My visits" page and header link:** every visit this person has logged, newest first, with the restaurant's name linked.
- **The actions check for themselves** that the caller is an approved member. The person a visit belongs to comes from the signed-in person, never from the form. Deleting uses the person's id in the query, so another person's visit id deletes nothing. A refused form keeps the notes the person typed, and a saved one clears them.

## Rules for this phase

- A visit is private. No page, query, or action may show or change someone else's visit, and the owner is someone else.
- Check who's calling inside every server action. Treat every value from the browser as untrusted: dates, notes, ids, and any extra field added to the form.
- Everything that shows notes must show them as plain text. The page and the raw HTML sent to another member must not contain them.
- No new color or shape: use the design system. One tomato button per screen.
- Tell me what each command does before you run it. Use the demo data, not my real database.

## Done when

- `npm test` passes, including the visit rules.
- With the demo data, each of Priya, Dana, and Marcus sees exactly their own four visits on My visits, and none of anyone else's notes, in the page or in the raw HTML. A stranger's home page contains none of the notes.
- A place's page shows only the signed-in person's visits to it.
- A visit logged through the form is saved under the signed-in person, even if the form is changed to say another person.
- An impossible date, a date from the year 26, a far-future date, no date, notes over the limit, a place that doesn't exist, and a place id of the wrong shape each save nothing.
- Replaying the log or delete action with no sign-in, while waiting, as another member, or as the owner, changes nothing. Replaying them as the person who owns the visit works (so the refusals are real).
- At 390px wide there's no sideways scroll, and an accessibility scan finds nothing.
- `npm run lint` and `npm run build` pass.

## Out of scope

Editing a visit, reviews, ratings, photos, and showing counts of visits to other people. Those come later or not at all.
