# Phase 16: get ready to go live

Read `plan/00-app-plan.md`, `plan/12-add-sign-in.md`, `plan/15-share-with-group.md`, `plan/design-system.md`, and `plan/screen-checklist.md` first. This phase makes the app safe to put online and gives us two ways to check it. I will add the settings to Vercel and Atlas myself. You don't touch either of them.

## Goal

The app behaves sensibly in every state it can be deployed in: with no settings at all, with some of them, and with all of them. Strangers can't reach private pages. Every page carries a few basic security headers. I can run one command before launch to check my settings, and one after launch to check the live site from the outside.

## What to build

- **A check for whether sign-in is set up,** in `lib/authConfig.ts`, as plain functions with tests. Sign-in is set up when the database address is present, the secret is at least 32 characters, and, in a production build, the app's own address is present and starts with https (plain http is allowed only for localhost, so I can try the finished build on my own computer). It must say which setting is wrong without ever returning a value.
- **Until sign-in is set up, say so plainly.** The sign-in and sign-up pages say "isn't available right now". The `/api/auth` address answers 503 with a short message and nothing else. The session lookup returns "nobody". No page may show a stack trace, a setting name, or a database detail. Requests that arrive before the settings do must never crash.
- **A gate in front of the private pages,** in `proxy.ts`. Anyone with no sign-in cookie at all who asks for `/places`, `/visits`, `/members`, `/import`, or `/waiting` gets a redirect to the sign-in page before any page code runs. This is a convenience, not the protection: it only checks that a cookie exists. Every page and every action must still check who is signed in, as they already do. Say that in a comment.
- **Security headers on every page,** in `next.config.ts`: stop the browser guessing file types, refuse to be shown inside another website's frame, send only the site's name when someone follows a link out, and turn off the camera, microphone, and location. Don't add a content security policy beyond the frame rule. It would need careful testing, and it isn't part of this phase.
- **`npm run check:settings`,** a script that reads my `.env.local`, says for each setting whether it's there and looks right, and never prints a secret. It prints how long the database address and the secret are, and nothing else about them. With `--live` it checks the way the live site needs them.
- **`npm run check:live -- <address>`,** a script that checks a running copy of the app from the outside. It only sends ordinary requests. It never makes an account. It checks the public page, the headers, that private pages redirect to sign-in, that the sign-in system answers, that the status page says only Connected or Not connected, that a sign-in sent from another website is refused, that wrong passwords get a plain no and then stop after a few tries, and that changing a header doesn't dodge that limit (skipped with `--local`). With `--private "A,B"` it checks that those names appear nowhere on the public page, searching by one word of each name so the search box doesn't echo the whole name.

## Rules for this phase

- Never print, ask for, or write a secret. The checks report presence and length only.
- Treat the live site as someone else's computer: the scripts make only ordinary requests, and the check script says it will trip the guess limit on purpose.
- No new color or shape: use the design system.
- Tell me what each command does before you run it. Use the demo data, not my real database.

## Done when

- `npm test` passes, including the new settings tests.
- A production build started with no settings at all answers every page with a plain page or a redirect, never a 500, and nothing technical appears. Every `/api/auth` request gets a 503 with the short message.
- A signed-out request to each private page gets a 307 to the sign-in page.
- Every page carries the five security headers.
- `npm run check:settings` is correct for a good set of made-up settings, for a set with each kind of mistake, and for no settings at all.
- `npm run check:live` passes against a production build run on my own computer with all the settings in, using `--local`.
- Every earlier end-to-end check still passes.
- `npm run lint` and `npm run build` pass.

## Out of scope

Custom domains, sending email, resetting a forgotten password, and monitoring. Those aren't part of this guide's first launch.
