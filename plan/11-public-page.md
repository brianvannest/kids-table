# Phase 11: build the public page

Read `plan/00-app-plan.md`, `plan/08-data-model.md`, `plan/10-bring-in-content.md`, `plan/design-system.md`, and `plan/screen-checklist.md` first. This phase builds the page anyone can open, and sets the look every later screen will use.

## Goal

The home page lists the restaurants the owner marked public, with a search box and filters, and no sign-in. It has the app's design, and it shows nothing a stranger shouldn't see.

## What to build

- **The design first.** Put the tokens from `plan/design-system.md` into `app/globals.css`, with Tailwind's default palette removed. Load Hanken Grotesk. Light only. If there's a logo file in `public`, use it in the header exactly as it is.
- **The pieces,** in `components/ui`: `SiteHeader`, `TextField`, `Select`, `Chip`, `TagPill`, `Button`, `Card`, `Notice`, and `Skeleton`. Build only these now.
- **The filter logic,** in `lib/publicFilters.ts`, as plain functions with tests. The web address is typed by strangers, so every value is checked against the lists in the settings file, and anything else is thrown away. Only `q`, `area`, `food`, and `feature` mean anything. The filter always includes `public: true`, and no address value can change that. Search matches every word typed against the stored name key.
- **The database query,** in `lib/restaurants.ts`. It returns only name, area, food type, and features. It never returns the database id, the public flag, the last-checked date, who added it, or photos. Choices in the filters come from the public places only.
- **The home page.** The heading is built ahead of time. The search form and the results depend on the web address and the database, so they go inside `<Suspense>`. The form is a plain GET form using `next/form`, and its one button is the only way to submit. Chips are checkboxes. Features use "has every feature you pick".
- **The states:** loading, "nothing is public yet", "nothing matches" (with a Clear filters link), and "the list isn't available right now".
- **Restyle** the import page and the status page with the same pieces and tokens. In production, the status page says only "Connected" or "Not connected". Both pages tell search engines not to list them.
- **Tests** for the design rules and for the filter functions.

## Rules for this phase

- Show only places that are public. Show no photos, no reviews, no ratings, no visits, and no names of people.
- Nothing submits by itself. Controls are labeled, at least 44px tall, with 16px text.
- One tomato button on the screen.
- Tell me what each command does before you run it.
- Use the demo data. Don't use my real database.

## Done when

- `npm test` passes, including the design tests.
- With the demo data, the page shows the five public restaurants, and none of the three private ones.
- Searching for a private restaurant's name finds nothing.
- A filtered page's address can be shared and gives the same list.
- On a production build, the page's HTML contains none of the private places, none of the people, and none of the words `lastChecked`, `createdBy`, `photos`, or `public`.
- At 390px wide there's no sideways scroll, and the whole page works from the keyboard.
- `npm run lint` and `npm run build` pass.

## Out of scope

Sign-in, photos, reviews, and any change to the data. Those are later phases.
