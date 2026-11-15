# Phase 8: write down the data model

Read `plan/00-app-plan.md` first. This phase writes down what the app keeps, in one file, before any code touches a database. Every later phase follows this file. If something here changes, change it here first, then tell Claude.

## Goal

One file, `plan/data-model.md`, that says what the app keeps, who owns each thing, who can see it, and what mistakes the app has to stop.

## How to work

- Ask me questions before you write anything. One at a time, up to 10. Focus on things that could be stored twice, things that belong to one person, and things a spreadsheet lets people type wrongly.
- Plain English. No code in this phase.
- When you finish, list every assumption you made so I can correct it.

## The things the app keeps

**Restaurant.** Shared by the whole group.
- name (text, required)
- area (one choice from the settings list)
- food type (one choice from the settings list)
- features (any of the settings list: patio, playground, play area)
- public (yes or no; the owner decides; default no)
- last checked (a date; the owner sees which listings are due for a fresh look after six months)
- photos (members only)
- who added it, and when

**Review.** One per person per restaurant.
- which restaurant, which member
- rating (a whole number from 1 to 5)
- overall note (text, optional)
- when it was written and last edited

**Visit.** Many per person per restaurant. Private to the person who logged it.
- which restaurant, which member
- date (can't be in the future)
- notes (text, optional)

**Member.** Added in phase 12.
- name and email
- status: waiting, member, or removed
- role: owner or member

## The settings file

One file names the app and its choices: the app name, what a "restaurant" is called, what a "visit" is called, the list of areas, the list of food types, and the list of features. To build your own version, change this file.

## Rules the app must enforce

- One review per person per restaurant.
- A rating is a whole number from 1 to 5. Not "4/5", not "great!", not stars.
- Features are chosen from the list. They aren't typed.
- A restaurant is found by searching first. A new one is added only if the search finds nothing.
- A visit has a real date, and not one in the future.
- Only the person who logged a visit can see it.
- The public page shows only restaurants the owner marked public, and never shows reviews or photos.

## Out of scope

Everything that isn't the data. Pages, sign-in, and photos come in later phases.
