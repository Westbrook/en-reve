# Calendar helper consumers

`@en-reve/primitives/interactions/calendar.js` is a pure Gregorian, date-only
module. It does not install a calendar widget. The [packed native consumer](../../../probes/calendar-recipes/recipes.ts)
shows one application-owned grid using `calendarStyles` or `calendar.css` from
`@en-reve/styles`, with a native form and two independent instances.

## Ownership and date meaning

The helper parses complete ISO dates in years 0001–9999, rejects impossible days,
performs UTC day arithmetic, clamps month increments to shorter months, derives a
42-cell grid, checks inclusive bounds, and formats Gregorian dates in a requested
locale. Unsupported cells at the year edges are disabled blanks, not duplicate
boundary dates. A reversed valid range is empty; malformed bounds are ignored.
Locale and process timezone do not change the ISO values or switch calendars.

Applications own active focus, selected dates, range drafts, DOM roles/labels,
keyboard policy, constraints beyond these helpers, and form serialization. In the
example, arrow keys move days; Home/End move within the configured week; Page keys
move months and Shift modifies them to years. Enter/Space choose native buttons.
Disabled dates remain discoverable with `aria-disabled`; handlers reject their
activation. Moving focus alone does not select a date. Escape cancels an unfinished
range. These are the example's decisions, not behavior installed by the helper.

The range example orders reversed endpoints, previews without accepting, preserves
its range when changing month, and submits two hidden native inputs. An application
with unavailable interior dates, multiple disjoint ranges, or async restrictions
must supply those policies explicitly. The helper does not implement alternate
calendars, timezones, times of day, or application persistence.

## Native date inputs and steps

`dateOnStep` treats a positive finite step as a literal interval in days. With a
base of `2024-02-10`, step `0.3` allows February 10 and 13, but rejects February 11.
Invalid steps fall back to one day; invalid bases fall back to the epoch. This
behavior is defined by the helper's existing contract and pure tests.

Do not infer that native `<input type="date">` constraint validation follows all
fractional intervals identically. In the recorded Chromium, Firefox and WebKit
runs, native `step=".3"` reported no step mismatch for any of those three dates.
The receipt retains these observations independently from helper assertions.
Whole-day `step="2"` matches the helper on the same base. If an application pairs
the helper with a native date field, prefer whole-day steps for parity or apply
its explicit fractional constraint consistently to both selection and submission.
This is a bounded browser observation, not a claim about every browser or step.

## Styles and customization

The stylesheet is a shared calendar-surface stylesheet, including `table`, `th`,
`td` and authored `part` selectors. Adopt it in a calendar-owned rendering root;
do not treat it as a globally scoped reset for unrelated tables. The example
owns its shadow root and mirrors the calendar markup contract, using native
buttons rather than importing the elements package.

`.en-calendar` contains a header and fixed seven-column table. Native date buttons
use `.en-calendar-day`; weekday spans use `.en-calendar-weekday`. Range bands are
separate decorative spans with `part="range-band"` plus `range-band-start`,
`range-band-end`, or `range-band-preview`. Buttons use `in-range`, `range-start`,
`range-end` and `preview` as appropriate. Keep decorative bands `aria-hidden`;
selected cells and full button/weekday names carry the semantics.

Use documented `--en-calendar-*` pins for inline size, day size/radius, gap, range
background, preview background and endpoint background. Native CSS within the
owned root can further compose the surface. Foundation sizing supplies local
roles; a host-level conceptual radius is not guaranteed to supersede those roles.
Use the calendar day-radius pin for an explicit local override. Sibling scopes
stay independent. These authored part attributes participate in the stylesheet;
they are not automatically an `en-calendar` element's exported `::part` API.

The consumer verifies joined range bands, square days, rounded hover paint,
numeric alignment, RTL movement, local horizontal scrolling on narrow layouts,
and visible focus. Forced-color boundary checks retain an explicit limitation:
the tested WebKit engine does not expose `forced-color-adjust`. Its border and
disabled semantics are asserted, but that missing property is not claimed passed.

## Evidence limits

The receipt has 120 cases: 20 scenarios × two style deliveries × three engines,
plus 39 Node checks including the existing pure calendar cases and strict packed
consumer compilation. Selected browser contexts use New York and Apia timezones;
the existing pure suite additionally covers UTC and Tokyo. No library runtime
changed. Physical IME/touch, native AT speech, retail Safari/other OSs, SSR/hydration
of this application composition and separate-owner acceptance remain separate.
