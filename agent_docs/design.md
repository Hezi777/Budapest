# Design

## Language

Hen Helper (`Hezi777/Hen-Helper`): white canvas, `#fafafa` cards with a 1px
`--line` border and the layered `--shadow-card`, pill buttons, black `--ink`
for primary buttons, selected chips, active nav and icon tiles. Colour only
where it means something:

- photos;
- `--day` / `DAY_COLORS` (`src/lib/trip.ts`): small dots on the day chips and
  the map routes, nothing larger;
- kosher green (`--tag-kosher*`) and the done tick (`--walk`);
- `--danger` only for emergency calls (112, the SOS pill and section icon).

Reuse classes before adding new ones: `.card`, `.btn .btn-primary|soft|outline`,
`.chip`, `.segmented`, `.list-row`, `.text-link`, `.section-title`.

The audience is 50–60 and not technical: 48px+ tap targets, large text
(three sizes via `html[data-text]`), one obvious action per card, secondary
actions as `.text-link`, long details behind a tap (sheet or `<details>`).
Readable for this age: body at 18px at the normal size; nothing under 15px
except the map credit; muted text ≥ 4.5:1 (`--text-soft` is the lightest
allowed); selected states use ink or a check, never colour alone; buttons say
what they do in words; deleting needs a confirm or an undo. Check new screens
at the "xlarge" text size too.

## Motion

Tokens: `--ease-out` (UI), `--ease-drawer` (sheets). See the "Motion" section
of `globals.css`.

- Every pressable gets `scale(0.97)` on `:active`, 160ms `--ease-out`.
- State changes (chips, nav) transition colour, 200ms `ease`.
- The bottom sheet (`Sheet` in `src/components/ui.tsx`) slides in with
  `--ease-drawer`, slides out faster, and closes on a downward flick.
- No hover-only effects (it's a phone app). Respect
  `prefers-reduced-motion`: keep fades, drop movement.

## RTL and mixed text

- Logical properties only (`inset-inline-*`, `margin-inline-*`, …). Physical
  sides are fine only for glyphs such as a CSS chevron.
- Wrap Latin runs (addresses, codes, prices) in `.latin` or
  `<bdi dir="ltr">`. Check with a screenshot; the Assistant font's `*` is easy
  to misread.
