# Phase 2 — Registry ownership across the API

Phase 1 is isolated in commit `166e532`. It includes the adapter, typed examples, browser probes, workflow harness prerequisites, sortable results, the original Phase 0 freeze and a complete Phase 1 freeze named `scoped-registry-phase-1-candidate-v2`. Unrelated working-tree edits were excluded; metadata for the commit was generated against its staged sources.

## Construction and ownership

The production source inventory is in `artifacts/scoped-registry-phase-2/ownership-audit.json`. It covers elements and primitives, with source hashes and construction, registry, identity and document-listener occurrences.

| Path | Disposition |
| --- | --- |
| `toast-region.notify()` | Creates its hard dependency in the region's actual registry and returns an upgraded toast synchronously. Missing local definitions fail clearly, even if the global registry has the tag. Disconnect cancels pending insertion. |
| Lit templates, nested controls and HTML imports | Continue using the Phase 1 creation bridge. `scope.creationScope.importNode(fragment, true)` is the explicit destination-registry import path. No global document patch or implicit node rebinding. |
| Native control clones | Number field, slider, form field, date picker and select clone native controls for validation. They do not construct custom descendants or select a custom registry. |
| Native imperative nodes | Editors create native button/span wrappers; context menus and tooltip positioning create native anchors/styles. Keep native DOM creation, with realm-independent DOM kind checks. |
| Rich-text clipboard HTML | Inert parsing followed by a native-tag allowlist. It remains a sanitizer; arbitrary custom markup is not upgraded. |
| Direct component constructors / class identity | No new direct custom-element constructor factory. Carousel focus uses its actual owned slide set instead of an imported class identity. ProseMirror model-class checks remain intact. |
| Global registration | Existing `define/*` modules retain intentional global side effects. Explicit scopes retain dependency-first conflict checking and never retry component errors globally. |
| Application DOM / renderer callbacks | Consumer-created nodes retain their original association. Qualified factory/Lit recipes are documented; arbitrary framework renderers are not transparently scoped by placement. |

## Delayed children and lifecycle

Radio groups, accordions, tabs, toast regions, toolbar/menu/tree owners and editor associations use a shared child-definition observer. It resolves each child's actual registry, preserves intentional null associations, recollects current children after definition, and abandons disconnected/replaced subscriptions. One pending promise is shared per registry/name. Subscribers are weak and removed when no longer needed; repeated mounts do not append one permanent promise callback per host.

`scope.initialize()` emits an internal initialization notification because association changes do not require a slot or child-list mutation. Detached explicit editor targets notify their document as well. Owners listen only while they have null-associated candidates. Code using raw native initialization should also call `scope.initialize(root)` (idempotent for the same association) to notify existing library owners; this is not a general lazy activation scheduler.

Pre-upgrade reactive values, including custom accessor values and object/array properties, are covered by packed consumer tests. Radio ownership preserves the parent's form entry, one tab stop and canceled change rollback. Tabs reconnect labels/panels and preserve selection. Incompatible foreign-version children are not repeatedly upgraded: ownership still requires the tag and the component's existing capability contract. A tag name alone is not a promise of cross-version compatibility.

## Moves and realms

Same-document moves and portals retain node identity and registry association. A new toast uses its source owner even when its region is portaled into a global container. Top-layer presentation does not transfer ownership.

Same-origin adoption tests cover existing scoped roots, later Lit descendants, synchronous toast factories, static styles and listener cleanup. New imports use the destination document while preserving a native scoped registry. Foreign-realm imperative creation uses the qualified import path, accommodating WebKit's direct-constructor restriction. CSSResult-based styles use a local text fallback when source-document constructed sheets cannot be adopted. Native CSSStyleSheet-only extensions are outside that fallback; load their constructors/styles in the destination realm and recreate using its factory.

Connection-owned document listeners are removed from the document where they were installed, even when `ownerDocument` already points at the destination during disconnect. Native DOM kind checks tolerate mixed-realm event paths without relaxing custom-component capability contracts.

A global association can map to the receiving document's global registry. Destination dependencies must be registered there; missing definitions are an explicit factory error. For a different-origin destination, inaccessible realm, framework-owned backend, or unqualified third-party component, recreate through a destination-owned factory and explicitly transfer supported application state. Moving DOM does not promise to preserve an active editing/IME session.

## Verification and performance handoff

Final verification passed: **64 registry browser checks**, **55 context/registration checks**, **78 hydration checks**, **66 SSR unit tests**, **7 harness unit tests**, packed declaration consumption and current API/type metadata checks. Eleven registry cases and two context cases are explicitly skipped where the native API or CDP collection is unavailable.

All **39 matched timing configurations and three retention configurations** passed final qualification, along with **14 ownership diagnostic runs**. Both frozen reference directories passed checksum verification. Qualification uses one accepted sample/repetition per configuration; the full 30-sample/five-repetition campaign is prepared but **not yet captured**. See `artifacts/scoped-registry-phase-2/verification.json` and its exact raw-evidence paths. Phase 2 remains in the working tree above the Phase 1 commit.


Run `npm run test:scoped-registries` for packed browser and typed consumption checks. The packed fixture extracts `npm pack --ignore-scripts` archives for elements/primitives/styles and resolves their package exports; it does not alias runtime imports to workspace source. `probes/scoped-registry/context-regressions.config.ts` runs existing context/registration checks with separate Phase 2 receipts. Existing SSR/hydration and metadata checks remain required.

The saved Phase 2 campaign plan retains every Phase 0/1 configuration key and seed: 39 timing configurations × 30 samples and three separate retention configurations × five repetitions. Qualification uses one sample per configuration and keeps its run IDs separate. It does not establish statistical performance equivalence.

```sh
node artifacts/scoped-registry-phase-2/campaign.mjs
node showcases/performance/src/registry-ownership.mjs --id=registry-phase2-ownership-v1
```

The second command is a separate packed-component diagnostic: 30 fresh-browser samples for each factory/delayed-child configuration and five independent Chromium retention repetitions per mode. It measures synchronous notify return, notify readiness, delayed radio semantic readiness, and 0/10/50/100-cycle factory/pending-definition retention. Module evaluation is outside these component timings. There is no Phase 1 delta for these new configurations.

The original matched workflow collector/scenario files remain unchanged. Compare the next full campaign against both frozen Phase 0 and frozen Phase 1. Preserve browser/OS/CPU/Node/profile identities, inspect distributions, and contemporaneously replay any material regression. The prior per-element and SSO SSR signals and post-warm-up heap growth remain watchlist items. Keep source identity fixed throughout capture and never reuse a started run ID.

This phase establishes API ownership and benchmark readiness. Lazy manifests, scheduled activation, production scoped SSR, physical-device and manual assistive-technology acceptance remain later work.
