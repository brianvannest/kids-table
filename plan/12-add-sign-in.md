# Phase 12: add sign-in, with the owner's approval

Read `plan/00-app-plan.md`, `plan/08-data-model.md`, `plan/11-public-page.md`, `plan/design-system.md`, and `plan/screen-checklist.md` first. This phase adds accounts. After it, the app has three kinds of visitor: a stranger, a person waiting for approval, and an approved member, plus one owner.

## Goal

People can make an account with an email and password. Everyone starts out waiting. The owner, and only the owner, approves, declines, or removes people. The import page and its action become owner-only, replacing the "off on the live site" rule from Phase 10.

## What to build

- **Use Better Auth** with its MongoDB adapter, email and password, 8 to 128 characters. Passwords are stored only as hashes by the library. Don't write any password handling yourself.
- **Two extra fields on each person,** `role` (`owner` or `member`) and `status` (`waiting`, `member`, or `removed`). Mark both so a person can't set them when signing up. Only the app sets them. A sign-up request that includes `role: "owner"` must have no effect.
- **Who becomes the owner.** The account whose email matches the `OWNER_EMAIL` setting, compared without caring about capital letters, and only while no owner exists yet. Everyone else is `member` + `waiting`. The database enforces one owner with a unique index that applies only to documents whose role is `owner`.
- **The rules as plain functions with tests,** in `lib/memberRules.ts`: who starts as what, who counts as approved, who counts as the owner (both role and status), and which action is allowed on whom (approve a waiting person, decline a waiting person, remove a member, restore a removed person, and never change the owner). Anything unrecognized falls back to the safest value.
- **Ask who's signed in on every request,** from the database, with no cookie cache, so a removal takes effect on the person's next click. Put it in `lib/session.ts`: pages use functions that redirect, actions use a function that returns the owner or nothing.
- **Screens,** in the app's design: sign in, create an account, "Waiting to be let in" (approved people are sent on to the home page, removed people are told they don't have access), and an owner-only **Members** page listing everyone with waiting people first and the right buttons for each. Remove and Decline ask first, in a dialog. The header shows Sign in for a visitor, or the person's name, links, and Sign out.
- **Sign-in and sign-up forms** call the library's browser client, not a server action, so its request checks and rate limit apply. A wrong answer always shows the same message. Never say whether an email has an account.
- **Limit guessing:** five sign-in tries and five sign-up tries a minute from one address in production, kept in the database. Read the visitor's address only from headers the host sets.
- **Only this origin:** requests from any other website are refused.
- **Make import owner-only,** both the page and the two actions. An action can be called without the page, so each action checks for itself.
- **Update `.env.example`** with the three new settings. Never write a real secret anywhere. I'll make the secret myself and paste it into `.env.local`.

## Rules for this phase

- Check who's calling inside every server action. Don't rely on the page having hidden a button.
- Treat every value from the browser as untrusted: ids, actions, names.
- A removed or declined person is signed out right away.
- No new color or shape: use the design system. Round shapes are only for chips, tags, and avatars.
- Tell me what each command does before you run it. Use the demo data, not my real database.
- Don't print or ask for any password or secret.

## Done when

- `npm test` passes, including the member rules.
- A new account with any other email is `member` + `waiting`. The owner's email in different capitals becomes the owner. A second account with the owner's email is refused. There is exactly one owner.
- Sending `role: "owner"` with a sign-up changes nothing.
- A waiting person and an approved member are both sent away from Members and Import. Replaying the owner's approve action with a member's cookie, or with no cookie, changes nothing. Replaying it with the owner's cookie works.
- Approving lets the person in on their next click. Removing signs them out right away.
- Six wrong sign-in tries from one address get "too many tries". A different address isn't blocked.
- The home page's HTML for a stranger contains no email addresses.
- At 390px wide there's no sideways scroll, and every screen works from the keyboard. An accessibility scan finds nothing.
- `npm run lint` and `npm run build` pass.

## Out of scope

Photos, the members' area, visits, reviews, resetting a forgotten password, and verifying email addresses. Those come later.
