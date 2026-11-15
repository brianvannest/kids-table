# Phase 15: share with your group

Read `plan/00-app-plan.md`, `plan/08-data-model.md`, `plan/12-add-sign-in.md`, `plan/13-members-area.md`, `plan/14-visits.md`, `plan/design-system.md`, and `plan/screen-checklist.md` first. This phase adds the group's reviews, and gives the owner control over what a stranger can see.

## Goal

Every approved member can write one review per restaurant, and read everyone else's. The group's average rating shows on each restaurant and in the list. The owner can show a restaurant on the public page or take it off, and can see which restaurants are due for a fresh look. The public page never shows reviews.

## What to build

- **The rules as plain functions with tests,** in `lib/reviewRules.ts`: a rating is exactly one digit from 1 to 5, as text, and nothing else ("4/5", "great!", "4.5", "0", "6", " 4", and "04" are all refused). The note is optional, trimmed, and limited to 500 characters. Values that aren't text must never crash it. Also: the group average to one decimal place with the count, and "due for a fresh look" meaning the place was last checked more than six months ago, or never.
- **A `reviews` collection** with one document per review: which restaurant, who wrote it, the rating, the note, and when it was created and last changed. Add a unique index on restaurant and person, so the database itself refuses a second review by the same person. Saving again replaces the first, and keeps the original created time. If two saves arrive at the same moment, retry once.
- **Database functions in `lib/reviews.ts`.** Reviews by a person who has been removed are hidden and left out of every average. If the person is let back in, their reviews return. A place's id is checked for the exact shape of a real id before it goes into a query.
- **On each restaurant's page, "What the group thinks":** the average and count, then every visible review with the writer's name and rating, with the signed-in person's marked "(you)". Below it, the person's own review form. It starts blank, or from their existing review. Saving a second time replaces it. They can delete their own review, after a confirmation. Notes show as plain text.
- **In the list,** each restaurant shows its average and review count, if it has any.
- **Owner controls on a restaurant's page,** visible only to the owner: show on the public page or take off, with a plain statement of what the public sees, and "Mark as checked today". In the list, only the owner sees a "Due for a fresh look" tag.
- **The actions check for themselves.** The review actions need an approved member. The owner actions need the owner. The person a review belongs to is the signed-in person, never a value from the form. The visibility action accepts only "yes" or "no". Deleting a review deletes only the caller's own.

## Rules for this phase

- The public page never shows a review, a rating, a note, or a visit, even for a restaurant the owner has made public.
- Check who's calling inside every server action. Treat every value from the browser as untrusted: ratings, notes, ids, and any extra field added to the form.
- No new color or shape: use the design system. One tomato button per screen.
- Tell me what each command does before you run it. Use the demo data, not my real database.

## Done when

- `npm test` passes, including the review rules.
- With the demo data, Zigzag Zebra Pizzeria shows "4.3 out of 5 from 3 reviews", and Mango Moon Tacos shows "4 out of 5 from 3 reviews".
- Saving a review twice leaves one review, with the new rating and the original created time.
- Each bad rating ("4/5", "great!", "0", "6", "4.5", none, a script), a note over the limit, a place that doesn't exist, and an id of the wrong shape saves nothing.
- A note containing HTML is shown as text and doesn't run.
- Replaying the review actions signed out or while waiting changes nothing. Replaying as the member works, and saves under that member even if the form names someone else. Delete removes only the caller's own review.
- A removed member's reviews disappear from the page and the averages, and return when they are let back in.
- A member, someone waiting, and a stranger can't show a place on the public page or mark it checked, even by sending the request by hand. The owner can. Anything other than "yes" or "no", and a bad id, does nothing.
- After the owner shows a place publicly, a stranger sees its name and features and no review text or rating. Taking it off removes it again.
- With the demo data, exactly one place is due for a fresh look: Sunny Side Syrup House. Marking it checked clears it. A member never sees the tag.
- At 390px wide there's no sideways scroll, and an accessibility scan finds nothing.
- `npm run lint` and `npm run build` pass.

## Out of scope

Editing or hiding someone else's review, replies, photos, and a public view of ratings. Those aren't built.
