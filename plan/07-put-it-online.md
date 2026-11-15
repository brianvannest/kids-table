# Phase 7: put it online early

Read `plan/00-app-plan.md` first. This phase saves the app from phase 6 to GitHub so Vercel can publish it. There's nothing new to build.

## Goal

The app is saved in a GitHub repository and live on a Vercel web address.

## What to do

- Check that this folder is a Git repository on the branch `main`, with everything committed.
- Connect it to the GitHub repository the owner created, and push `main`.
- The owner connects Vercel in the browser. That's not a job for Claude.

## Rules for this phase

- Never commit secrets. No `.env` files, passwords, tokens, or keys. Check `.gitignore` first.
- Never ask me for a password or a token. If Git needs me to sign in, I'll do it in the browser.
- Tell me what each command does before you run it.
- Push only `main`. Don't force-push, and don't rewrite history.

## Done when

- `git status` says the working tree is clean.
- The GitHub repository shows the same files as this folder.
- The Vercel address shows the home page from phase 6.

## Out of scope

The database, sign-in, photos, a custom domain, and anything that needs a secret. Those are later phases.
