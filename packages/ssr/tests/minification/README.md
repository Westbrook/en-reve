This fixture is built for production twice with the shared `minifyLitTemplates`
plugin: once for the client and once for server rendering. Both graphs bundle
the library packages and keep Lit/SSR/signals external on the server. The final
HTML goes through `createDocumentMinifier`, including actual resolved styles.
The ordinary source-based SSR fixture remains a separate route and registry.

Two maintained Playwright scenarios run in Chromium, Firefox and WebKit:

- Hold the production client entry request; edit the actual server-rendered
  text field and textarea; hydrate and verify native node identity, focus,
  selection, draft and FormData. Then exercise keyed nested templates, quoted
  attributes, boolean/property/event bindings, CSS fragments, native selection,
  logical RTL, slotted styling and light/dark color selection.
- Exercise inline word boundaries, explicitly preserved inherited `pre-wrap`,
  pre/code/textarea whitespace, and raw tab-indented source displayed via
  `static-html`. Open the native disclosure, run the actual highlighter, select
  its original source text, and check CSS highlights without replacing text.

The unquoted `value=path/>` guard intentionally expects `path/`; HTML treats the
slash as part of an unquoted attribute value. The fixture is a parsing guard,
not a recommended authoring pattern.

Run after library packages have been built:

    PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright npx playwright test --config packages/ssr/playwright.config.ts minification.spec.ts --reporter=list,json --output=/private/tmp/en-minification/browser-results/artifacts

Set `PLAYWRIGHT_JSON_OUTPUT_FILE` to retain the JSON report outside the checkout.
`EN_SSR_MINIFIER_FIXTURE_DIR` optionally relocates the cached production fixture.
The build helper runs in a child process because SSR custom-element registries
must remain independent. It does not rebuild or modify the documentation dist.

`appearance: base-select` is checked only where its associated picker selector
is supported; fallback behavior remains part of the assertion. This bounded
fixture does not establish the full browser/device matrix, physical IME use,
manual assistive-technology results, native OS picker behavior, or the complete
consumer application surface. The existing workflow and documentation source
highlighting suites remain complementary production checks.
