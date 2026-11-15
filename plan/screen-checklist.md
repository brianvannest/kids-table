# Checklist for every new screen

Go through this before a screen is called done. The tests in `tests/design.test.mjs` catch the first two. The rest are a person's job.

1. **Only the app's own pieces.** The screen uses `components/ui` and the tokens in `app/globals.css`. No new colors, no default Tailwind palette, no new component that duplicates one.
2. **One tomato button per view.** The main action is tomato. Every other button is secondary. A destructive action opens a confirm step, and that confirm button is the one tomato.
3. **Four states.** Loading, empty, error, and not set up are all designed, not left blank. "Nothing here yet" and "nothing matches" are different messages.
4. **Every control is labeled and big enough.** A visible label, a visible border, at least 44px tall, 16px text inside.
5. **The keyboard works.** Tab through the whole screen. The order makes sense, the focus ring is always visible, and nothing needs a mouse.
6. **A phone works.** At 390px wide there's no sideways scroll, and nothing is cut off.
7. **A production screenshot.** Take any picture for the guide from a production build, so the developer badge isn't in it.
8. **If the screen is public,** update the privacy check: the page's HTML contains none of the private places or people, none of the internal field names, and no database id.
