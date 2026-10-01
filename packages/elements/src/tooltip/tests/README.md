# Shared tooltip warm-up browser checks

`context.spec.ts` adds trigger-ancestry subscription checks using the public
context entry: remote hosts, explicit-ID precedence, missing/non-containing IDs,
nested and undefined providers, late providers, provider replacement, reparenting,
shadow ancestry, focus/Escape, cancelable handoff and last-member cleanup. Run it
with the existing warmup and position cases; the new subset does not replace the
ID-based lifecycle matrix.

Run from the repository root:

```sh
EN_TOOLTIP_TEST_OUTPUT_DIR=/private/tmp/en-tooltip-warmup npx playwright test --config packages/elements/src/tooltip/tests/playwright.config.ts
```

The isolated fixture exercises actual pointer movement, native popover presentation, keyboard focus and touchscreen taps in Chromium, Firefox and WebKit. Playwright's paused browser clock advances the real component timers so the 300 ms first-hover delay and 500 ms group cooldown can be checked without wall-clock timing tolerances. WebKit uses the existing macOS all-controls `Alt+Tab` traversal preference.

Coverage includes immediate handoff after an accepted successor actually displays, retained old help when that successor is canceled/superseded or cannot open natively, a vetoed close without a duplicate delayed request, reentrant successor closing/regrouping that stops further peer dismissal, group and ShadowRoot isolation, standalone fallbacks, accepted versus canceled/superseded changes (including equal author writes), canceled native opening, Escape, focused group priority over pending/unattended peer hover, preservation of already displayed help while its trigger or content remains hovered, waiting-hover resume after blur or accepted Escape, canceled Escape retaining priority, reentrant focus during opening, reentrant hover during tentative canceled close, removal/rebinding/regrouping of focused ownership, real `en-toolbar` roving focus with `en-button`, content hover, safe transit, disabled triggers, and removal/replacement/reparenting/rebinding while an opening timer is pending. Touch taps may legitimately focus a button; assertions distinguish immediate focus from unwanted hover requests.

The `en-button` description assertion checks the native control's actual `ariaDescribedByElements` identity, because Playwright's DOM accessible-description calculator does not traverse that cross-root reference. This verifies the browser relationship, not a physical screen-reader announcement. Physical browser/assistive-technology review remains separate.

Escape coverage separates the current focus interval from each pointer encounter. Tests verify same-trigger fresh-hover reopening with native focus retained, normal hover exit and safe transit, immediate peer handoff, no reopening from pointer motion inside the dismissed encounter, repeated Escape, actual blur/refocus reset, native and `en-button` triggers, canceled/superseded dismissal, and temporary `for` rebinding with and without an intervening blur.

Stationary-pointer coverage checks inserted, revealed, replaced and repositioned native buttons and `en-button` triggers in cold and warm groups. Entry alone must not start hover interest; fresh movement starts the delay once, and further movement does not restart it. Touch movement does not establish hover interest.
