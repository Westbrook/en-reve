# Combobox browser consumer verification

Build the public packages, then run from the repository root:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright node node_modules/@playwright/test/cli.js test --config packages/elements/src/combobox/tests/playwright.config.ts
```

The standalone server binds to localhost port 4405. `EN_COMBOBOX_TEST_PORT` overrides that port; `EN_COMBOBOX_TEST_OUTPUT_DIR` selects the evidence directory. No build, installation, or publishing happens inside this runner. The fixture uses a native import map, native stylesheet link, and an explicit public `EnCombobox` import/registration against built package output. It does not use a bundler, source aliases, or the element catalog.

Browser processes run in Chromium, Firefox and WebKit. They cover keyboard and pointer selection, accepted-value FormData, tentative cancelable changes, reentrant author writes, consumer cancellation and delayed acceptance, reset and fieldset disability, required validation, item replacement and retained unavailable selections, query restoration on Escape/Tab, read-only use, application-owned loading/failure, synthetic composition transitions, slotted labels/descriptions and the visually hidden label Part recipe, automated accessibility, native popover clipping/scroll alignment, narrow RTL, explicit versus premature validation paint, resize/manual-scroll behavior, consumer focus handoff, same-value supersession, optional clear/required recovery, native Popover fallback, nested-shadow scrollports, and pointer selection under an application-owned closed shadow root. The closed-root fixture keeps its own root reference solely to inspect outcomes around actual keyboard and pointer actions.

`content-rendering.spec.ts` retains its discovery name and now exercises eager
rows on fresh instances: native and keyed-row identity, first opening, reentrant
author writes, form/reset/composition behavior and lifecycle/registry ownership.
Eager SSR and delayed hydration are covered by
`packages/ssr/tests/combobox-content-rendering.test.mjs` and
`packages/ssr/tests/browser/combobox-content-rendering.spec.ts`. The Selection
workflow retains its existing 40-item catalog with eager rows; its SSR and
phone/tablet workflow checks exercise that consumer independently of this
native-module fixture. These functional checks do not establish performance
qualification or physical-device/assistive-technology acceptance.

The shared event API is `en-input` for editing drafts and one cancelable `en-change` for tentative selection. During `en-change`, the public value and FormData expose the proposed ID. Consumer cancellation restores accepted submission state while retaining the filter; explicit value assignments supersede rollback. There is no `controlled` property. The fixture observes the removed `en-request-change` name only to detect accidental dual dispatch. Query text never replaces the accepted form value. Same-shadow native label/description/active-option relationships are checked through rendered accessibility APIs. Invisible labels use consumer CSS on `::part(label)` rather than an invented attribute.

Synthetic composition events exercise component state transitions. They do not drive an operating-system IME, candidate window, mobile keyboard, dictation, or assistive technology. Current-minus-one engines, physical input environments, manual screen-reader review, and accepted visual baselines remain separate checkpoints. Production SSR/hydration and copied documentation-source execution have separate docs suites; this fixture intentionally isolates the native module consumer.
