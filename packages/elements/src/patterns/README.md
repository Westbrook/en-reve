# Component patterns

See [implementation contracts](../../../../plans/component-gap-implementation.md) and [the delivery plan](../../../../plans/component-gap-closure.md). The runnable documentation is `/component-patterns.html`.

Run the focused browser tests from the repository root:

```sh
npx playwright test -c packages/elements/src/patterns/tests/playwright.config.ts
node --test packages/primitives/tests/component-patterns.test.mjs packages/ssr/tests/component-patterns.test.mjs
EN_SSR_TEST_PORT=4497 npx playwright test -c packages/ssr/playwright.config.ts component-patterns.spec.ts
```

Build styles, primitives, elements and SSR before running Node/SSR tests. The standalone gallery check uses the built documentation on port 4480:

```sh
npx playwright test -c probes/component-patterns/playwright.config.ts
```

`en-toggle-group`, `en-checkbox-group`, `en-multiselect` and `en-selection-collection` share one aggregate value/validation owner. Use `en-choice-option` children or a stable `.items` array. Do not place links inside a checkbox label or interactive controls inside a listbox option. Selection collection action slots provide a separate action boundary.

An interval owns two ordered endpoints. Both form entries share its name, in lower/upper order. Query builder and questionnaire expose application values and intents, rather than claiming native form submission or remote persistence. The media viewer, sheet and hover card reuse the existing modal/nonmodal surface lifecycles.
