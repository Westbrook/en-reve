# Calendar and date picker

> Current planning status (2026-09-16): the [accepted follow-up backlog](component-follow-up-backlog.md) supersedes historical next-phase ordering below. Baseline exclusions describe the original pass; newly committed follow-ups are identified in that backlog. Implementation of those follow-ups has not started.

The next retained element family after the data Tree View is a single-date
calendar and editable date picker. This pass builds two reusable elements,
`en-calendar` and `en-date-picker`, while preserving `en-date-input` for native
input-only delivery. Package version strings remain unchanged during iteration.

## Implementation boundary

- ISO Gregorian date-only strings for selection and bounds, without timezone or
  timestamp conversion. Application-supplied `today` makes SSR deterministic.
- Inline calendar with a localized month/weekday display, explicit first weekday,
  month/year keyboard navigation, min/max availability and one grid Tab stop.
- Editable picker using the existing date-input form/label/description contract,
  official button and modal dialog, dismissal/focus return and mobile delivery.
- One cancelable `en-change` transaction: tentative public state during dispatch,
  rollback on cancellation and explicit application writes taking precedence.
  Standalone calendar activation additionally emits an `en-action` confirmation
  command, including choosing the already-selected date. The picker encapsulates
  internal calendar/dialog events and exposes one field change transaction.
- Shared size, focus, surface, motion and color tokens with CSS Parts for focused
  consumer overrides; no internal-markup dependency in consuming applications.

Range selection, time selection, alternate calendar systems, remote availability,
appointment scheduling and a separate segmented-date editor are not part of this
baseline. Locale formatting does not imply complete translated UI copy. The first
weekday and reading direction remain explicit application decisions.

## Review surfaces

- Sticker-sheet Fields: Calendar and date picker, beside retained native inputs.
- `/api-examples/calendar`: independently themed SSR demo, locale and first-weekday
  controls, accepted/canceled selection, a required constrained picker and native
  form-data receipt. Maintained source is disclosed below the demo.
- API reference for both elements: generated public surfaces, scalar demo controls
  and a shared date-only/form/keyboard/SSR guide.
- Showcase project milestone form: the existing Review date now uses the picker.
  This integrates the calendar into an existing task without inventing new fields.

## Verification and manual acceptance

Focused tests cover date arithmetic and bounds; keyboard month/year boundaries;
selection veto/reentrant ownership; native form constraints/reset; picker open,
close and focus return; SSR/hydration; narrow/RTL delivery and theme appearance.
The parent implementation records exact check receipts in the Progress Report.
Manual review should compare the inline and popup calendars on desktop, mobile
Safari and Android, including screen-reader selected/unavailable dates and month
announcements. Browser snapshots are not substitutes for that review.

## Following work

Validation summaries, multi-step forms and progress steps are next in the retained
priority queue. See [upcoming patterns](upcoming-patterns.md) for the remaining
families and separately scoped extensions to existing components.

## Implemented review checkpoint

The standalone calendar and form-associated picker are integrated into the sticker
sheet, isolated themed demo with source, generated API reference and Showcase Review
date. The picker composes the existing native date field, official button/icon and
responsive modal dialog. Shared option/input/button/overlay theme tokens remain the
source of visual behavior. Bounds, step alignment, keyboard/month navigation, SSR,
form reset and tentative FormData cancellation have focused browser coverage.

The standalone calendar's confirmation command also handles the already-selected
date; it is distinct from the sole en-change value transaction. Internal events
are encapsulated by the picker. Month controls remain focusable when unavailable,
with aria-disabled guarding activation, so reaching a bound does not discard focus.

Manual review remains open for touch editing, locale expectations and screen-reader
month/grid traversal. Current-year/time-zone context is application-supplied through
today; the component does not guess a user's clock during SSR. Next retained family:
validation summaries, multi-step forms and progress steps.
