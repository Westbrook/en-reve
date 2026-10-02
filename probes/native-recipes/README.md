# Packed native content and navigation recipes

This qualifies the documented lower-level [content](../../packages/primitives/docs/content.md) and [navigation](../../packages/primitives/docs/navigation.md) compositions against isolated package tarballs. It supplements the owning-element suites and the [first reusable-layer batch](../reusable-layers/README.md).

```sh
EN_EXECUTION_OUTPUT=/absolute/new/run tooling/test-pipeline/with-toolchain.sh npm run test:union -- --pathways=native-recipes
```

The pathway owns package builds, fresh fixture preparation, strict public-declaration compilation, the packed browser matrix and both original fixture owners. It requires the pinned toolchain and matching Playwright engines. It does not build the docs application or change product runtime code.

## Real consumer boundary

Preparation extracts `primitives`, `styles`, `tokens` and `elements` from shared verified tarballs into a fresh consumer installation. Only locked third-party dependencies are linked. Browser bundles and Node server templates resolve the public package entry points there. Checks reject workspace source, broad element barrels/catalogs, or navigation dependency on delivered elements. Content explicitly imports only `define/skeleton.js` for its authored loading placeholders; that dependency is part of the documented recipe, not implicit template registration.

The application explicitly loads Lit SSR's environment before importing the skeleton definition. Server templates are the maintained fixtures with TypeScript syntax removed; they retain public package imports. Each render gets fresh application state. Shared document-shell functions keep the original and packed fixture markup/style configuration aligned. The packed host serves actual generated HTML, CSS and minified browser modules. A legacy test URL `/packages/tokens/dist/index.js` redirects to the isolated public token bundle; it never serves workspace package files.

Both content and navigation are exercised with:

- Public Lit style adapters rendered into the document style root.
- Actual portable CSS files from the same tarball, served through native stylesheet links. The content stylesheet concatenates exported foundations/content files without transforming them.

This qualifies document-root native recipes. It does not imply every framework's SSR integration or every possible Shadow DOM composition.

## Behavior and evidence

| Composition | Public entries | Actual assertions |
| --- | --- | --- |
| Native content | `templates/content.js`; styles `content.js`, `content.css`, `foundations.css` | Ordered/unordered lists and numbering; metadata and omitted optional content; no invented selection/live semantics; server nodes and geometry retained through hydration; keyed identity and focus on updates; real native selection, actions and download; no-results recovery; long localized content at 320px enlarged RTL; nonempty decorative server placeholders without JavaScript, retained loading geometry and native checked state. |
| Native navigation | `templates/navigation.js`, `interactions/anchor-navigation.js`; styles `navigation.js`, `navigation.css` | No-JavaScript skip links and breadcrumbs; native focus/next Tab/fragments/history; wrapped RTL navigation and enlarged type; visible focus contours; measured sticky alignment; user-scroll priority over refresh; modified/new-tab and ancestor-canceled activation; distinct-query documents; nested scrolling, separate scopes, observer/disconnect cleanup and preservation of newer application CSS writes; full-theme reset while measured geometry remains. |

The [receipt](verification-20261002.json) records **78 packed browser passes**: six content cases and seven navigation cases, each with two style deliveries across three pinned engines. The same final run passes **39 original-owner cases** and **18 pathway/inventory controls**, plus semantic test types and isolated consumer type compilation. Earlier successful 57- and 78-case packed runs are retained as incremental evidence, not added to the final pass total.

Package identities, resolved declarations, per-entry dependency inputs, emitted asset hashes and each server-rendered document hash are retained. The [public-entry inventory](../reusable-layers/inventory.json) links the eight newly qualified entries to this receipt; existing foundational Lit-style qualification remains separately linked. Qualification means these named scenarios, not every export/method or all accessibility claims. Remaining entries and independently generated consumer examples stay open. Automated browser checks do not establish native AT speech, physical IME, mobile hardware, retail-browser support or manual acceptance.

The final `tooling,primitives` gate also passes 122 integrity checks and112 primitive contract checks, with primitive types and a fresh production docs build. Those Node checks supplement the browser assertions; they are not additional browser scenarios.
