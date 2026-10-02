# Safari input and focus observations

The [October 2 receipt](verification-safari-boundary-20261002.json) is **incomplete**.
Safari 27.0 passed four HTML consumer cases, then the native select keyboard case
failed. The remaining 55 planned cases did not run. This is neither a Safari
qualification nor a confirmed library or browser defect.

## Preserve native focus rules

Safari does not need to display the same focus treatment as Chrome. Keep these
observations separate when testing:

| Observation | What it establishes |
| --- | --- |
| Focus ring and `:focus-visible` | Visible treatment for the current interaction modality; absence alone does not prove input failure. |
| Tab destination | Navigation under the current browser and system keyboard settings; do not silently change those settings. |
| `activeElement` | DOM focus target, including the relevant shadow root. |
| `document.hasFocus()` | Document focus context; a false value alone establishes no defect. |
| Trusted click and resulting state | Whether the requested native pointer action reached the page and activated its control. |

No Chrome-style ring or Safari preference change is required by this investigation.
The runner records actual pointer coordinates, target geometry, trusted click
paths and document focus. It requires a visible document and the existing fixture
readiness marker. It does not synthesize clicks to bypass native input.

## What was observed

- The earlier hidden-window condition did not recur in the final run. No browser
  configuration was changed; the cause of that environment change is unknown.
- End/Enter left SVG selected in both a plain native select and the component.
  Native typeahead could select PDF. Closely spaced searches retained a typeahead
  buffer, and typing the initial `p` could select PNG before the full `pdf` query.
- Some native pointer actions produced no page click event. Their traces also
  recorded `document.hasFocus() === false`; that correlation is not a root cause.
  This occurred after Tab in some experiments and during an ordinary checkbox
  sequence before any select interaction in another. Tab is not the sole
  established cause, and visible focus styling does not explain these traces.
- Extra owned-window selection, WebDriver element-click and script focus did not
  establish reliable input delivery. These experiments were discarded. The final
  runner retains its original End/Enter case and native coordinate actions.

Intermediate experiments retain their original failures. A diagnostic “pass”
means observations were collected, not that expected component behavior passed.
Only the final acquisition and two Firefox regression runs bind the retained
runner source. Both actual Firefox releases pass all 60 consumer cases each.

## Next acquisition

Inspect input delivery in the isolated Safari automation window alongside a plain
native control before repeating the consumer matrix. Record the existing keyboard
navigation settings and interaction modality, without changing them to match
another browser. If native input is reliable, distinguish Safari-native selection
behavior from a component regression using the paired control. Keep the original
failed receipts and separately qualify any revised native interaction recipe.

[Apple's WebDriver documentation](https://developer.apple.com/documentation/safari-developer-tools/webdriver)
describes isolated automation windows and their interaction boundary. The current
evidence does not identify a particular Safari bug. Full Safari reference workflows,
native accessibility semantics, preceding Safari and physical/manual acceptance
remain open. The qualified production build is reused unchanged.
