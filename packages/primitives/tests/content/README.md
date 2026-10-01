# Native content recipe browser checks

Run from the repository root:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright npx playwright test --config packages/primitives/tests/content/playwright.config.ts
```

The isolated server uses port 4395 and current source templates/styles. It emits
Lit SSR markup with initial CSS inline, then hydrates the same template. It does
not require a coordinated application build or mutate user review state. Results
are written to `/private/tmp/en-content-breadth` unless `EN_CONTENT_TEST_OUTPUT_DIR`
is set.

Four journeys run in Chromium, Firefox and WebKit:

- JavaScript-disabled ordered/unordered and description-list structure, visible
  reversed numbering, omitted optional regions and authored media fallback.
- Hydration node identity and geometry; retained focus across layout updates;
  availability insertion/removal and media fallback replacement/restoration.
- Native sequential Tab order, selection geometry, a real local data-URL download,
  and no-results recovery through a consumer-owned button.
- 320px RTL with 150% root text, long localized filename, metadata and availability
  in both list/grid layouts; visible numbered markers and no document overflow.

Native test controls deliberately keep the recipe tests independent of custom
control registration. Application examples separately demonstrate `en-*` controls.
These checks establish browser DOM behavior; they do not simulate a screen
reader's native reading cursor or claim manual assistive-technology acceptance.
