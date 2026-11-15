# The Kids' Table: design system

One design for every screen. Every color, size, and shape below is a token or a rule, and every new screen follows them. Tokens live in `app/globals.css`, and nowhere else.

## Colors

| Token | Hex | Use |
|---|---|---|
| tomato | `#C8102E` | The one primary button per view. Star ratings. Error icons |
| teal | `#0F5257` | Links, selected chips, the secondary button, tag text |
| cream | `#FFF8EC` | The page background |
| card | `#FFFFFF` | Cards, inputs, tables |
| line | `#F0E3D2` | Card borders and dividers. Not for controls |
| ink | `#2A2220` | All text, including text on tinted fills |
| muted | `#7A6B63` | Secondary text. Only on cream or card, 14px or larger |
| tomato-soft | `#FBE3E1` | The glow. Error notice fill |
| teal-soft | `#DCEDEB` | The glow. Tags. Info and success notice fill |
| edge | `#8F8174` | The border of every control (inputs, selects, unselected chips). 3.58:1 on cream. The line color is only 1.20:1, too faint to mark a control |
| tomato-dark | `#A80D26` | Primary button on hover |
| teal-dark | `#0B3F43` | Link and secondary button on hover |
| sun-soft | `#FFF1C9` | Warning notice fill |
| sand | `#F4ECE0` | Skeleton and disabled fills. No text on it |

The orange, yellow, and green in the logo are for illustration only. They are not tokens, so no screen can use them for text.

**Text rules:** ink on cream, card, and every tint. Muted only on cream or card, and only at 14px or larger. Teal for links and for chip and tag text. Color is never the only cue: a selected chip has a check mark, a notice has an icon and words, a status has a word.

## Type

Hanken Grotesk, in three weights only: 500, 700, and 800.

| Role | Size and line, weight |
|---|---|
| Page heading | 30/36, 800 on a phone. 36/40 from 640px |
| Section heading | 22/28, 800 |
| Restaurant name | 18/24, 800 |
| Body | 16/24, 500 |
| Detail, caption | 14/20, 500 |
| Label, chip | 14/20, 700 |
| Tag | 13/16, 700. The smallest text in the app |
| Form controls | 16px, always. Smaller makes iPhone Safari zoom the page when you tap |

## Shape, space, and depth

- Corners: 14px for controls, buttons, and notices. 16px for cards and table wrappers. Fully round for chips and tags only.
- Spacing: 4, 8, 12, 16, 24, 32, 48. Page gutter 16px, then 24px from 640px. Content no wider than 1040px.
- Cards sit in a grid of 1 column, then 2 from 640px, never more.
- Shadows: cards get a faint one. Only the one tomato button gets a tomato shadow.
- The glow: one per screen, behind the logo in the header only, clipped so it can't make the page scroll sideways.

## Interaction

- **Focus:** a 2px teal outline with a 2px offset, on everything you can interact with. An outline survives high-contrast mode. A shadow doesn't.
- **Targets:** every control at least 44px tall.
- **Motion:** a 120ms color change, and nothing at all for people who ask their device for less motion. Loading placeholders stay still.
- **Links:** teal and underlined. Hover darkens them.
- **Forms:** every control has a visible label. A filter form is a plain GET form with one button. It does not submit by itself when something changes.

## Pieces (`components/ui`)

Built once, used by every screen: `SiteHeader`, `TextField`, `Select`, `Chip` (a checkbox drawn as a pill, with a check when on), `TagPill`, `Button` (primary tomato, secondary white with a teal edge), `Card`, `Notice` (info, success, warning, error), `Skeleton`. Tables use one shared set of classes on a plain `<table>`.

Later chapters add pieces such as an avatar, a rating, and a photo tile, each when a screen first needs it.

**One tomato button per view.** Buttons in the rows of a list are secondary. A destructive action opens a confirm step, and that confirm button is the one tomato.

## Rules for every page

- A skip link comes first, then the header, then one `<main>`. One `h1` per page. Result cards are list items, with the name as an `h2`.
- Every list has four states: loading, empty, error, and not set up. "Nothing is public yet" and "nothing matches" are different messages.
- A public page shows generic errors only: "The list isn't available right now. Try again in a minute." Hints that name settings, databases, or addresses show only when running on your own computer.
- A public page never sends a database id (it contains the time the record was made), the date a place was last checked, who added it, or whether it's public.
- Pages that aren't for search engines, like the status and import pages, say so.

## Guardrails

1. The tokens in `app/globals.css` are the only source. The default palette is removed, so a stray `bg-zinc-200` draws nothing.
2. `tests/design.test.mjs` fails on any hex color or default-palette class outside `globals.css`, any font weight that isn't loaded, text under 13px, a round shape outside chips and tags, and any approved text and background pair that is too faint to read.
3. `plan/screen-checklist.md` lists eight things to check before any screen is done.
4. Every public page has a privacy check: with demo data, the page's HTML contains none of the private places, none of the people, none of the internal field names, and no database id.
