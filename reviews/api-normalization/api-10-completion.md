# API-10 completion: one public API contract

The remaining API-10 implementation is complete. The original supplemental type
snapshot was only the first slice; this change joins it to source metadata,
registration, supported package entries and authored event behavior. Human review
is still separate from implementation and publication.

## Before and after

Before, `DateRange` type changes were detectable, but docs and release review still
resolved CEM references separately, event payload annotations were incomplete,
extractor changes could pass a source-only freshness check, and rendered Parts
coverage was limited to selected controls.

Now `public-api.json` binds all 77 catalog components to the same checked CEM,
reachable TypeScript declarations, canonical registration dependencies, typed event
contracts and supported-entry policy. Docs verify and consume this graph. Release
review adds explicit facts for dependency, event behavior and entry-policy changes;
mismatched or one-sided graph evidence fails rather than silently reducing coverage.

## Finding closure

| Finding | Implemented disposition |
| --- | --- |
| T1 | Source `@internalEvent` classification feeds docs, graph and release filtering. Toast coordination stays private; the editor's direct-host toolbar request remains a documented supported association. |
| T2; FORMS-03/07/09/14; E9 | Exported family event aliases and source-scope checks reject bare, missing, unresolved, `any` and `unknown` payload contracts. Direct shared-dispatch object payloads are checked against declarations. Graph behavior records native notifications, calendar draft notifications, forwarded menu requests and direct toolbar association explicitly. Existing API-01 editor/transaction contracts are retained. |
| T3 | Supplemental type snapshot remains the shared source for reachable interfaces, aliases, generics and release facts. |
| T4 | Central accessor normalization uses source read types and validates setter compatibility; properties and linked attributes share the result. |
| T5 | One cycle-safe CEM reference resolver serves normalization, docs and release review, including relative JS-to-TS paths and barrel aliases. Unresolved local exports stay review gaps unless that side's exact package type export resolves them. |
| T6 | Freshness includes extraction source fingerprints and installed analyzer/parser identity, alongside source/CEM/catalog checks. |
| T7 | Combobox and menu share popup measurement lifecycle, viewport origin calibration, space and fit calculations; each retains its placement/focus/visibility policy. |
| T8 | Command and combobox suites share the dist fixture server and animation-frame/stable-geometry helpers. Source/Vite fixtures retain their distinct purpose. |
| T9 | All 77 components run a named-state rendered Parts matrix in Chromium, Firefox and WebKit. Each advertised Part must be reachable through actual shadow/exportparts boundaries. The matrix is included in the aggregate theme command. |
| T10/T11 | API-09 already supplied canonical definitions and authored/data SSR parity. The public graph consumes those definitions rather than duplicating them. |
| T12 | Root, component, registration, definition, catalog, context, editor-extension and event-type entries are supported. Other exposed deep imports remain importable but are explicitly unsupported implementation paths. No export is removed. |
| FORMS-09 | Calendar types and prose include both single-date and range change/action branches; obsolete “ranges excluded” guidance is removed. |
| FORMS-10 | Existing complete shared-field customization annotations and registry verification are retained. |
| FORMS-11 | File upload's read-only `dragging` getter is linked to its reflected output attribute with a checked source annotation, without introducing author input. |
| FORMS-14/15 | Descriptor descriptions/defaults are attached to public accessors. Select composition guidance and segmented selected/hover token descriptions match actual source. |
| OVL-13 | Missing DOM tag mappings are supplied, and metadata generation checks catalog tag inference. |
| C11 | The project-brief alert heading uses supported default content, restoring the missing message. |

Tree change details also normalize legacy internal snapshots to the existing public
selected/expanded key aliases, keeping emitted data consistent with their types.

## Maintainer workflow

```sh
npm run build
npm run check:api
npm run test:api
```

`npm run metadata` writes CEM, the type snapshot and the public graph together.
Keep `custom-elements.json`, `public-types.json` and `public-api.json` together on
both sides of a release comparison. The ordinary release CLI discovers graph
coverage; explicit historical `--cem-only` remains available and labeled limited.
Graph records are downloadable from the API reference.

## Verification and limits

The production build, strict tooling type-check and all 64 tooling plus 7 docs generator/model tests pass.
The full catalog matrix covers 77 components in three engines. Three focused tree event-alias/veto cases also pass. The public event
suite passes 60 cases and combobox passes 138 cases. Command/menu regression has
100 passing cases, one documented registry skip and one Chromium native-dialog
focus failure. That exact focus failure reproduces on the unchanged published
baseline; this change does not claim to repair it.

The graph's behavioral fields are authored contracts; they do not replace browser
transaction, hydration, native disclosure, IME or assistive-technology review.
Static payload enforcement covers directly authored shared-dispatch object calls;
generic controllers retain their specialized family tests. Finite Parts fixtures
prove the named states, not every application configuration or dynamic consumer
Part. External dependency identities are retained, while external declaration
bodies require review in their owning package. Unsupported deep imports remain
visible in the exposure inventory without becoming a compatibility promise.

See the verification receipt alongside this document for exact check results.

The later [API normalization follow-up](api-normalization-followup.md) resolves the recorded native-dialog focus failure by asserting focus inside the nested close-button shadow root. Its expanded API/release gate now also runs the shared event and transaction suites. Historical results above are preserved.
