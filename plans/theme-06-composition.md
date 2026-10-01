# THEME-06 — Customization through composition

[Review live components](/theme-composition.html?progress-report). Built on THEME-01–05; additive customization reach does not imply approval or publication.

## Contract and migration

- The existing `--en-editor-toolbar-gap` now reaches the nested toolbar base. Unpinned spacing uses `space.1`; validation uses the semantic danger-text role and its generated default.
- Token/rich editors select an absolute local size: absent size is medium, `inherit` is explicit. Shared input background/color/inline-padding refine shared control defaults (THEME-02). Field gap and additive label/control Parts work while multiline minimum/maximum geometry stays independent. Token editors use input typography, including its intentional 16px default floor; rich documents use body typography.
- Suggestions consume option block/inline padding, list gap, concentric radius, inset/focus clearance, maximum height, and overlay foreground fallbacks. Viewport-available height remains a separate mechanical ceiling. Custom picker layouts remain author-owned.
- Color slider target floors include the shared control minimum and `any-pointer:coarse` touch minimum without coupling track/thumb dimensions. Picker/plane/slider radius follows component override → shared control radius → size-selected semantic radius. Wheel labels consume the strong-label weight role.
- Ordinary single-date controls (native `.en-calendar` recipes and custom elements) use the shared option paint precedence: disabled, pressed, hover, selected, rest. State-specific refinements beat broad pins. There is no separate active-selection state: moving keyboard focus is not selection. Existing calendar hover/pressed tint and disabled opacity remain specialized. Range bands/endpoints retain their independent painting and geometry; native range recipes mark the wrapper `data-selection="range"`. Forced colors retain system paint and focus.

Existing inherited input/option/typography pins now affect formerly disconnected consumers. That can intentionally change appearance. Broad option paint now reaches selected single dates; supply selected/hover/pressed refinements when contrast is needed. Existing explicit component pins remain authoritative. No managed tokens are added; CSS-only contracts remain CSS-only. Full/partial resets and property registration are the existing THEME-01/04 contracts.

## Composition Parts

API-06 supersedes the original compatibility-alias policy for this prerelease. See the [canonical contract and migration](api-06-customization.md) for removed names.

| Component | Existing Part preserved | New reach |
| --- | --- | --- |
| Token/rich editor | `label` | `control` is the canonical editable surface; API-06 removes `editor`. |
| Data table | `surface`, `pagination` host boxes; `viewport` | `table-surface` reaches the bordered box; `pagination-control/previous/page/next` reach native actions. |
| Presence group | `overflow` host | `overflow-control` reaches the native button. |
| Color slider | `editor`, `editor-field` | `error` reaches nested validation. The September 19 follow-up forwards `editor-label` to the exact-value field label, combining setting name and qualifier; ordinary slider qualifier semantics remain unchanged. |
| Color plane/picker | Existing channel host/input/gradient Parts | `channel-error` crosses every owned boundary, including picker → plane → slider → field. |
| Color picker | Separate guidance and validation | `hex-description` and `hex-error` are canonical; API-06 removes merged `error`. |
| Text field | `description`, `error` | API-06 forwards each once under its scoped picker name and removes the redundant source aliases. |

Part attributes are token lists. Use `::part(error)` externally and `[part~="error"]` in internal inspection tooling. Host layout Parts are not interchangeable with native control/surface Parts; none are repointed. Consumer-owned slotted content retains its ownership and typography.

## Typography membership

| Consumer | Decision |
| --- | --- |
| Native opt-in tables and data-table content | Data family, size, line height and weight. Table header/caption strong-label weight remains distinct. |
| Token editing surface | Input typography, with independently sized multiline geometry. |
| Rich document paragraphs/lists | Body typography and semantic spacing. |
| Rich h1 / h2 / h3 | Large / medium / small heading roles. Roles describe visual hierarchy; document heading semantics remain unchanged. |
| Suggestion descriptions | Metadata typography. |
| Calendar heading and wheel label | Strong-label weight. |
| Presence status/time, calendar weekday/range-status, toast-history heading | Preserve existing compact annotation/heading treatments. They are not newly promised as consumers of the metadata role. |
| Rich node selection outline | Action color, distinct from keyboard focus; remove the unsupported focus-ring token spelling. |

No wholesale naming migration, global status/disabled token vocabulary, or rich-document schema change is included. Calendar range treatments and compact annotation mappings above are deliberate retained contracts, not untracked completion claims.

## Verification

`packages/styles/tests/composition` exercises actual rendered hooks/Parts, keyboard suggestion choice, pagination, single-date state overlap, specialized ranges, nested full/partial boundaries with compatible registration, forced colors, selected-size radii, and coarse targets in both orientations. Existing editor/calendar/color/form/table regressions and metadata/token/tooling checks validate integration. Original THEME-06 verification covered legacy and new hex aliases together. API-06 replaces the ambiguous merged mapping with one-to-one forwarding; the updated composition tests verify distinct guidance and validation targets across all three engines.

Reproduce the focused and integrated checks from the repository root:

```sh
npm run build
npm run test:tokens
npm run test:tooling
npx playwright test --config packages/styles/tests/composition/playwright.config.ts
EN_WORKFLOW_TEST_PORT=4487 npx playwright test --config apps/docs/tests/theme-composition.config.ts
```

The integrated config includes the review page plus editor, calendar, range, color, form and table regressions. The review page is checked at 1440px and 390px in Chromium, Firefox and WebKit, with light/dark accessibility scans and the flagged/unflagged Progress Report return link. One existing Firefox data-table touch test remains skipped; the focused composition suite independently exercises color-slider coarse targets in all three engines.
