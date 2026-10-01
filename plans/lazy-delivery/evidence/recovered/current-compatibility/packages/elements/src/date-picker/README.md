# Date picker

`en-date-picker` extends the native date field with a themed calendar dialog.
Register `@en-reve/elements/define/date-picker.js`; this includes its calendar,
dialog, button and icon dependencies. Class-only imports do not register elements.

```html
<en-date-picker name="review-date" value="2026-09-18" today="2026-09-14"
  min="2026-09-14" max="2026-10-30" required>
  <span slot="label">Review date</span>
  <span slot="description">Choose the team's next review date.</span>
</en-date-picker>
```

The input preserves the date field's native editing, `name`, `value`, `min`, `max`,
`step`, required/disabled/readonly behavior, validity methods, form reset and
restoration. `value` and FormData use YYYY-MM-DD; native editing follows browser
preferences. `locale`, `first-day-of-week`, `today`, `previous-label`, `next-label`,
`picker-label` and `close-label` configure the calendar's delivery. Supply `today`
explicitly for deterministic SSR and the user's time zone.

The official calendar-icon button opens the existing responsive dialog using its
same-root `for` association. Focus enters the current date. Selecting an accepted
date (including the same date) closes it; Escape and the dialog's close icon
dismiss without changing the field. The icon's accessible name comes from
`close-label` (default: “Close calendar”); no duplicate footer action is rendered. Focus returns to the trigger.
`showPicker()` and `hidePicker()` expose programmatic access. Disabled and readonly
fields cannot open the picker. Small screens use the shared responsive dialog.

Only the field's `en-change` is exposed as the value transaction. Internal calendar
and dialog events are encapsulated. `value` and FormData are already tentative
during the event; cancellation restores them and leaves the dialog open. An
application write takes precedence. Typed native drafts retain `en-input` and the
existing date-input validation contract. An invalid typed value and a date that
cannot be activated in the calendar are deliberately different interactions.

The date field's label/description slots and CSS Parts remain available, plus
`picker-layout`, `trigger`, `calendar`, `calendar-day`, `calendar-selected`, `surface`
and `close`. Existing input, option, button and overlay theme tokens apply.
Use `en-date-input` for the browser-owned picker only, or `en-calendar` for an inline
calendar without form editing. Time and multiple-date selection are later scope; range selection is supported below.

## Alternate display calendar

Set `calendar="buddhist"` for the modern Buddhist grid (ISO 1941 onward). The
accepted-date summary includes a Buddhist Era year, while the native input remains
a Gregorian edit route with a visible explanation. Its input layout follows the
browser; submitted `value` remains YYYY-MM-DD. Switching calendar never converts
or mutates the stored day. Out-of-interval values remain editable through the
native field and show an explanation instead of a misleading alternate grid.

`calendar-label`, `unsupported-label` and `edit-label` support application
translation. Parts `calendar-summary` and `edit-hint` style the supporting text.
Match Intl calendar capability, locale and deterministic today across server and
client. Alternate segmented editing and time entry are later slices; ranges are supported.

## Range selection

Set `selection="range"` and assign immutable ISO endpoints with `rangeValue = { start, end }`; the existing single `value` stays independent. First activation begins a draft, second completes an inclusive chronologically normalized pair. Inline calendars commit a complete pair; date pickers keep the draft until Apply range. Cancel or Escape restores accepted state. Same-day ranges are valid.

`en-change` carries previous/proposed pairs and supports atomic veto with authoritative application writes winning. `unavailableDate(iso)` applies to the whole interval, as do min/max and step. Availability is synchronous and cached; replace the predicate or call `invalidateAvailability()` when captured data changes. Predicate scans are bounded to 36,600 days; larger intervals are rejected explicitly. No such limit applies without a predicate.

In the picker use explicit `start-name`/`end-name` form names. Invalid, partial or empty pairs do not submit. Required means a complete valid pair; reset and restoration preserve paired values. `clearRange()` and the Clear range action clear the pair through a cancelable transaction. Gregorian and modern Buddhist presentation preserve ISO endpoints. Range Parts expose endpoints, inclusive range and preview, with matching `--en-calendar-range-*` fill overrides.

