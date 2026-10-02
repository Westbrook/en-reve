# Packed table and virtual-collection recipes

This exercises the maintained [table/list demo](../../apps/docs/src/virtual-collection-demo.ts) and [document-scrolling demo](../../apps/docs/src/document-scroll-demo.ts) as application-owned compositions of public primitives. It supplements delivered-element and unit suites and advances [verification §7.4](../../plans/verification.md).

```sh
EN_EXECUTION_OUTPUT=/absolute/new/run tooling/test-pipeline/with-toolchain.sh npm run test:union -- --pathways=collection-recipes
```

The pathway builds packages, extracts verified tarballs into a fresh consumer installation, compiles the actual fixtures against packed public declarations, and serves minified production ESM. Only locked third-party dependencies are linked; assertions reject workspace source aliases and broad element entry points. The table application explicitly registers its seven authored element dependencies. The document-list entry has no delivered-element dependency. Generated dependencies of those explicit elements retain their normal definition contracts.

The server explicitly installs `@en-reve/ssr/install.js` before component evaluation and uses public `renderToString()`. The client installs Lit hydration support before loading the application module. Initial table state is identical on each side; the no-JavaScript and delayed-hydration assertions verify useful native controls and exact server-node preservation. The application emits a full theme at the document root through the public token API. The list page retains its original authored HTML, changing only its module URL to the packed bundle.

## Behaviors verified

| Composition | Public modules | Maintained assertions |
| --- | --- | --- |
| Table/list | `state/table`, `interactions/table`, `templates/table`; `templates/virtual-collection`; `styles/table.js` | 10,000 keyed records; native SSR rows and metadata; exact hydrated row/checkbox/input identity; cancelable checkbox rollback; selection through distant scrolling, sorting and prepending; stable measured anchors through density changes; native paginated reading; narrow RTL; removal and usable surrounding rows; bounded idle rendering; exact focus retention during reorder; actual Tab/Shift+Tab continuity around an offscreen focused record; start/center/end/nearest reveal without selection/focus changes and missing-key no-op. |
| Document and element scrollports | `state/virtual-collection`, `interactions/virtual-collection`, `templates/virtual-collection` | Preceding layout movement without a total-document-height change; row-height anchoring; offscreen non-interference; smooth reveal interruption and sticky insets; retained offscreen focus; removal recovery; disconnect observer cleanup and exact CSS priority/tabindex restoration; bounded element scrolling. Each runs at 1280px and 390px in all three engines. |

Both configurations use the original assertions, not a copied weaker suite. The table readiness check waits for the actual authored host's definition/update instead of a docs-shell wrapper. Its traversal audit selects an actual visible row after native scrolling instead of assuming that 3600px always means row45. The nearest-scroll assertion waits for the accepted previous reveal's measured geometry to settle; its two-pixel no-movement tolerance and missing-key exact no-op remain intact.

[verification-20261002.json](verification-20261002.json) records the exact qualification, package/declaration/input/asset identities and earlier failed attempts. The matrix passes **81 cases**: 17 table/list cases per engine plus five document-scroll cases at two widths per engine. The inventory adds seven public entries with **bounded scenario** qualification. Existing selection and typography qualification stays attached to its original receipt. Portable `table.css`, unexercised table operations and other public entries remain separate work.

These fixtures are maintained application compositions, not generated documentation examples. The independently generated-example requirement stays open. Playwright WebKit is not retail Safari; phone-sized viewports are not physical devices. DOM identity/ordering and native Tab checks do not close the known VoiceOver reading-cursor issue or establish manual AT acceptance. Synthetic Firefox wheel limitations remain disclosed in the original test. No performance conclusion or whole-library support claim follows.

The original production-docs owner also passes all 51 cases with the shared test changes. The final gate passes 20 pathway/inventory controls and 112 primitive checks, strict packed consumer compilation, semantic checks and a fresh docs build. Six existing type diagnostics in the exercised test were resolved; other documented diagnostics remain tracked separately.

All 123 final tooling/evidence integrity checks pass. Historical native-recipe orchestration/inventory inputs are archived byte-for-byte at their original commit so extending the current graph does not rewrite an earlier qualification.
