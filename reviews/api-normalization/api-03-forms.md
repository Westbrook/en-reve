# API-03 — Native-aligned form state and validation

Status: implemented, verified, integrated into main and published for review. User review remains separate.

## Contract

The native reference is the [HTML input dirty-value, checkedness and reset algorithms](https://html.spec.whatwg.org/multipage/input.html#the-input-element).

- `value` attributes define `defaultValue`; `checked` attributes define `defaultChecked`. Default properties reflect synchronously. Defaults initialize pristine controls and subsequent default/attribute changes update pristine current state.
- `.value` / `.checked` assignments, including equal assignments, mark current state dirty. User editing also marks it dirty, including drafts awaiting acceptance. Changing a default then preserves current state and drafts.
- A successful native form reset restores defaults and clears dirty state. Canceling the form's `reset` event preserves current state and dirty flags. Browser restoration is a silent current-state write and does not change defaults.
- Current state, defaults, reset and browser restoration do not emit synthetic `en-change` or `en-input`. Existing tentative user-change transactions remain intact.
- String fields keep strings, slider/rating/color-slider keep numbers, and choices keep boolean checkedness plus a separate submitted string value. Numeric reset values continue to use existing clamp/snap rules; API-03 does not change slider fallback to the native range midpoint.
- `name`, `required` where supported, and `disabled` reflect consistently. The public form facade is `form`, `labels`, `validity`, `validationMessage`, `willValidate`, `checkValidity()` and `reportValidity()`.
- `.error` / `error` supplies an application error, sets `customError`, and displays an associated `error` Part. Clearing it removes only application invalidity; independent constraint failures remain. Reset does not clear application errors, matching the persistence of native custom validity.
- `validationText` / `validation-text` supplies localized constraint feedback; text alone does not cause invalidity. Sliders remain always-defined numeric settings without an added `required` API.
- Radio groups own their children's selection and form submission. Group defaults use `defaultValue`; standalone radios use `defaultChecked`.
- Date-picker range mode uses property-only `defaultRangeValue`, initially empty, with the same pristine/dirty policy. Assigning `rangeValue` no longer silently establishes its reset default.
- Files reset to an empty selection and retain their existing file API; there is no writable file default. Calendar/color paint controls that are not form-associated retain their existing domain APIs.

## Migration

Before API-03, fields captured the first rendered property value as the reset value, while choices/numeric controls read current attributes on reset. This compatibility change replaces that split with explicit defaults. Property-only initialization now means current state only:

```js
// Previously this also established a text field's reset state.
field.value = saved.title;

// Establish a default explicitly. A pristine field also adopts it immediately.
field.defaultValue = saved.title;

// Loading a different record into an already edited field:
field.defaultValue = saved.title;
field.value = saved.title;
```

Use `.value` or `.checked` to update an edited control now. An attribute update changes its reset default and no longer overwrites an edit. Existing declarative initial `value` / `checked` markup keeps its meaning. CSS attribute selectors represent defaults; inspect the live properties for current state. Property writes to declarative form configuration now also update attributes and may notify MutationObservers.

```js
slider.error = 'Your plan allows a maximum of 50';
slider.checkValidity(); // false even when its numeric value is within min/max
slider.error = '';      // clears only the application error
slider.validationText = 'Enter a number within the allowed range';
```

These are design-system conveniences over native semantics: `.error` includes visible feedback, and existing `en-change` remains a cancelable proposal. This change does not turn it into native noncancelable `change`, change domain value types, or add a native `setCustomValidity()` alias.

## Verification

Focused browser tests live in `probes/api-forms`; they compare native and custom defaults, test every form-control family, and exercise validation, reset and drafts. Existing family, transaction, SSR/hydration and metadata checks provide regression coverage. Results: 126 focused browser checks pass across Chromium, Firefox and WebKit. Existing choice, native-field, slider, rating, combobox, API-02 transaction, date-range, time-field, color-editor and file-upload regression suites pass (three existing skips retained). SSR, hydration, metadata and tooling checks also pass. See `artifacts/api-03/verification.json` for counts and logs. Automated accessibility associations and validation focus were checked; no new manual assistive-technology review is claimed.
