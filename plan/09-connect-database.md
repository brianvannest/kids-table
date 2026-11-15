# Phase 9: connect the database

Read `plan/00-app-plan.md` and `plan/08-data-model.md` first. This phase connects the app to the MongoDB Atlas database you made in Chapter 5. It stores nothing yet.

## Goal

The app can talk to the database from server code only, and the connection string lives in one private file on this computer, `.env.local`, and nowhere else.

## What to build

- Install the official `mongodb` package and the `server-only` package.
- One file, `lib/mongodb.ts`, that opens the connection. It runs on the server only, keeps one shared connection, and reads the address from `MONGODB_URI`. The database name comes from `MONGODB_DB` and defaults to `kidstable`.
- A page at `/status` that says in plain words whether the app can reach the database. It never shows the connection string, the password, or a raw error.
- An `.env.example` file with an empty `MONGODB_URI=` line, committed to Git, so anyone can see which settings the app needs.
- Make sure `.env.local` is ignored by Git.

## Rules for this phase

- Never ask me for the connection string, and never print it, log it, or put it in a message. I will paste it into `.env.local` myself. To check that it's set, look only at whether it exists and how long it is.
- Create `.env.local` with an empty `MONGODB_URI=` line, then tell me exactly where to paste.
- Don't put the database code in any file the browser loads. Don't start a secret's name with `NEXT_PUBLIC_`.
- Tell me what each command does before you run it.
- Don't create any data yet.

## Done when

- `/status` says Connected.
- `git status` doesn't list `.env.local`.
- `npm run lint` and `npm run build` both pass.

## Out of scope

Collections and data, sign-in, and photos. Those are later phases.
