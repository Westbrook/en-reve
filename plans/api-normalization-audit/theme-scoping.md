# Theme scopes and runtime boundaries

**Historical audit, reconciled September 19, 2026.** Original evidence below describes the audited revision. Each finding now has a current disposition; use the [follow-up plan](#theme-decisions-follow-up-implementation-september-19-2026) for remaining work.

Documentation audit, 2026-09-18. Read together with `styles.md`, especially CSS-01, CSS-02, CSS-05 and CSS-06. Source paths and line numbers below are repository-relative. This audit changes no runtime code, generated assets, or tests.

The existing system already supports document themes, independent nested themes, narrow overrides, inherited custom properties in shadow roots, and native overlays that keep their theme ancestry. The most concrete new defect is host-local paired theme emission: passing `selector: ':host'` produces appearance selectors that do not match the shadow host. Broader normalization work should preserve the functioning CSS inheritance model while making scope ownership, graph recomputation, and reset behavior explicit.

## SCOPE-01. Full boundaries reset a finite known schema, not every public or application hook

**Current disposition — Implemented:** Registry-derived theme resets preserve classified mechanical/configuration inputs. See [THEME-01](#THEME-01). The following is retained original evidence.

**Classification: supported core contract with a confirmed registry completeness gap; high priority.**

`collectThemeCSSDeclarations` emits every token in the child theme, emits `initial` for unpinned optional component aliases/recipes, and resets names from `styleOverrideNames` plus caller-supplied `componentOverrides` (`packages/tokens/src/css.ts:6-20`). The optional hooks remain unset in component styles so their semantic fallback is evaluated at use (`packages/styles/src/internal/values.ts:22-24`). The scope browser test explicitly compares inherited parent button paint, full reset, partial paint and a local pin (`packages/tokens/test/browser/scopes.spec.mjs:90-120`).

This is a rebase against a known schema. It deliberately does not clear arbitrary application properties (`packages/tokens/README.md:19-21`). A custom source token present only in a parent theme also lies outside a child's emitted IDs: each `resolveTheme` starts from the default schema plus that call's source, not its ancestor (`packages/tokens/src/theme.ts:16-23`). That distinction matters before offering arbitrary concept extensions with a promise of full isolation.

CSS-01 already establishes that some documented library hooks, including chat, wheel, plane, editor maximum size and calendar geometry, are absent from the reset registry. The reset behavior is therefore less uniform than its public promise; this report does not count those omissions again as separate defects.

**Normalize:** Generate the supported token/hook schema, reset list and family inventory from one authoritative manifest. Give each public hook an explicit category: semantic value, optional override, mechanical state, or consumer-owned extension. A full boundary must reset every installed optional hook and redeclare its complete registered semantic schema; a partial boundary should leave unspecified hooks alone. Preserve a manifest-extension mechanism for third-party concepts/components. Do not reset private measured coordinates or arbitrary application properties.

**Tradeoff:** Completing the registry changes scopes that currently rely on leaked inherited pins. Those users can retain inheritance through a partial scope. A larger registered extension schema increases CSS output, so the public contract must state whether “full” means the complete installation schema or one declared theme schema.

## SCOPE-02. Partial selection, live aliases, and “restore derived” are different operations

**Current disposition — Implemented:** Explicit clearing and dependency-aware patches complement unchanged exact partial selection. See [THEME-04](#THEME-04). The following is retained original evidence.

**Classification: source-confirmed semantic limits and an API design gap; high priority.**

Three existing behaviors need separate names in the normalized contract:

| Operation | Current behavior and evidence |
| --- | --- |
| Emit selected values | Partial output requires explicit `tokenIds`, emits only those IDs, and does not calculate a dependency/dependent closure (`packages/tokens/src/css.ts:7-15`). |
| Keep a CSS alias live | Aliases compile to `var(--en-…)`; recipes use their CSS expression when provided, otherwise their resolved literal (`packages/tokens/src/graph.ts:100-105`). Those expressions react at their declaration boundary. |
| Recompute the authored graph | `resolveTheme` reconstructs the token graph with inputs and pins (`packages/tokens/src/theme.ts:16-23`). Color state/foreground recipes lack a CSS expression and consequently need resolution again (`packages/tokens/src/recipes.ts:40-44`). |

The existing test deliberately proves that changing `--en-rhythm-base` only on a descendant leaves inherited padding unchanged until a complete graph is emitted beside it (`packages/tokens/test/browser/scopes.spec.mjs:123-137`). This is documented platform behavior, not a broken alias implementation. The pair browser proof separately checks that a primitive override on the same declaration boundary feeds its shared alias (`packages/tokens/test/paired-browser/verify.mjs:128-135`). A raw CSS seed mutation cannot promise newly computed contrast foregrounds or hover colors; even full graph CSS contains resolved literals for those recipes (`packages/tokens/README.md:97-99`).

There is also a subtle optional-hook distinction. A full emission of an unpinned `component.button.radius` becomes `initial`, permitting the component's size-selected radius fallback. A partial emission of that same unpinned token becomes its declared alias instead, because the `initial` rule is conditioned on `kind === 'full'` (`packages/tokens/src/css.ts:14-15`). Thus a partial selection can install an explicit base-radius alias where the full theme leaves the optional hook absent. Deleting a draft pin and re-emitting a selected component token is not the same operation as releasing that hook to its point-of-use fallback. `restoreDerived` only deletes an entry in a pins object; it does not specify a CSS scope reset (`packages/tokens/src/graph.ts:123-124`). This consequence is source-derived; it was not independently measured on a rendered button in this audit.

**Normalize:** Keep exact partial selection as a low-level operation, and add an explicit graph-aware patch operation for coordinated family/concept changes. Distinguish at least: leave inherited value, assign literal/alias, and clear an optional override to fallback. For a graph-aware patch, compute affected outputs using the effective base theme and its pins, re-resolve compile-time recipes, then emit the needed outputs at the new boundary. The existing `affectedTokens` graph traversal is a useful building block (`packages/tokens/src/graph.ts:114-121`), but blindly emitting every dependent can overwrite intentional inherited pins. Theme identity and pin provenance must be inputs to that decision.

**Tradeoff:** Exact partials are small and predictable for expert CSS authors; graph-aware patches are easier for theme authoring but require an explicit base and potentially larger output. Avoid declaring aliases on every descendant merely to imitate universal live rebasing: that would obscure optional override inheritance and multiply CSS work.

## SCOPE-03. Shadow inheritance works; host-local paired emission does not switch branches

**Current disposition — Fixed:** Explicit shadow-host targets generate matching appearance predicates. See [THEME-04](#THEME-04). The following is retained original evidence.

**Classification: confirmed browser defect in the generic selector path, plus an integration/documentation gap; high priority.**

Custom properties reach component shadow internals without copying themes onto every element. Existing real-control tests verify scoped button/card appearance (`packages/tokens/test/browser/scopes.spec.mjs:35-49`), and the paired browser fixture verifies inherited tokens in a declarative shadow tree and preserves input/root identity across appearance changes (`packages/tokens/test/paired-browser/verify.mjs:37-41,97-112`). Component CSS supplies fallback values without setting semantic defaults on `:host` (`packages/styles/README.md:197-201`).

A theme selector in a document stylesheet does not select an internal boundary within another shadow root. Our three-engine probe verified that `[data-en-theme="inner"]` inside a shadow tree retained the outer theme until the matching stylesheet was installed in that root. A stylesheet-local `:where(:host)` declaration did successfully theme the host. The current generic `selector` option permits this shape (`packages/tokens/src/types.ts:77-86`; `packages/tokens/src/css.ts:24-31`), but no explicit document/shadow-host target API is exposed.

Paired output appends its appearance tests outside the supplied selector:

```css
:where(:host):where([data-en-appearance="dark"]) { /* dark branch */ }
```

The construction is at `packages/tokens/src/theme-pair.ts:49-54`; the resulting selectors control both media fallbacks and explicit branches at `:75-83`. Those appended attribute tests do not match the shadow host in the measured engines. With a pair whose light radius is `3px` and dark radius is `17px`, `emitThemePairCSS(pair, {selector: ':host'})` left the radius at `3px` for Auto, Light and Dark under both system preferences. Explicit modes left `color-scheme` at `light dark`. This can also mix appearance-dependent colors with stale non-color values, since the `light-dark()` enhancement still uses the unconditional base boundary (`:85-90`).

**Measured:** Chromium 153.0.8010.12, Firefox 155.0 and WebKit 26.6 all reproduced the defect. In an isolated fixture only, moving each appearance test inside `:host(…)` produced the correct explicit schemes and dark radius, including dark Auto. No emitter fix was made. This confirms a selector-shape remedy for `:host`, not a general parser/rewriter for every valid custom selector.

**Normalize:** Add an explicit emission target for a document/root, ordinary scoped element, or shadow host, and generate appearance selectors appropriate to that target. Preserve a code-authored selector escape hatch but define its supported grammar or accept explicit base/auto/light/dark selector slots instead of heuristically rewriting arbitrary selectors. Document that theme CSS must be delivered to each tree containing independently themed internal boundaries; inherited themes alone need no duplicated full sheet.

**Tradeoff:** Shadow-host targeting is additive and can preserve existing ordinary-element output. Automatically changing arbitrary selector strings risks selector-list and specificity errors. Any optional stylesheet-adoption helper must handle ownership, deduplication, disposal, SSR and cross-document moves; the existing static-style hydration controller is not a theme installer (`packages/primitives/src/interactions/static-styles.ts:25-26,64-98,100-121`).

## SCOPE-04. Native overlays retain scope; real portals need an explicit destination contract

**Current disposition — Intentional boundary:** Native top-layer nodes keep inheritance; applications own actual portal destination themes. See [THEME-04](#THEME-04). The following is retained original evidence.

**Classification: supported runtime behavior, with future consumer-integration coverage required. Do not describe current overlays as losing themes.**

Dialog markup stays in the component render root and opens with `showModal()` (`packages/elements/src/dialog/template.ts:25-44`; `packages/elements/src/dialog/dialog.ts:267-275`). Popovers similarly render a local native surface and call `showPopover()` (`packages/elements/src/popover/template.ts:12-18`; `packages/elements/src/popover/floating-surface.ts:118,263-279`). The documented contract explicitly says no portal or style cloning is used (`packages/elements/src/dialog/README.md:3`). Trigger association does not change theme ownership: an overlay inherits from its own location, and `for` resolves within its own document/shadow root (`packages/elements/src/dialog/README.md:61`).

Toast notifications are another distinct case: `notify()` creates an `en-toast` and appends/prepends it to the receiving region; it does not move a source element from the caller's subtree (`packages/elements/src/toast-region/element.ts:68-74`). The notification therefore receives the region's theme. This is predictable, but a global region cannot infer which arbitrary caller scope a message should visually inherit.

The isolated browser probe confirmed scoped custom properties on native modal and popover surfaces and the modal backdrop in all three engines. The same probe then actually moved the host from its themed parent to the body: inherited values changed to the root theme. A framework portal rendered beneath the same effective scope can preserve appearance; a portal to another ancestry needs a deliberate scope there. “JavaScript portal” alone is not evidence of a theme loss.

**Normalize:** Keep authored-tree placement as the default for library overlays. Document theme ownership as the destination DOM scope, separately from trigger or notification-caller identity. For optional portal integrations, choose an explicit policy: use a destination inside the originating scope, install/reuse an equivalent managed theme boundary at the destination, or intentionally adopt the destination theme. A managed bridge must include full/partial inputs, optional pins, appearance, density, requested size context and direction where relevant, plus live updates and disposal. Copying one current computed-style snapshot loses authored aliases and future responsiveness; copying only `data-en-theme` can miss local partial overrides and size flags.

**Tradeoff:** Placement beneath the original scope is simplest but may be constrained by third-party portal APIs. A synchronized theme bridge adds lifecycle and SSR complexity; do not add it to native overlays that already retain ancestry. Cross-document themes require separate stylesheet delivery even though static component styles have their own adoption fallback.

## SCOPE-05. Appearance ownership is intentionally different for paired and single partials

**Current disposition — Intentional boundary:** Single partials inherit appearance; paired partials own independent appearance. See [THEME-04](#THEME-04). The following is retained original evidence.

**Classification: documented distinction that needs a clearer normalized API, not an undisclosed current defect; medium priority.**

`default.css` is a complete light/dark root pair; named fixed light/dark/density assets emit full declarations and their fixed native scheme (`packages/tokens/scripts/generate.mjs:10-18`). Each full pair boundary owns Auto/Light/Dark; missing or Auto follows system preference, even inside an explicitly forced ancestor (`packages/tokens/src/theme-pair.ts:37-42`). Existing browser coverage checks independent nested Auto (`packages/tokens/test/paired-browser/verify.mjs:114-126`). This is independence, not appearance inheritance.

Single partial output forbids `colorScheme: true` and otherwise leaves scheme ownership alone (`packages/tokens/src/css.ts:28-30`). In contrast, paired partial output always emits `color-scheme: light dark`, its own media/appearance selectors and selected branch values (`packages/tokens/src/theme-pair.ts:48-83`). The README explicitly documents that distinction and recommends a selected single branch for an inherited partial override (`packages/tokens/README.md:68-72`). Ordinary descendants inherit; putting `data-en-appearance` on an element that does not match an emitted pair boundary is not itself a general theme-switch operation.

**Normalize:** Separate value coverage (`full` or selected patch) from appearance ownership (`inherit`, `auto`, `light`, `dark`) in the authoring model. Preserve independent Auto for full boundaries. Make inherited appearance the natural default for family/concept refinements, and require an explicit choice when a narrow refinement should become independently adaptive. Inherited paired refinements need a defined way to follow the effective ancestor branch for non-color values as well as colors; setting only `color-scheme` or assuming `light-dark()` covers shadows/geometry is insufficient.

**Tradeoff:** Changing paired partial defaults in place would break current intentional independent scopes. Introduce a new explicit mode or helper and retain the current emitted behavior for existing calls. Choosing a single branch is a valid static solution, but following a changing ancestor requires regeneration or another defined branch-selection contract.

## SCOPE-06. Size is an absolute opt-in scope; density is a theme-resolution input

**Current disposition — Implemented with deliberate exceptions:** Late editor/color sizing adoption is repaired; specialized geometry is retained. See [THEME-06](#THEME-06). The following is retained original evidence.

**Classification: supported architecture with already identified adoption gaps; medium priority for consistent extension.**

`EnElement.size` defaults to medium; `inherit` is explicit and reports the requested mode, not an effective measurement (`packages/elements/src/internal/en-element.ts:4-16,32-40`). Foundation styles reset/select private flags at each visual host, while a native `.en-foundation` wrapper uses `data-size` (`packages/styles/src/foundations.ts:11-16`). Each style family recomputes only its used sized roles from local public variants, avoiding repeated multiplication of inherited dimensions (`packages/styles/src/internal/sizing.ts:5-14`; `packages/tokens/src/sizing.ts:3-10`). A full child theme does not erase the inherited requested size; its local values rebase under that size. Existing tests cover this distinction, absent medium children, local pins and independent target floors (`packages/tokens/test/browser/sizes.spec.mjs:27-65,67-117`).

Density is resolved through finite `compact|comfortable|spacious` source mappings rather than a general runtime `density` attribute: it changes spacing aliases and the control baseline (`packages/tokens/src/types.ts:42-50`; `packages/tokens/src/source.ts:39-48`). Supplied named density CSS assets are full themes, including their appearance and reset behavior. Changing only a descendant base spacing token does not rebase all sized outputs, as SCOPE-02 explains.

CSS-02 establishes missing foundation selection styles on token/rich editors; CSS-05 and CSS-06 establish color-family target/sized-role inconsistencies. Those are concrete adoption defects, not reasons to discard the size model. Keep the declared default-medium behavior visible when composing a parent with authored children: those children follow the parent only when they opt into `size="inherit"`.

**Normalize:** Retain separate axes for appearance, density, requested size and explicit component geometry. Make family/concept presets state which axes they own. Offer a coordinated density refinement only with a defined affected-role set and inherited-pin policy; do not implement it by multiplying already resolved descendant values. Ensure every visual component claiming the shared size API adopts the selection styles, and every consumed size-sensitive semantic role goes through the shared resolver.

**Tradeoff:** Default inherited size would be convenient for some composite layouts but is a behavioral change across the library; preserve explicit inheritance unless a migration is approved. A density-only patch is useful but must not accidentally reset paint, component pins or independently selected typography.

## Evidence and validation boundary

The audit inspected source and existing tests; the existing broad suites were not rerun. The only new executions were small isolated Playwright CSS probes using already installed browser engines and the existing built token emitter. They created no server and contacted no websites. The source selector construction was checked against the measured generated shape; the evidence records source and built-emitter hashes.

The reproducible probe (`scope/probe.mjs`) and results (`scope/results.json`) are retained in the Progress Report’s `evidence/theme-customization` directory. The probe measures platform inheritance, stylesheet reach and the host-local pair defect; it does not claim complete component hydration, framework portal, cross-document, or browser-support certification.

Future targeted validation should cover the host-aware emitter in both appearances and fallback CSS; independently themed boundaries inside shadow roots; family/concept partials with aliases, dependent recipes and released optional hooks; live scoped theme changes while native overlays are open; and any explicitly supported third-party portal transport. These tests should verify computed component paint/geometry and preserve active input identity, focus and selection.
