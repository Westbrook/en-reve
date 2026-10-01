# Component API reference

This private documentation page presents public source metadata from the retained Custom Elements Manifest (CEM). It complements the interactive sticker sheet; it does not establish that every documented component or API has completed acceptance testing.

## Data and ownership

`model.ts` normalizes the CEM into serializable reference data. It retains inherited public members, including `size` declared in the internal base class. It removes private/protected members, private-name fields, static members, and known browser/form/Lit lifecycle callbacks from consumer tables. It does not expand an external superclass, infer an event payload or cancellation policy, or fabricate a missing description/default. Undocumented public helpers remain identifiable metadata gaps; source owners must decide their supported visibility.

`scripts/generate-api-reference.mjs` first verifies the CEM against its source receipt. It then reads the actual catalog imports, follows CEM public barrel reexports, checks package export mappings and built JavaScript targets, and verifies each dedicated registration entry in the source AST. It never evaluates the component catalog or registers elements. A stale receipt fails with the instruction to run `npm run metadata`; missing builds/exports also fail rather than emitting an unverified import.

The generator writes `src/generated/api-reference.js` plus its declaration file only when their contents change. The documentation build must run after the element build and fresh metadata generation. Root preparation also copies the original `custom-elements.json` and `custom-elements.json.receipt.json` to the public asset directory. The raw file retains its original visibility annotations and source inventory; its digest describes that exact manifest, not the filtered reference model.

Inline examples reuse actual authored specimen render functions in isolated SSR documents. The disclosure reuses `generated/specimens.js` through `sourceCode()`, preserving the code used by the sticker sheet, including property bindings and event handlers. It does not create a second display formatter. Microlighter is imported only when the source disclosure opens. Additional components in a composition still require registration, and the surrounding specimen layout is application CSS. The adjacent Element controls panel uses generated public scalar metadata and an explicit authored target. It keeps drafts separate from confirmed component values; Apply writes the public property and Reset restores the exact authored scene. Read-only/complex or composition-owned values are explained as exclusions. See `../api-example/README.md` for targeting, silent writes, selective registration, independent theme/density controls, reset, and document isolation.

## Page behavior

`APIReferenceApp` has deterministic first-render state and no constructor/render access to browser globals. Static SSR displays the first alphabetically sorted component; after hydration, a valid `?component=en-…` chooses the requested component. Static output does not prerender every possible query variant. The browser entry registers only the page's badge, search input, select, segmented control, and button controls.

Search matches public tag/class/API names and descriptions. Filtering preserves the chosen component, even when it falls outside the results. The `en-select` changes selection through its public value API. Its tentative `en-change` is canceled synchronously; the application validates the requested component, updates the URL and selected article, then explicitly writes the accepted value. Nested component changes do not drive this selector. The page retains the search node/focus, updates one polite result count, and replaces only the selected article. No component class used as reference data is imported into the page.

The search query follows the same single-event ownership pattern: `en-change` updates the application query and explicitly writes the accepted value. A prior cancellation leaves the result list unchanged. Composition and unfinished native drafts remain local to the field until it proposes an accepted value. The Events section describes this contract for every component that records `en-change`, and distinguishes `en-input` draft observation where present. Neither a second control event nor an ownership attribute is required.

The section links stay at the top of the viewport while reading the component API. The shared anchor-navigation helper measures their wrapped height and offsets section targets accordingly; SSR remains in normal flow until measurement. Short viewports use a horizontally scrollable row to leave space for the API content. Native fragment links retain URL, history and keyboard focus. Changing the selected component reconnects the scoped helper without replaying a previous section jump.

`toolbar.ts` explains button-only roving and mixed-control Tab delivery, SSR semantics, automatic discovery limits, and links the complementary mixed-toolbar example while retaining the primary command demo.

`pagination.ts` adds authored usage guidance to the generated pagination tables and a sticky “Layout and consumption” jump. It documents the three container layouts, every public distribution part, the alignment token, slot/accessible-name ownership, chooser dismissal and cancellation, unknown totals, SSR and RTL. Its links lead to the actual API tables and shared isolated example rather than duplicating a second demo.

The page uses native headings, links, disclosure elements and tables. Table captions, column headers and member row headers remain intact at narrow widths. Long code and types wrap; any independently overflowing table region receives a keyboard tab stop. There is no ARIA grid or custom table keyboard model.

`?progress-report` retains the existing developer return link and is forwarded to documentation links. Default token CSS paints this page; it does not import the theme compiler or change preview scope.

## Verification

The focused model tests cover public/private inheritance boundaries, missing versus explicitly recorded defaults, CSS syntax, search stability, and declaration identity. Generator tests cover package exports, relative/package-root CEM aliases, cyclic reexports, deterministic current-package generation and real authored example links.

`tests/api-reference.spec.ts` exercises production SSR without JavaScript, post-hydration selection/search, native-slot API visibility, manifest/receipt downloads, lazy source highlighting, pagination guidance-to-table navigation and responsive inline pagination interaction, and 320 CSS-pixel table layout in the configured Chromium/Firefox/WebKit projects. The inline demo processes in `tests/api-inline-examples.spec.ts` additionally cover per-demo state preservation, reset, modal containment, native link recovery and keyboard traversal. Parent and embedded documents have separate accessibility scopes and heading hierarchies. They do not constitute manual screen-reader testing, copied-import execution in every framework, current-minus-one browser coverage, or proof of complete component API documentation.
