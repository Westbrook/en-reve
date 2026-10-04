# Rating

`en-rating` exposes native radio choices for a score and a separate “No rating” choice. Positive-score targets are square and preserve the shared control and interaction target minimums, including coarse-pointer sizing. Larger glyphs, padding and borders from the token system grow both dimensions together. The stars may wrap when the available width cannot fit their accessible targets.

## Star shape

The optional managed token `component.rating.star-radius` maps to `--en-rating-star-radius` and falls back to `radius.control`. Pin it to `radius.pill` for circles, zero for square corners, or a smaller radius for softly rounded squares. It follows normal root, scoped and component-level theme rules and leaves the clear choice unchanged.

```css
en-rating.circular {
  --en-rating-star-radius: var(--en-radius-pill);
}
en-rating.rectangular {
  --en-rating-star-radius: 0;
}
```

`::part(star-option)` exposes each positive-score target for direct CSS customization. `::part(clear-option)` exposes “No rating”; the existing `::part(option)` still addresses both. The visible focus outline follows the target's border radius. Keep changes to target dimensions and glyph sizing consistent so the glyph remains contained and hit areas remain usable.

`::part(star)` exposes every decorative glyph. `::part(star-filled)` additionally identifies each star included in the current normalized score, including while disabled; it follows initial server rendering, native changes, application writes and reset. It does not represent a hover preview or the individually checked radio. The selected glyph input is `--en-color-action-text`; empty and ordinary disabled glyphs use `--en-color-text-muted`. Theme companions may refine those defaults on the glyph Part. Public `--en-rating-pressed-*` properties remain authoritative over companion held-state defaults, including when inherited from the host.

The shape changes do not replace the native radio group or its keyboard behavior. Arrow keys select a score; the clear choice selects zero. User changes dispatch the single cancelable `en-change` event. Slotted label and description content, form association and the `size` API remain available.

## Native-aligned form contract (API-03)

`defaultValue` reflects the `value` attribute; checkboxes, switches and standalone radios instead use `defaultChecked` and `checked`. Defaults update current state while pristine. A current-state assignment (including the same value), user editing or browser restoration makes it dirty. Later default changes preserve the current value/draft; uncanceled form reset restores defaults and makes it pristine again. Defaults and current-state writes are silent. Numeric defaults retain the component's existing clamp/snap rules.

All form-associated controls expose `form`, `labels`, `validity`, `validationMessage`, `willValidate`, `checkValidity()` and `reportValidity()`. `name`, supported `required`, and `disabled` reflect. Set `error` to invalidate a value for an application rule and show associated `::part(error)` feedback. Clear it explicitly with `error = ''`; reset does not clear application errors. `validationText` changes existing constraint feedback only. A zero rating is a defined score; sliders and ratings do not gain a `required` constraint.
