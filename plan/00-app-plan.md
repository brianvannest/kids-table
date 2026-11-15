# The Kids' Table: app plan

A small fry guide. This file describes what we're building and how it works. Every phase plan points back to it. When something here changes, change it here first, then tell Claude.

## What it is

The Kids' Table is a shared list of family-friendly restaurants around greater Houston, kept by one group of friends. Members find places to eat with kids, see what their friends thought, and keep track of where they'd go again.

It replaces the group's old spreadsheet and group text. It checks what people enter and shows things the spreadsheet couldn't.

## Who uses it

- **Visitors.** Anyone with the link. No sign-in. They see a short public list.
- **Members.** Friends the owner has approved. They sign in with an email and password.
- **The owner.** One person. Decides who is in the group and which restaurants are public.

## What it keeps

Three kinds of things:

1. **Restaurant.** Shared by the whole group. A name, an area of town, a food type, and features like a patio or a playground. Members search first, and add a restaurant only if it isn't there yet. Restaurants can have photos.
2. **Review.** One per person per restaurant. A rating from 1 to 5, plus an optional overall note. The author can edit their own review. The whole group sees who wrote it, the rating, and the note.
3. **Visit.** A date, plus optional personal notes. A person can log many visits to the same restaurant. **Only the person who logged a visit can see it.**

## Who sees what

| | Visitors | Members | Owner |
|---|---|---|---|
| Public restaurant list (no photos) | Yes | Yes | Yes |
| Every restaurant, with photos | No | Yes | Yes |
| Everyone's reviews | No | Yes | Yes |
| Their own visits | No | Their own only | Their own only |
| Approve or remove members | No | No | Yes |
| Choose which restaurants are public | No | No | Yes |
| Edit or remove anything | No | Their own reviews and visits | Yes |

The public page never shows reviews.

## Joining the group

Anyone can create an account. A new account sees only a "waiting to be let in" screen until the owner approves it. Each member has a status (waiting, member, removed) and a role (owner or member). The owner has a Members screen listing everyone with their name and email.

No emails are sent. The owner recognizes their friends.

## The pages

- **Public page.** The owner's chosen restaurants. Filter by features, food type, and area. No photos, no reviews, no sign-in.
- **Sign in and create account.**
- **Waiting screen.** What a new account sees until approved.
- **Restaurants (members).** Every restaurant, with photos. Search first. Add a restaurant if it isn't there.
- **One restaurant (members).** Photos, the group's reviews, your own review, your own visits.
- **Log a visit.**
- **Members (owner only).** Approve, remove, and choose which restaurants are public.

## Rules the app has to enforce

- One review per person per restaurant.
- A rating is a whole number from 1 to 5.
- A visit has a date, and the date can't be in the future.
- A person can only see and change their own visits.
- Every page and action for members checks, on the server, that the person's status is "member".
- Passwords are never stored as plain text.
- Database passwords and keys live only in server code and in Vercel's settings, never in the browser and never in GitHub.

## Tools

VS Code, GitHub, Vercel, and MongoDB Atlas, with Claude Code writing most of the code. Next.js and TypeScript. Better Auth for email and password sign-in. Vercel Blob for photos.

## Out of scope for now

Google or Microsoft sign-in, custom domains, sending email, separate development and production setups, and anything about real students or school data.

## Settings that make it yours

One settings file names the app, the item (restaurant), the visit, the categories, and the features. To build your own version, change that file and the sample list, and keep the steps.