## Reset defaults

Single-date mode inherits `defaultValue`, reflected to the `value` attribute. Range mode uses property-only `defaultRangeValue` (an immutable copied `{ start, end }` pair), initially empty. A pristine range adopts default changes; `.rangeValue` writes and applied/cleared user selections preserve current state against later default changes. Reset restores `defaultRangeValue` and makes it pristine. To initialize a range that should be restored on reset, replace an initial `.rangeValue` binding with `.defaultRangeValue`. Loading into an already edited picker should set both properties. Application `error` persists across reset until explicitly cleared.

## Optional single-date calendar

The default and all range controls remain eager. For single-date fields whose
popup is often unused, set `calendar-loading="deferred"` before the first update.
The existing eager definition then defers calendar **construction**, while keeping
its code available. This avoids an extra network request on first opening.

For explicit code splitting, import `datePickerShellDefinition` from
`@en-reve/elements/date-picker-shell.js` and register it through your existing
`createElementScope`. It uses the same date-picker constructor, with dialog,
button and icon dependencies. It requires `calendar-loading="deferred"`;
the canonical definition, catalog and `define/date-picker.js` remain eager.
Mixing the eager and shell imports is supported but removes potential code savings.

```js
import {createElementScope} from '@en-reve/elements/element-scope.js';
import {datePickerShellDefinition} from '@en-reve/elements/date-picker-shell.js';
const scope = createElementScope({document});
scope.register([datePickerShellDefinition]);
const field = scope.createElement('en-date-picker');
field.calendarLoading = 'deferred';
field.label = 'Event date';
field.name = 'eventDate';
document.querySelector('form').append(field);
```

`preparePicker({retry: true})` imports/evaluates optional code without registering
or constructing it. Applications may call it at route entry or on intent, counting
that speculative traffic even when the calendar is never opened. `showPicker()`
coalesces pending opens and resolves after usable focus, or a canceled no-op;
loading/registration errors reject. `hidePicker()`, Escape, disconnect/adoption,
reset, disabled/read-only state and moving focus away prevent a late open.
Changing `calendarLoading` after the first update, or combining deferred mode
with range selection, throws. Use a fresh eager field to change that policy.

The current value and constraints are read again after loading. Native editing,
validation and form association remain ready. `loading-label`, `load-error-label`
and the `calendar-status` Part customize the local polite status. A real failed
module import can remain cached by the browser: retry is best effort; reload is
the recovery path if it fails. Registry conflicts also require correcting the
registration and creating a fresh scope/page; registry definitions cannot be undone.

After successful first opening, the closed calendar remains connected for repeat
use. Definitions and imported modules are shared; fields do not create individual
registries. Removing a field cancels pending work and releases its listeners.

For SSR, match the deferred attribute on server and client and use the ordered
`@en-reve/ssr/client.js` bootstrap before evaluating element classes. The server
omits the optional calendar; the native date input retains its identity and edited
value through hydration. Before the host upgrades, that shadow-tree input is
editable but does **not** submit to an outer form. Hydrate the essential shell
promptly; a no-JavaScript submission route needs an actual associated native input.

Repeated failures use `loadRetryErrorLabel` / `load-retry-error-label`, with
`{attempt}` replaced by the failed retry number (1, 2, …). Translate the whole
message and retain the placeholder so each failed retry produces distinct status
text. The initial failure still uses `loadErrorLabel`. Canceled and coalesced
openings do not count as additional failures; successful opening clears the count.
There is no announcement timer or additional focus movement.

## Guidance and errors at focus

Single mode associates field description/error with the native input, alongside
non-Gregorian edit guidance when needed. The calendar trigger remains a separate
action. Range mode associates field description/error with the actual native
trigger; the two modal endpoint inputs instead reference `edit-label` and the
current range rejection. Outer description content is not repeated on every
calendar control. Error clearing removes the invalid state and stale reference.

The trigger's cross-shadow element-reference association becomes available after
hydration in browsers supporting `ariaDescribedByElements`. Initial SSR retains
visible help and same-root endpoint instructions; it cannot serialize the
cross-root trigger association. See the [form guidance contract](../forms-private/README.md).
