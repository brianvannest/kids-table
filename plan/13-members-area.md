# Phase 13: open up the members' area

Read `plan/00-app-plan.md`, `plan/08-data-model.md`, `plan/11-public-page.md`, `plan/12-add-sign-in.md`, `plan/design-system.md`, and `plan/screen-checklist.md` first. This phase gives approved members a place to see every restaurant, including the ones that aren't public, and to add new ones.

## Goal

Approved members can list and search every restaurant, open one, and add a new one by searching first. Strangers and people who are still waiting can do none of it. Photos are not part of this phase.

## What to build

- **A members-only list at `/places`.** It shows every restaurant, private ones included, each marked "Members only" if it isn't public. It uses the same search and filters as the public page, and its choices offer every item from the settings file. Anyone who isn't an approved member is sent away before the database is asked for anything.
- **The member filter, as a plain function with tests,** in `lib/publicFilters.ts`. It must start from the public filter and remove only the "public" condition, so a search means exactly the same thing in both places, and an address still can't add conditions of its own.
- **One restaurant's page at `/places/[id]`.** It shows the name, area, food, features, whether it's public, and when it was last checked. An id that isn't a real id, or that matches nothing, shows the not-found page. Never put the id into a database query before checking its shape.
- **Search-first adding at `/places/new`.** The person types a name first. The page shows places that match ("Is it one of these?"). Only if they choose "None of these" does the add form appear, with the name filled in.
- **The add form:** name, area, food, and features. Area and food are required and chosen from the lists. Features are chosen too. A new place always starts as members-only, and the form can't change that.
- **The checks as plain functions with tests,** in `lib/newPlace.ts`: tidy the name, require letters or numbers, limit its length, require an area and food that are on the lists, refuse any feature that isn't, and cope with values that aren't text.
- **The add action checks for itself** that the caller is an approved member. It sets "who added it" from the signed-in person, never from the form. The same name in the same area is refused by the database's unique index, and the answer links to the place that already exists. The same name in another area is a different place.
- **Keep what the person typed** when the form shows an error. React clears a form after an action, so send the answers back and start the fields from them.
- **A "Places" link in the header** for approved members.

## Rules for this phase

- Check who's calling inside every server action. Don't rely on the form being hidden.
- Treat every value from the browser as untrusted: ids, text, and anything extra that gets added to the form.
- The public page must still show only public places, even to a signed-in member.
- No new color or shape: use the design system. One tomato button per screen.
- Tell me what each command does before you run it. Use the demo data, not my real database.

## Done when

- `npm test` passes, including the new tests.
- A stranger and a waiting person are sent away from `/places`, `/places/new`, and any place's page.
- A member sees all eight demo places, with the three private ones marked, and a filter for Play area finds three places.
- The public page, signed in as a member, still shows only the five public places.
- Searching "zigzag" on the add page offers Zigzag Zebra Pizzeria. A name nothing matches offers the form.
- An empty area, an area that isn't on the list, and extra fields added to the form do nothing. A valid place is saved as members-only, added by the signed-in member.
- The same place again (any capitals, any extra spaces) is refused with a link. The same name in another area is saved.
- Replaying the add action with no sign-in, or while waiting, saves nothing. Replaying it as the member does save (so the refusals are real).
- At 390px wide there's no sideways scroll, and an accessibility scan finds nothing.
- `npm run lint` and `npm run build` pass.

## Out of scope

Photos, reviews, visits, changing a place after it's added, and the owner choosing what's public. Those come later.
