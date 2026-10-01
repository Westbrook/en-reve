# Calendar, ranges and time follow-up contract

Planning checkpoint: 2026-09-17. Covers DATE-1/2/3 from
[the component backlog](component-follow-up-backlog.md). The DATE-3 adapter and
modern Buddhist single-date foundation are implemented for review. DATE-1 range APIs are now implemented for review; DATE-2 local time entry is implemented for review.

## Current boundary and order

`packages/primitives/src/interactions/calendar.ts` owns Gregorian date-only parsing,
UTC day arithmetic, month clamping and a six-week grid. It supports ISO years
0001–9999. `en-calendar` displays one selected date; `en-date-picker` extends the
native date input and confirms through a dialog. The original locale formatting forced `gregory`. The new private adapter adds an
explicit modern Buddhist calendar with validated inverse mapping and bounds.

Settle and test the calendar adapter boundary first (DATE-3 foundation), implement
ranges against it (DATE-1), then time entry/composition (DATE-2). Ship the first
alternate calendar with the adapter, before claiming ranges work across calendars.
Time parsing and field composition can proceed independently once the value
contract below is fixed. No scheduling service or timezone database is introduced.

## Stable values and calendar adapter

Continue to store and submit date-only values as Gregorian ISO `YYYY-MM-DD`.
`value`, `min`, `max`, `today` and the ISO date identifying a displayed month keep
the same meaning when the display calendar or locale changes. Calendar selection
changes presentation/arithmetic, not the selected absolute day. Keep application-
supplied `today` for deterministic SSR. Never parse local date strings with `Date`.

