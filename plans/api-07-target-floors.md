# API-07 — Remaining shared interaction target floors

Status: implemented, verified and published. This document records the target-floor slice; the decision register closes the complete original API-07 scope through the theme work and retained specialized contracts. User review remains separate.

## Contract

- `--en-control-min-size` supplies the shared control minimum, falling back to the size-selected semantic control minimum for ordinary controls. Compact specialized targets preserve their existing default geometry and honor an explicit shared minimum.
- `--en-size-target-min` always applies. `any-pointer: coarse` adds `--en-size-target-touch`; a smaller touch value cannot reduce the ordinary floor. A fine primary pointer with an available coarse pointer gets the same touch floor.
- Track, thumb, icon, color-indicator, and splitter-grip paint remains separate from the surrounding interaction target. Checkbox/radio/switch indicators keep their associated label as the larger target.
- Existing segmented and number-field outer-frame/inner-target contracts are preserved.

## Changed consumers

| Family | Repair |
| --- | --- |
| Shared controls | One internal target calculation, including ordinary and touch floors, consumed by shared control helpers and text envelopes. |
| Ranges | Shared minimum in both orientations; color sliders retain independent track/thumb geometry. |
| Choices and selection | Checkbox/radio/switch labels, tabs, accordion triggers, ratings, and segmented pointer floors. |
| Options | Menu/back/command rows, combobox trigger/options, native enhanced-select options, editor suggestions and token action buttons. |
| Navigation | Native and authored navigation links, disclosure summaries, breadcrumb touch targets and skip links. |
| Collections | Tree rows/loading geometry, drag handles and move selectors; pagination pages; carousel picker buttons; data-table selection column. |
| Color | Swatches, wheel controls and planes honor shared target floors when their component sizes or available space are small. |
| Layout | Split-view separator allocation respects touch/control floors while retaining the visible grip and pane ratio. |
| Calendar | Shared day minimum, nonoverlapping columns, matching range-band offsets and contained horizontal scrolling. Keyboard navigation reveals the focused date inside the calendar in LTR and RTL without scrolling the page. |
| Upload | File-drop interaction surface consumes the shared control minimum. |

The tree move form keeps native selects and their OS picker. Its closed-control appearance now uses the shared chevron because WebKit's native closed select ignored the minimum size and remained 23px tall.

## Migration

Existing themes with large control or touch minima will now enlarge previously disconnected targets. Calendar grids and bounded carousel picker rows scroll within their own surface when the requested targets cannot fit; they do not overlap or shrink the targets. Range-band painting, state precedence, and component geometry hooks remain independent.

There is no new public token. The customization registry points to the shared helper that now owns the direct `--en-control-min-size` consumption. Generated coverage remains source-checkable.

## Verification

- Dedicated browser matrix: Chromium, Firefox and WebKit with mouse and touch; Chromium with a fine primary pointer and coarse secondary capability, verified using actual media-query results.
- Both orientations of real sliders, calendar range endpoints, authored navigation and table-checkbox geometry.
- Shared minimum larger than touch, touch larger than control, and ordinary target larger than touch.
- Narrow calendar/picker layout and calendar keyboard visibility in LTR/RTL.
- Existing theme-composition and control-rhythm/size/icon regressions; baseline comparison for legacy family-geometry failures.

Commands:

```sh
npm run build -w @en-reve/tokens
npm run build -w @en-reve/styles
npm run build -w @en-reve/elements
npm run test:tokens
npm run test:tooling
npm run customization
npm run check:customization
npx playwright test --config packages/styles/tests/target-floors/playwright.config.ts
npx playwright test --config packages/styles/tests/composition/playwright.config.ts
EN_SIZE_TEST_PORT=47828 npx playwright test --config packages/elements/src/internal/tests/playwright.config.ts --workers=3
```

Final results: **49 target-floor browser cases, 69 composition browser cases, 126 token tests, and 47 tooling tests passed.** Token/style/element builds, metadata regeneration and customization freshness checks passed. The existing sizing run initially passed 41 cases; its isolated WebKit interruption passed on rerun (2/2 cases). The remaining 12 family-geometry failures reproduce with unchanged HEAD styles at `97766902a79212b1048335eb74301a9be77453d5`: exact Part selectors and historical family/frame precedence expectations are stale. They are recorded as pre-existing failures, not hidden or counted as passes.

Exact reports, baseline failures and source hashes: [verification evidence](./api-07-target-floors-verification.json).

The later [API normalization follow-up](api-normalization-followup.md) reconciles the 12 historical family-geometry failures against the accepted theme contract; all 12 corrected cases pass across three engines. The results above retain their original run context.
