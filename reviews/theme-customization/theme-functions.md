# CSS functions and mixins for theme authoring

**Historical audit, reconciled September 19, 2026.** Original evidence below describes the audited revision. Each finding now has a current disposition; use the [follow-up plan](#theme-decisions-follow-up-implementation-september-19-2026) for remaining work.

Audit date: 18 September 2026. Recommendation for review; no compiler, runtime, theme, or package changes were made.

## FUNC-01. Keep compiled CSS public; consider a small internal authoring pilot

**Current disposition — Implemented and accepted:** Bounded CSS-source typography/surface authoring is adopted with portable CSS and Lit delivery. See [THEME-07](#THEME-07). The following is retained original evidence.

**Recommendation:** CSS-authored functions could make repeated geometry formulas and typography recipes easier to maintain, especially for contributors working primarily in CSS. Pilot that authoring benefit only after the public token and styling contracts are normalized. Preserve ordinary compiled CSS, existing `--en-*` custom properties, Parts, and completed style exports as the consumer interface. Do not make the linked preprocessor's source dialect a required public theme API.

| Option | Benefit | Cost and recommendation |
| --- | --- | --- |
| Existing TypeScript/Lit composition | Already supports typed helper options, token fallbacks, conditional styles and selector composition. | Lowest integration cost. Remains the default until a pilot demonstrates a concrete authoring improvement. |
| Internal CSS functions/mixins, compiled before package delivery | CSS-local reusable formulas and declaration bundles; runtime `var()` values can remain live. | Useful candidate, with an explicit supported subset, deterministic definition inputs and parity checks. Consumers continue receiving completed CSS. |
| Public source helpers plus a required compiler | Consumers could apply the same recipes in their own CSS. | Adds a compiler/version/configuration contract, integration support and another naming API. Defer until external author demand justifies it. An optional authoring package could be considered separately. |
| Native-only helpers in distributed themes | Removes our expansion step once supported end to end. | Defer: browser support, evolving syntax and native scoping semantics must be independently verified against the project's support policy. |

For the three divergent themes, reusable formulas should read each theme's tokens at the point of use. They should not require three same-named definitions in a global compiler registry. Where themes need different derivation algorithms, that is a separate recipe-policy decision; changing CSS syntax does not decide the desired algorithm or normalize a component's hooks.

## FUNC-02. The linked implementation is useful precedent, but its mixin grammar has drifted

**Current disposition — Historical precedent:** The adopted internal compiler is self-contained; the external transform is not a runtime or build dependency. See [THEME-07](#THEME-07). The following is retained original evidence.

The reviewed source is [Reve's `css-functions.ts`](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L17-L49), 1,364 lines; SHA-256 `d6385a838809eb941b77d16657732077f9cfa31ff65f19426d93567c2c5005ac`. The authenticated GitHub copy and the local source used for probes matched. Links to `main` are navigational and may later change; this digest identifies the audited version.

As checked on the audit date, Chrome documents native `@function` in Chrome 139. MDN still marks `@function` experimental and non-Baseline. That does not establish native `@mixin` support. [Chrome 139](https://developer.chrome.com/blog/new-in-chrome-139#css_custom_functions), [MDN compatibility status](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@function#browser_compatibility).

The 8 September 2026 CSSWG Editor's Draft remains work in progress. Its mixin body accepts ordinary declarations, nesting and conditional rules, with `@private` for private properties; empty-parameter definitions may omit parentheses. The linked parser instead requires `@mixin --name()` and an `@result` block. Therefore this is an older-draft authoring dialect, not simply a transparent implementation of the current draft. [Current mixin grammar](https://drafts.csswg.org/css-mixins/#mixin-rule), [current mixin body](https://drafts.csswg.org/css-mixins/#mixin-body), [Reve definition parser](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L418-L438), [Reve required `@result`](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L733-L789).

The native draft also specifies tree-scoped names, layer-sensitive definition selection, type-aware evaluation and local/caller variable environments. These are substantive semantics beyond textual expansion. [Function rule](https://drafts.csswg.org/css-mixins/#function-rule), [arguments and locals](https://drafts.csswg.org/css-mixins/#args), [function evaluation](https://drafts.csswg.org/css-mixins/#evaluating-custom-functions).

## FUNC-03. What the preprocessor provides, and the boundaries a pilot must enforce

**Current disposition — Implemented boundaries:** Unsupported dialect semantics are rejected by the bounded compiler. See [THEME-07](#THEME-07). The following is retained original evidence.

The two-stage design gathers definitions, then replaces calls and strips definitions. It supports defaults, local values, composed calls, mixin composition and nested selectors. Unbound `var()` references survive expansion, so a compiled helper can still respond to a consumer's theme tokens. This is the strongest practical fit for this repository. [Gathering](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L818-L855), [substitution](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L1086-L1127), [visitor](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L1311-L1364).

| Boundary | Verified implementation behavior | Consequence here |
| --- | --- | --- |
| Definition identity and visibility | One map per function/mixin namespace; later gathered definitions replace earlier ones. Registry records carry no layer, condition, host tree or import-graph context. | Gathering several theme directories can make one theme's recipe silently replace another's. Restrict inputs and reject duplicate names. |
| Conditional definitions | Conditional rules inside function/mixin bodies are rejected. A definition inside an outer `@media` can still be collected without retaining that condition. | Keep definitions unconditional. Put responsive and appearance selection around emitted ordinary CSS or runtime token assignments. |
| Types | Parameter and return type text is retained, but values are not checked. The parser recognizes only a limited type envelope and accepts nonsensical type content. | Do not promise native type validation or replace the existing token validator with these annotations. |
| Runtime/custom calls | Unbound `var()` remains live, but every encountered `--name()` call is treated as a required registry function. | The transform cannot silently coexist with arbitrary consumer-native custom functions; unknown names are build errors. |
| Source discovery | Directory traversal reads `.css`, `.ts`, `.js`; gathers literal `css` tags and skips a definition-bearing template if it contains interpolation. | Current heavily interpolated Lit helpers cannot be converted mechanically. Use a dedicated definition file/manifest; include only intended sources. |
| Development updates | Changes rebuild the registry, invalidate the complete module graph and reload the page; add/unlink handlers exist. | Definition editing has a real reload cost. Prove cold build/watch parity; new files append to the watch map, so duplicate precedence can differ from a fresh traversal. |

Evidence: [definition data shapes](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L60-L99), [function condition rejection](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L481-L489), [mixin condition rejection](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L733-L756), [type parser](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L322-L339), [argument binding](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L1130-L1165), [discovery](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L874-L950), [watcher](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L972-L1035).

## FUNC-04. Focused probes confirm semantic differences beyond the documented subset

**Current disposition — Addressed in adopted compiler:** Declaration order and supported expression rules have focused parity/rejection tests. See [THEME-07](#THEME-07). The following is retained original evidence.

Read-only probes imported the exact TypeScript source under Node 24.16.0 and used its installed Lightning CSS dependency. They exercised expansion with effectively modern targets, without browser lowering. These are compiler observations, not a browser conformance test or a rerun of the upstream suite. The probe script (`probe.mjs`) and captured inputs/results (`results.jsonl`) are retained in the Progress Report evidence; durable findings follow.

| Probe | Observed result | Meaning |
| --- | --- | --- |
| Layer order `alpha, beta`; `beta` defines `1px`, later-written `alpha` defines `2px` | Call becomes `2px`. | Traversal order overrides the layer order. |
| Base definition `1px`, later definition `2px` inside `@media (width > 1000px)` | Call becomes unconditional `2px`. | Conditional definition context is lost. |
| `<length>` argument/default and return type, called with `red` in `color` | Output is `color:red`. | Neither argument nor return type protects callers. |
| Parameter `--v: 2px` and same-named local `--v: 4px` | Output uses `2px`. | Explicit parameters win over locals in this implementation. |
| Inner function reads an outer function's argument and local | Output retains `var(--a)` and `var(--b)`. | Outer function environment is not carried into the inner call. |
| Parameter default `inherit`, with the matching custom property on the caller | Output contains literal `width:inherit`. | CSS-wide keyword behavior is not emulated. |
| Self-referential local and `var(--v, 8px)` result | Output is `var(--v)`; fallback disappears. | Local cycles can escape into the element's variable environment. |
| Mixin result contains `& { color:blue }` followed by `color:red` | Output moves red before the nested blue rule. | Mixed declaration/nested-rule order is not preserved. |
| Current-draft bare mixin or direct-declaration body | Build errors for missing parentheses or missing `@result`. | Current draft syntax cannot be passed through this compiler. |

The relevant code checks resolved parameters before locals, creates a fresh environment per call, and accumulates declarations separately from nested rules. Those choices explain the environment and ordering results. [Environment lookup](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L1065-L1083), [call evaluation](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L1171-L1191), [result accumulation](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L1213-L1240), [emission order](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.ts#L1301-L1308).

These findings do not invalidate Reve's constrained typography and concentric-radius use cases. They do mean that adopting the file unchanged and describing it as native-equivalent would be misleading. Fix or explicitly reject each unsupported construct before expanding the allowed authoring subset.

## FUNC-05. Existing generation already covers the principal use cases

**Current disposition — Superseded recommendation:** The user chose CSS authoring for equivalent consumption; do not restore the earlier retain-TypeScript recommendation. See [THEME-07](#THEME-07). The following is retained original evidence.

The current token compiler has explicit dependency recipes, canonical evaluated values and optional CSS expressions. Rhythm and size recipes already emit live `calc()` relationships; radius derivation validates dimensions and clamps at zero. A radius pilot must retain those semantics rather than blindly copy subtraction. Token recipes (`packages/tokens/src/recipes.ts:8`).

Private Lit helpers already generate token/default/size fallbacks and inheritance-preserving override chains. Other helpers compose focus, option state paint, native surface motion and selectors. The focus and motion helpers contain reduced-motion, forced-color and feature conditions that the linked mixin subset cannot directly represent. Value helpers (`packages/styles/src/internal/values.ts:7`), focus composition (`packages/styles/src/internal/focus-core.ts:50`), surface motion (`packages/styles/src/internal/surface-motion.ts:17`).

Public delivery is already deliberately broader than a bundler plugin: the styles build runs TypeScript, then extracts plain CSS from the same exported `CSSResult.cssText`. The browser fixture consumes package exports without transforming JS or CSS; SSR embeds static styles in declarative shadow roots before hydration. A new expansion step must cover JavaScript CSS results, plain stylesheets and SSR identically. Transforming only the docs Vite build or only exported `.css` would create divergent behavior. Build (`packages/styles/package.json:75`), CSS extraction (`packages/styles/scripts/export-css.mjs:35`), native consumption fixture (`apps/docs/tests/specimen-sources.spec.ts:76`), SSR delivery (`packages/ssr/README.md:363`).

For independent themes, keep full-theme override resets, explicit partial selections and independently resolved light/dark branches. The pair emitter intentionally preserves differing alias graphs instead of combining them indiscriminately. `resolveTheme()` currently selects a fixed recipe set, with source/pin overrides; independently customizable derivation policies would need a deliberate compiler extension. Theme emission (`packages/tokens/src/css.ts:6`), pair emission policy (`packages/tokens/src/theme-pair.ts:37`), recipe selection (`packages/tokens/src/theme.ts:16`).

## FUNC-06. Cost and acceptance criteria for a later pilot

**Current disposition — Pilot and bounded adoption complete:** Broader family conversion or a shared public authoring package remains optional future scope. See [THEME-07](#THEME-07). The following is retained original evidence.

The cost is a maintained compiler integration, not just copying one helper. Besides the 1,364-line implementation, Reve has dedicated parser/substitution tests, a Vite watcher, a Lit template transform and a standalone CSS path. Its integration explicitly expands before browser syntax lowering because doing both together previously misplaced nested `@apply`. [Existing tests](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-functions.test.ts#L22-L35), [two-pass Lit integration](https://github.com/reve-ai/reve-core/blob/main/tools/html/src/rolldown-plugin-lit.ts#L277-L311), [standalone CSS integration](https://github.com/reve-ai/reve-core/blob/main/tools/css/src/css-file.ts#L10-L35).

Start with one value formula used in multiple places and one simple typography declaration bundle. Keep focus/motion, arbitrary selectors and theme-specific algorithm replacement out of the first pilot. Compare the CSS-authored version with the existing TypeScript helper on readability, duplicated logic, generated bytes, build/watch time and diagnostic quality. No savings have been measured in this audit.

Accept a pilot only when all of these conditions hold:

1. **Bounded language:** Document and validate the supported syntax. Reject duplicate definitions, conditional/layered definitions, unsupported type expectations, problematic local shadowing/cycles and order-sensitive nested output, or implement them correctly. Pin the dialect version explicitly.
2. **One delivery result:** JS style exports, generated CSS and SSR contain the same complete ordinary CSS. No unexpanded definitions, applications or custom function calls escape into required shipped styles.
3. **Theme independence:** Three substantially different theme fixtures remain independent both side by side and nested, including light/dark, density, local overrides and fallback values. Formula inputs remain runtime variables where intended; changing one theme never changes another's compiled recipe.
4. **Build reliability:** Cold builds and watch add/change/remove produce equivalent results from explicit definition inputs. Preserve declaration order and useful call/definition diagnostics. Verify expansion precedes lowering.
5. **Observable value:** The pilot removes meaningful authoring duplication without increasing output size or development friction beyond an agreed threshold. Run relevant existing no-build consumption and SSR coverage across the project's browser matrix; compare visual/computed-style behavior for the affected recipe.

If the pilot cannot show that advantage, keep the existing helpers. If it succeeds, expand internal use incrementally while leaving public raw helper syntax and native-only delivery as separate, later decisions.
