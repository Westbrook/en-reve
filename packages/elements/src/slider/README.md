# Slider and exact-value editing

`en-slider` exposes one accepted numeric `value`, one form entry, and a native range input. Range input dispatches a single cancelable `en-change` for each adjustment with reason `input`. During dispatch, `value`, the range and form data expose the proposed number; cancellation restores the previous number. An uncanceled event accepts the change. Programmatic writes are silent and authoritative, including same-value writes made during the event; such writes supersede rollback. A nested accepted change also supersedes the outer transaction. Values supplied by applications or the range follow the shared min/max/positive-step normalization.

```html
<en-slider name="opacity" value="64" min="0" max="100" step="1"
  editable>
  <span slot="label">Layer opacity</span>
  <span slot="editor-label">Exact value</span>
  <span slot="description">Press <kbd>Enter</kbd> to apply an exact value; <kbd>Escape</kbd> restores the current value.</span>
</en-slider>
```

`orientation="vertical"` puts the minimum at the bottom and maximum at the top in both left-to-right and right-to-left layouts. Omit `orientation` for the horizontal default; removed or unsupported values also render horizontally. Labels, descriptions, output and the optional editor retain the surrounding text direction. Switching orientation preserves the accepted value, editor draft, focus and native input nodes.

```html
<en-slider name="volume" orientation="vertical" value="64" min="0" max="100"
  editable show-value>
  <span slot="label">Volume</span>
  <span slot="editor-label">Exact volume</span>
</en-slider>
```

The native vertical range handles pointer, touch and keyboard input. Up increases and Down decreases the value; Home and End choose the bounds. Left/Right and Page keys retain the browser's native behavior. Orientation does not add a Tab stop or change proposal, cancellation, form or editor behavior. The native control receives `aria-orientation` in the initial server-rendered markup.

Set `--en-slider-length` to customize a vertical range's length; its default comes from `--en-size-range-length`. The range retains the shared minimum target size. The optional editor and output sit below the vertical range; the editor keeps its regular horizontal presentation. Existing `control`, `row`, `editor` and `output` Parts remain available for focused customization.

Vertical rendering uses [`writing-mode: vertical-lr` and `direction: rtl`](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Writing_modes/Vertical_controls) on the range input. It does not rotate the component or replace native range interaction with a custom gesture handler. Older embedded engines that lack vertical native form-control support would need a separately evaluated fallback.

The `description` slot accepts supporting phrasing content and falls back to the `description` attribute/property when unassigned. Its text describes both the range and the optional number editor; editor validation remains a separate associated message. Removing assigned description content restores the fallback. Help links belong in the description, outside the label, and remain independently keyboard-operable.

Keep inline text, formatting, and links together inside one element with `slot="description"`, such as a `span`. Multiple directly assigned description elements render as separate help blocks.

`editable` adds a native number input with the same bounds and step. The setting label names both controls; the editor appends the localizable `editor-label` qualifier, which defaults to “Exact value.” The range and editor are two native Tab stops. `focus()` continues to focus the range. The `editor`, `editor-label`, `row`, and `error` Parts support focused styling alongside the existing range, label, description and output Parts. Internal nodes and IDs remain private.

Typing emits `en-input` with the current native string draft, composition state and input type. It does not change the accepted number. Native change, blur or Enter attempts completion with reason `change`; Enter prevents implicit form submission outside composition. A completed finite number must satisfy native number, min, max and step validation. Empty, incomplete, out-of-range and off-step drafts stay visible for correction and produce associated error text on attempted completion. `validation-text` can provide a localized constraint message; its empty default uses the browser's native message.

Canceled `en-change` events retain the native draft. Cancellation must happen synchronously. To await approval, an application cancels immediately and assigns `.value` later. Listeners see tentative numeric state; application effects such as saving should account for later cancellation. A listener can assign an authoritative `.value`, including the same number, to supersede the current transaction and reconcile the draft. Repeated derivative change/blur events after one completion do not issue duplicate proposals. A later deliberate Enter can retry. Equivalent valid spellings of an already accepted number canonicalize on completion without a change event.

Escape discards the draft and restores the accepted number. An authoritative `.value` write, including a same-number write, also reconciles the editor. Accepted range changes reconcile both surfaces; a canceled range adjustment restores the range while preserving the text draft. Native composition is preserved until composition ends; Enter/Escape during composition do not interrupt it. Unrelated rerenders do not replace the editor or rewrite its editing value.

The number editor is required internally because this setting always has a numeric value. Its current invalid draft makes the form-associated host invalid and supplies its validation anchor. The submitted entry remains the accepted numeric value; the number input has no independent form name. Native form validation therefore blocks invalid drafts while `new FormData(form)` still reports the accepted value. A valid pending or canceled draft does not automatically become accepted when an application calls `requestSubmit()`; submission is not an implicit editor completion hook.

Uncanceled form reset discards the draft and restores the `value` attribute default. Applications that own reset cancel the form's native `reset` event before assigning their desired state; canceled reset preserves both the value and draft. Browser restoration writes authoritative state and reconciles the draft. Disabling retains the draft while omitting the form entry and validation; re-enabling revalidates it. Bounds changes retain and revalidate the draft unless they must normalize the accepted value. Turning `editable` off discards the editor draft and editor-only validation.

`value-text` describes the accepted range/output value only. It is not copied to a differing numeric draft or parsed as units. `show-value` remains independent of `editable` and displays the accepted value when enabled.

Server rendering supplies native initial `value`, min, max and step attributes. The number editor's default value attribute is stable after initialization; its live value belongs to the shared editing controller. A differing native pre-hydration value is adopted as an unaccepted draft, preserving ongoing edits until the normal completion boundary. Browser/SSR verification and manual assistive-technology review are tracked separately; these contracts are not a claim of device or screen-reader certification.

## Native-aligned form contract (API-03)

`defaultValue` reflects the `value` attribute; checkboxes, switches and standalone radios instead use `defaultChecked` and `checked`. Defaults update current state while pristine. A current-state assignment (including the same value), user editing or browser restoration makes it dirty. Later default changes preserve the current value/draft; uncanceled form reset restores defaults and makes it pristine again. Defaults and current-state writes are silent. Numeric defaults retain the component's existing clamp/snap rules.

All form-associated controls expose `form`, `labels`, `validity`, `validationMessage`, `willValidate`, `checkValidity()` and `reportValidity()`. `name`, supported `required`, and `disabled` reflect. Set `error` to invalidate a value for an application rule and show associated `::part(error)` feedback. Clear it explicitly with `error = ''`; reset does not clear application errors. `validationText` changes existing constraint feedback only. A zero rating is a defined score; sliders and ratings do not gain a `required` constraint.

## Slider presentation

The optional `--en-slider-track-*`, `--en-slider-fill-*`, and `--en-slider-thumb-*` hooks separate rail, selected segment and thumb paint/geometry. State-specific hover, held, combined, disabled and shadow hooks are documented in [styles](../../../styles/README.md). Visible thumb size does not change the protected input target. `control` continues to expose the real native input; its internal thumb pseudo-elements are not additional Parts.

`en-slider` projects its accepted or tentatively staged number to `--en-slider-value-percent` on that input, including cancellation, reset and server-rendered initial markup. This percentage is component-owned state, not a managed theme pin or an alternate value API. Native `.en-range` consumers explicitly call the pure-import `syncRangePresentation(input)` helper after live-value changes. A source theme may style visible geometry and state while native keyboard, form and endpoint-travel behavior remains intact.