This aligns with the native date field's Gregorian date-string contract; localized
presentation does not change its submitted string.
[HTML date input](https://html.spec.whatwg.org/multipage/input.html#date-state-(type=date))

Introduce a private adapter with validated ISO-to-calendar fields, inverse
conversion, month/year navigation, days-in-month and grid generation. Calendar
fields include calendar ID and era/year; allow a future month code instead of
assuming every calendar is twelve numbered months. Public consumers continue to
use ISO strings. Do not publish an arbitrary calendar-plugin API in this slice.

Use exact integer day identities for comparisons and ranges; navigation operates
in the chosen calendar, preserves day when possible and constrains it in a shorter
destination month. Min/max remain inclusive and invalid/reversed ranges keep the
existing documented policy. A calendar adapter must declare its supported date
interval and reject outside it rather than silently changing calendars.

`Intl.DateTimeFormat` supplies localized labels; it is not our date parser or month
arithmetic engine. Check `resolvedOptions().calendar` to detect unavailable calendar
data. If requested data is unavailable, show an explicit unsupported configuration
message and disable the alternate-calendar UI; do not label Gregorian output as
the requested calendar. SSR and client need the same declared calendar capability.
[ECMA-402 DateTimeFormat](https://tc39.es/ecma402/#sec-intl.datetimeformat)

## Initial supported matrix

| Calendar | Implementation target | Storage / arithmetic | Qualification |
| --- | --- | --- | --- |
| `gregory` | Retain existing default | ISO years 0001–9999, existing Gregorian arithmetic | Existing coverage plus range regressions |
| `buddhist` | First alternate, modern civil delivery | ISO 1941-01-01–9999-12-31; Gregorian-equivalent months and day arithmetic; displayed year = ISO year + 543 | New round-trip/boundary and three-engine Intl checks required |
| `hebrew`, `islamic-*`, `persian`, `japanese`, others | Deferred, explicitly unsupported | No inferred conversion from formatted labels | Separate arithmetic/data decision before support claims |

Buddhist is the bounded first choice because ICU defines its modern model as
Gregorian-equivalent apart from year and era, giving a useful alternate display
without introducing lunisolar month or observation policies. The restricted lower
bound is our conservative product boundary: this slice does not reconstruct
historical civil-calendar reforms. It must not reduce the default Gregorian range.
[ICU BuddhistCalendar](https://unicode-org.github.io/icu-docs/apidoc/released/icu4j/com/ibm/icu/util/BuddhistCalendar.html)

A local planning probe on Node v24.16.0 / ICU 78.3 resolved `buddhist` and formatted
ISO 2024-02-29 in `th-TH` as `29 กุมภาพันธ์ 2567`. It also resolved `gregory`,
`hebrew` and `islamic-civil`; that is formatting evidence only, not browser support
or proof of implementation arithmetic. Before shipping, record equivalent probes
and boundary fixtures in Chromium, Firefox and WebKit. Validate Thai labels,
numerals and era with a competent human review.

The first alternate editing UI must visibly name its calendar and era. Native
`input[type=date]` cannot be made into a guaranteed Buddhist-year editor by setting
our locale. Retain it as an explicitly ISO/Gregorian editing route, alongside the
alternate grid and formatted accepted-date summary. Do not disguise it as a
localized alternate-year field. A segmented alternate-date editor is later scope.

## DATE-1: range transactions and forms

Keep single `value` and single-date defaults untouched. Add a separate range mode
and immutable `{start: string, end: string}` range value, with empty strings for
missing endpoints. Do not overload single value with a slash-delimited string.

- First date activation begins a draft; second completes an inclusive range.
  Selecting an earlier endpoint normalizes the pair chronologically. A same-day
  range is valid. A new first click after completion begins a new draft.
- Focus/hover can preview the potential interval without selecting or changing
  form data. Numeric/keyboard and pointer selection share the same draft. Escape
  cancels to the last committed range. A picker exposes Apply and Cancel; incomplete
  drafts cannot Apply. Inline delivery commits a completed pair atomically.
- Bounds, step and the synchronous unavailable-date predicate apply to all days
  in the interval. Reject ranges containing unavailable interior dates, with an
  explanation. Do not silently skip or bridge them. Validate once per proposal,
  using bounded scans/cached interval results rather than every paint; document
  the predicate's invalidation contract. Async availability stays app-owned.
- A cancelable change carries previous/proposed pairs. Preventing it rolls back
  both endpoints together; explicit application writes take precedence. Reset,
  disabled and required behavior match existing field conventions. Required means
  a complete valid pair, not just a start date.
- Provide explicit `start-name` and `end-name` form associations for two ISO values.
  Do not invent `${name}[start]` server conventions. A partial pair cannot submit
  as a successful completed range. Document empty submission, reset and form-state
  restoration with a real FormData receipt in the demo.

Keep one grid Tab stop and independent focus versus selection. Announce start,
end, range completion and errors without a live announcement per hover pixel.
Expose endpoint/in-range/preview Parts and theme tokens; selection must remain
distinguishable in forced colors. Narrow delivery uses one month with navigation,
not two grids forced into a cramped row.

## DATE-2: wall time, not an instant

Add a time-entry pattern composed with the date/range controls. Persist local wall
time as `HH:mm`, optionally `HH:mm:ss` when seconds are enabled. Scope the first
pass to whole-second precision; reject offsets, `Z`, 24:00 and leap-second input.
Localized 12/24-hour presentation must round-trip to the same canonical value.
Step and min/max are wall-clock constraints; default minute precision and a
60-second step. Do not silently round an invalid typed value on blur.

The native time state also represents a time without a timezone. Support explicit
overnight bounds through a documented wrap interval, with tests around midnight;
do not equate overnight time bounds with a date range crossing days.
[HTML time input](https://html.spec.whatwg.org/multipage/input.html#time-state-(type=time))

Dates and times remain separate submitted fields. A convenience application
receipt may combine them into a local date-time, but the library never calls
`toISOString()` or assumes the machine timezone. The app chooses an IANA zone,
resolves ambiguous/nonexistent DST times and supplies any business validation.
If it needs an instant, it must choose that policy explicitly. Distinguishing
calendar dates, wall times and zoned values follows the separation described by
[Temporal's calendar guidance](https://tc39.es/proposal-temporal/docs/calendars.html).

## Release evidence and review

1. Pure fixtures for date/calendar inverse mapping, leap/century/month ends,
   supported bounds, earlier endpoints, unavailable interiors and midnight/time
   precision. Prove display-calendar switches preserve ISO value and range.
2. Three-engine keyboard, cancellation/author writes, locale/RTL, form receipts,
   reset/restore, SSR/hydration and narrow/zoomed UI checks. Test missing Intl
   support explicitly. Never infer alternate-calendar acceptance from snapshots.
3. Manual Thai/Buddhist review, VoiceOver grid/range messages and physical mobile
   touch/time editing. Keep this distinct from implementation/test completion.

No user choice blocks planning. If there is a priority audience requiring Hebrew,
Persian or a particular Islamic calendar, that would change the first alternate
and require an arithmetic implementation decision before coding. Historical
calendar reconstruction, generic calendar plugins, timezone resolution and booking
services remain outside this slice.

## Foundation implementation checkpoint · 2026-09-17

The private adapter and modern Buddhist calendar are implemented in both single-date controls. ISO values remain unchanged; the native entry route is explicitly Gregorian. Modern Buddhist support is limited to ISO 1941 onward and unsupported configurations have explicit feedback. Review this foundation before ranges and time selection, which remain planned. Thai-language and assistive-technology review remain manual.

## Range implementation checkpoint · 2026-09-17

DATE-1 adds `selection="range"`, immutable `rangeValue: {start,end}`, drafts and preview to existing calendar and date picker elements. Inline completion commits atomically; the picker exposes Apply, Cancel and Clear range. Explicit `start-name`/`end-name` submit ISO dates only for a complete valid pair. Required, reset, restoration, veto and authoritative writes use the field transaction contract. Unavailable interior dates reject the proposal; cached synchronous predicate validation scans at most 36,600 days per proposal, with an explicit error beyond that bound. No such bound is imposed when no predicate is supplied. Call `invalidateAvailability()` after changing captured availability data. Gregorian and modern Buddhist displays preserve the same pair. DATE-2 wall time is implemented for review. Current verification and publication receipts live in the independent Progress Report; Thai-language, physical touch and assistive-technology review remain manual.

## Time implementation checkpoint · 2026-09-18

DATE-2 adds standalone `en-time-field` with localized text entry, explicit 12/24-hour display, optional seconds, whole-second steps, inclusive bounds and explicit overnight wrapping. Blur/Enter accepts canonical local strings through the shared cancelable field transaction; invalid text stays visible and blocks submission. Escape cancels, Arrow Up/Down steps, author writes win, and form reset/restoration remain supported. Appointment and date-range compositions submit separate date/time entries. No timezone or DST policy is inferred. Physical mobile, real IME and VoiceOver review remain manual qualification.
