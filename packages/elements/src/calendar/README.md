# Calendar

`en-calendar` is a single-date Gregorian grid. It owns calendar navigation and a
string `value`; it is not a form control. Use `en-date-picker` when the selected
date needs native editing, validation and form submission.

```html
<en-calendar label="Review date" value="2026-09-18" today="2026-09-14"
  min="2026-09-14" max="2026-10-30" locale="en-US" first-day-of-week="0">
</en-calendar>
```

Import `@en-reve/elements/define/calendar.js` to register it. ISO date strings are
calendar dates, not timestamps. The supported years are 0001–9999. Supply `today`
from the application's user-time-zone context to highlight the current day and
make SSR deterministic. Without `month`, the view starts at `value`, `today`,
`min`, or January 1970. Explicit `month` wins over a simultaneous value write.
`locale` formats Gregorian month, weekday and day labels; it does not change the
calendar system, week start, reading direction or application labels.

There is one date-grid Tab stop. Arrows move days/weeks (horizontal arrows reverse
in RTL), Home/End reach week edges, Page Up/Down move months, and Shift+Page Up/Down
move years. Navigation never changes selection. Month actions use icon-only `en-button` with official `en-icon` chevrons and retain focus.
Out-of-range or off-step dates remain keyboard discoverable but cannot be chosen.
`step` defaults to one day; its anchor is `min`, then `step-base` (1970-01-01 by
default). `disabled` removes all calendar controls from keyboard operation.

`en-change` is the sole value-change transaction. During its synchronous dispatch,
`value` is tentative; `preventDefault()` rolls it back unless an authoritative
application write superseded it. Silent author writes, including equal-value
writes, take precedence. After accepted activation, `en-action` with
`{action:'confirm', data:date}` signals confirmation, including activation of the
already-selected date. It is a command notification, not another state-control
channel. Applications can use it to finish a picker without requiring a new value.

CSS Parts include `base`, `header`, `heading`, `previous`, `next`, `grid`, `weekday`,
`day`, `selected` and `today`. The previous/next parts forward the native button controls through `exportparts`.
The previous/next content slots accept noninteractive
icon content. Shared option selection/focus tokens and button navigation styles
follow scoped/inspired themes. `--en-calendar-day-size`, `--en-calendar-day-radius`
and `--en-calendar-gap` customize geometry. Date targets are square with centered
tabular numerals. The day-size token is a preferred size constrained by available
column width; shared minimum targets remain enforced. Coarse pointers use the
shared touch target when space permits. The radius can make the visible shape
circular (`50%`), rounded, or square (`0`). Rest and hover fills follow
`--en-option-rest-background` and `--en-option-hover-background`. Available dates
add a built-in tint over the fill on hover when the primary input supports it,
and a stronger tint while pressed. Pressed and keyboard-focus feedback remain
available independently of hover capability.
This works without consumer overrides, even when the hover fill matches its
surrounding surface. The tint uses the date's text color and preserves the
selected fill, today border and keyboard focus. Unavailable dates gain no tint.
`--en-calendar-hover-opacity` (0.10) and `--en-calendar-pressed-opacity` (0.16)
control the tint strength, including through managed theme controls. Values are
clamped to 0–1. Consumers can set them to zero when supplying their own visibly
distinct rest/hover fills; for example, filled resting dates that clear on hover.
In forced colors a hover border provides the feedback instead.
Date buttons use inline-flex within
aligned table cells; the outer columns align to the month-action edges, including
in RTL. Weekday labels follow their date targets. Keep focus and target sizes usable.

This baseline excludes multiple dates, remote availability, time selection
and calendars outside the declared matrix below. Browser checks are separate from physical
mobile and screen-reader review.

## Display calendar

`calendar="gregory"` remains the default. `calendar="buddhist"` uses modern
Gregorian-equivalent months with Buddhist Era years (+543), restricted to ISO
1941-01-01–9999-12-31. Values, month, min/max and today remain Gregorian ISO strings.
The private adapter validates fields and inverse conversions; arbitrary calendar
plugins and historical reform reconstruction are not public APIs.

The calendar and era are visibly identified (`calendar-label` overrides the text).
An unsupported ID, missing Intl capability or out-of-interval selection/displayed month
replaces the grid with an explanation (`unsupported-label` overrides it). Align
Intl calendar support, locale and today between SSR and hydration. Use Parts
`calendar-label` and `configuration` to style this content. A locale selects label
language/numerals, not the calendar system; set `calendar` independently.

## Range selection

Set `selection="range"` and assign immutable ISO endpoints with `rangeValue = { start, end }`; the existing single `value` stays independent. First activation begins a draft, second completes an inclusive chronologically normalized pair. Inline calendars commit a complete pair; date pickers keep the draft until Apply range. Cancel or Escape restores accepted state. Same-day ranges are valid.

`en-change` carries previous/proposed pairs and supports atomic veto with authoritative application writes winning. `unavailableDate(iso)` applies to the whole interval, as do min/max and step. Availability is synchronous and cached; replace the predicate or call `invalidateAvailability()` when captured data changes. Predicate scans are bounded to 36,600 days; larger intervals are rejected explicitly. No such limit applies without a predicate.

In the picker use explicit `start-name`/`end-name` form names. Invalid, partial or empty pairs do not submit. Required means a complete valid pair; reset and restoration preserve paired values. `clearRange()` and the Clear range action clear the pair through a cancelable transaction. Gregorian and modern Buddhist presentation preserve ISO endpoints. Range Parts expose endpoints, inclusive range and preview, with matching `--en-calendar-range-*` fill overrides.

Range fills join across adjacent cells and continue on each week row. The selected background is shared by endpoints and interior dates; endpoint buttons are transparent by default, with outlines marking the boundaries. Actual endpoints receive rounded caps; week boundaries remain flush. `range-band`, `range-band-start`, `range-band-end` and `range-band-preview` expose the inert backgrounds without changing date-button semantics or focus. These Parts are forwarded by the picker with a `calendar-` prefix. Existing range/preview background properties style the bands. RTL follows chronological reading direction; same-day ranges keep one capped date.
