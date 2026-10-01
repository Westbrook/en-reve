# Library test systems audit

> September 26 follow-up: the [isolated CEM migration](cem-migration-2026-09-26.md) replaces the legacy analyzer and records its ordinary qualification and remaining scope. The inventory and measurements below remain the unchanged September 24 audit; they do not describe the migrated checkout.

**En Rêve design system · 24 September 2026 · current checkout review**

This report inventories the library's test tools, their installed and locked versions, what they verify, how they are activated, and the available runtime evidence. It covers `packages`, `apps/docs`, `tooling`, active `probes`, and the separate native-showcase performance lab and results reader. Frozen baseline copies are historical evidence, not additional active test systems.

## Principal findings

1. **The repository has extensive tests but no complete test entry point.** There is no root `npm test`, no active `.github` workflow directory, and no one command that executes everything described here. `test:api`, `test:release`, and `test:theme` are selective gates. The performance Actions file is an installation template outside `.github/workflows`.
2. **Playwright is the dominant browser tool; Node's built-in runner is the dominant unit tool.** There are **70 maintained Playwright configuration files**: 45 in packages/docs, 24 in probes, and one in the results reader. The 45 package/docs configurations select 150 distinct spec files and 1,589 unique source cases; their 5,432 configured browser/device invocations overlap. The main docs configuration alone selects **2,214 invocations across 68 files**. These are discovery counts, not passing-test counts or coverage percentages.
3. **Several checks are outside normal activation paths.** Examples include the elements package's 13 Node test files, an 11-case button/content browser file, two docs API Node files, nested token portability, and standalone consumer type fixtures. A green release gate does not establish that these passed.
4. **Timing varies by orders of magnitude.** Fresh ordinary Node groups took approximately 0.1–14 seconds; the theme catalogue took **91.05 seconds**. Fresh browser runs took **11.12 seconds for 36 primitive cases** and **81.49 seconds for 117 SSR cases**. A retained reduced performance acquisition took **22m 33.88s**; the full nine-system lane schedules 2,628 measurement jobs plus separate reference work and is materially larger.
5. **The current test system has concrete maintenance issues.** Two size/SSR Node cases fail under direct Node execution because source TypeScript imports a missing source `.js` path. A theme asset verifier still requires exactly 10 cases although the current catalogue drives 20. The package/docs Playwright configurations do not reject accidental `test.only`.
6. **“Coverage” needs qualification.** There are extensive DOM, interaction, accessibility, type, SSR, geometry, provenance, and performance checks. No maintained executable line/branch coverage threshold or mutation-testing gate was found. Screenshots mostly support review; they are not a conventional baseline pixel-diff suite. Automated tests do not replace physical-device, screen-reader, saved-profile autofill, or real IME review.
7. **There are concrete opportunities to reduce runtime without dropping facets.** A follow-up experiment ran the same 16 catalogue cases in **103.261s sequentially versus 39.700s in three isolated processes**, all passing exactly once. Repeated docs preparation, oversized reader tests, duplicate configured invocations and repeated browser reads offer additional opportunities. Their combined benefit is not yet measured; see the runtime investigation below.

## Scope and evidence method

The inspected checkout is `/Users/westbrook/Documents/repos/design-system`, HEAD `6d09b31cf43523ac8c75352208ab9697b62e2673`, with substantial pre-existing tracked and untracked changes. Findings include current working-tree sources, including untracked tests. This is not a clean-commit release certification.

Sources were read directly from package manifests, lockfiles, installed packages, test/configuration code, orchestrators, and retained run receipts. The tools table describes **what this checkout uses**; the separate upstream snapshot below compares available releases. Source inventories and hashes are preserved in the [audit evidence directory](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/inventory.json).

Fresh timings use an external monotonic clock around the exact child command. Commands ran sequentially within this audit; normal runner concurrency remains enabled. This was one observation per command on the shared host, not an idle-machine statistical benchmark. Environment: macOS 26.6.1 arm64, Node **24.16.0**, npm **11.13.0**, Python **3.14.6**. Fresh browser runs explicitly use three workers rather than the locally resolved default of nine.

No full workspace rebuild was performed for the timing study. Direct Node tests use existing generated artifacts where their imports require them. Browser fixtures can combine current sources with existing package/docs builds; the SSR server also creates its own production-minification fixture. Consequently, these results measure the exact recorded invocation and available artifacts, not guaranteed fresh-source correctness. Package commands that normally build first have additional, unmeasured build cost.

Timing labels used throughout:

| Label | Meaning |
|---|---|
| **Fresh wall** | Measured end-to-end command time in this audit, including npm/process/server overhead when invoked; outcome stated. |
| **Historical runner** | Retained Playwright `stats.duration` or Node `duration_ms`; older source, selection, workers, and build may differ. |
| **Historical campaign wall** | Explicit same-run start/finish timestamps; preparation and later analysis excluded unless stated. |
| **Not recorded** | No trustworthy whole-run duration found and not freshly executed. A configured timeout is not substituted. |

## Tools and versions

Root and isolated-install versions are listed below; each was checked against its owning manifest, lockfile and installed metadata. Caret ranges remain ranges in manifests even when the current lock resolves a precise version. The [full version table](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/node-static.md) distinguishes declarations from resolved packages; the [performance](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/performance-lab.md) and [framework/probe](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/contract-probes.md) appendices cover their separate installations.

| Tool/system | Version used | Test responsibility |
|---|---|---|
| Node `node:test`, `node:assert/strict` | Built into Node **24.16.0** | Unit/model/SSR assertions, negative controls, tooling and provenance tests. Native `.ts` execution strips types; it does not typecheck test code. |
| Playwright Test / Playwright / playwright-core | **1.63.0** | Browser test runner, assertions, real input, multi-engine/device fixtures, traces; also used as a library by custom verifiers/campaigns. |
| Bundled browser identities | Chromium **153.0.8010.12**, Firefox **155.0**, WebKit **26.6** | Directly confirmed by this audit’s token portability/property runs and matched to the root Playwright browser manifest. Automated WebKit is not a retail Safari/physical iPhone certification. |
| Axe Playwright adapter / axe-core | **4.13.0** / **4.13.0** | Explicit page/region/state accessibility scans; root adapter declaration `^4.13.0`. |
| TypeScript compiler | **7.0.2** | Strict production compilation and consumer contract fixtures. |
| CEM analyzer + its TypeScript parser | **0.11.0** + **5.4.5** | Custom Elements Manifest, AST/public graph and declaration snapshot extraction. This parser differs from the build compiler. |
| Lit literal-minification plugin + its TypeScript parser | **0.2.0** + **5.9.3** | Bound Lit-template AST analysis and minification preservation. |
| Vite | **8.2.2** | Source fixture servers, production fixture builds and reader previews; supporting infrastructure, not another assertion framework. |
| Lit SSR / SSR client / parse5 | **4.1.0** / **1.1.8** / **7.3.0** | Real rendering/hydration and parsed-HTML structural assertions. |
| HTML minifier / Lightning CSS / PostCSS | **2.1.3** / **1.33.0** / **8.5.28** | HTML/CSS compilation, normalization, serialization, authoring and semantic-preservation checks. |
| Python `unittest` | Built into observed Python **3.14.6** | Eight date-budget policy regression tests; other Python scripts prepare/validate archives and campaign evidence. |
| Lighthouse / chrome-launcher | **13.5.0** / **1.2.1** | Isolated performance-category audits in the showcase lab. These invocations do not provide Lighthouse accessibility certification. |
| web-vitals / simple-statistics | **6.2.2** / **7.12.0** | Browser metrics and statistical analysis in the performance harness. |
| Lab esbuild / module lexer / source-map helper | **0.28.2** / **3.0.2** / **0.3.31** | Packed fixture/collector builds, dependency graphs, and bundle attribution. |
| Framework fixture esbuild | **0.25.12** | Separate framework-consumption installation, not the lab's esbuild. |
| Results reader marked / tools Prettier | **16.4.2** / **3.9.8** | Report rendering and formatting support, not independent test runners. |

The framework compatibility matrix tests React 18.3.1/19.3.0, Vue 2.7.16/3.5.42, Svelte 4.2.20/5.57.0, and an HTML/Lit baseline. These are subjects under test. Core library subjects include Lit 3.3.3, signal-polyfill 0.2.2, and signal-utils 0.21.1. The retained external CSS-authoring pilot additionally binds a source digest and upstream Lightning CSS 1.32.0; it requires an explicitly supplied external source file.

Repository-owned verifiers have no independent semantic tool version. Their meaningful identity is the source commit/digest, configuration, and inputs, rather than the workspace's generic `0.1.0` package label.

### Upstream version snapshot

**No, the pipeline is not entirely on the latest versions.** The following differences were verified on **24 September 2026** against public npm `latest` tags and official runtime release listings. This is an upgrade starting point, not a claim that these releases work with the repository unchanged. Refresh it when executing the kickoff prompt; exclude prereleases.

| Tool / installation | Version used | Latest stable at verification | Primary source |
|---|---|---|---|
| Node | 24.16.0 | 26.10.0 Current; 24.21.0 on the LTS line | [Node releases](https://nodejs.org/en/blog/release) |
| npm | 11.13.0 | 12.1.0 | [Registry](https://registry.npmjs.org/npm/latest) |
| Python | 3.14.6 | 3.14.7 | [Python release](https://www.python.org/downloads/release/python-3147/) |
| Vite, root and reader | 8.2.2 | 8.3.1 | [Registry](https://registry.npmjs.org/vite/latest) |
| parse5 | 7.3.0 | 8.0.1 | [Registry](https://registry.npmjs.org/parse5/latest) |
| html-minifier-next | 2.1.3 | 8.5.3 | [Registry](https://registry.npmjs.org/html-minifier-next/latest) |
| esbuild, framework-consumption probe | 0.25.12 | 0.28.2; lab already uses this | [Registry](https://registry.npmjs.org/esbuild/latest) |
| marked, results reader | 16.4.2 | 18.0.14 | [Registry](https://registry.npmjs.org/marked/latest) |
| Prettier, showcase tools | 3.9.8 | 3.9.9 | [Registry](https://registry.npmjs.org/prettier/latest) |
| @types/node | 24.13.3 | 26.6.2 overall; 24.13.6 on the 24.x line | [Registry](https://registry.npmjs.org/%40types%2Fnode/latest) |

The audited versions of Playwright, Axe, the root TypeScript compiler, CEM analyzer, Lit SSR/client, Lit literal-minification plugin, Lightning CSS, PostCSS, Lighthouse, chrome-launcher, web-vitals, simple-statistics, the lab's esbuild, es-module-lexer and trace-mapping matched their npm `latest` tags at verification. **Latest parent package does not mean latest transitive compiler:** CEM's TypeScript 5.4.5 satisfies its `~5.4.2` dependency; the literal-minification plugin uses TypeScript 5.9.3 within its supported 2–5 range. Neither establishes support for the root's TypeScript 7 compiler. Upgrading or replacing those integrations requires compatibility work, not an unconditional dependency override.

## What gets tested, and how to activate it

Commands below are from the repository root. Direct browser configuration execution is `node node_modules/@playwright/test/cli.js test --config <config-path>`; the detailed appendices list every path and prerequisite.

| Test layer | Coverage | Activation | Important boundary |
|---|---|---|---|
| Tokens | Schema, derivation, diagnostics/contrast, authoring, undo/export/reopen, resets, component token contracts | `npm run test:tokens` | Builds tokens, then only top-level `test/*.test.mjs`; nested portability and browser checks are separate. |
| Primitive models/types | State, transactions, collections, virtualization, dates, editors, lifecycle, registration, templates | `npm test -w @en-reve/primitives` | Builds, typechecks virtual-collection consumer, then `.mjs` tests. Token-document `.ts` is omitted here. |
| SSR Node | Native first paint, slots, escaping, request isolation, projection, scoped renderer lifecycle | `npm test -w @en-reve/ssr` | Builds SSR only; dependency builds must already exist. Hydration needs browser tests. |
| Elements Node | Calendar/date/time/color/tree models and SSR; shared size metadata | `node --test <element-test-paths>` | 13 files, no package test script. Direct source-TS size checks currently fail to resolve an import. |
| Metadata/evidence tooling | Public CEM/types/graph, source identity, release diff policy, evidence integrity, lexical customization, popup math | `npm run test:tooling` | Nine selected files, not all tooling tests; no preceding build. |
| Minification | HTML/CSS/text/whitespace/interpolation and SSR meaning after minification | `npm run test:minify` | Separate from API/release/theme unit lists. Browser production-minifier fixture adds other checks. |
| CSS authoring | Compiler snapshots, strict syntax errors, helper/mixin semantics, watch recovery, output parity | `npm run test:authoring -w @en-reve/styles` | Production compiler test; real watcher and legacy external pilot are additional manual commands. |
| Docs Node | Workflow scheduling/cancellation; API model and deterministic docs generator | `npm run test:workflows:core -w @en-reve/docs`; direct API `.test` files | npm script covers only workflow core. |
| Component/style/token browsers | Native control/forms, focus/input/cancellation, ARIA, layout/targets, styles/scopes/theme cascade, mobile interaction | Direct package config paths | Most have no package npm entry point. Configurations overlap and have different fixture servers. |
| Primitive browsers | Shadow events, composition/draft selection, roving focus/forms; additional content/navigation | `npm run test:browser -w @en-reve/primitives` | Only main config included; content/navigation are separate. |
| SSR browsers | No-JS/DSD, hydration identity and early edits, descriptions/optional slots, minification, motion and tree/style adoption | `npm run test:browser -w @en-reve/ssr` | Main config only; three specialized SSR configs remain explicit. Server builds minification fixture. |
| Docs workflows | Built application journeys and component integration, APIs/examples, theme/state/RTL/reflow and targeted Axe | `npm run test:workflows -w @en-reve/docs` | Requires built docs `dist` or correct external URL. 2,214 invocations; theme/mobile variants are separate. |
| Platform/framework probes | Signals, FACE/native slots, scoped registry capabilities, draft/composition, framework ownership/SSR interoperability | `npm run test:probes`; framework probe's `install.mjs`, `build.mjs`, then config | Framework install is separate; seven consumers × three engines. |
| API integration probes | Parts, events, transactions, forms, outcomes, localization, context, editing, patterns, ranges | `npm run test:api` for Parts/events/transactions; other configs explicit | Root API gate does not include forms/outcomes/localization/context/framework breadth. |
| Registry/lazy activation | Packed public contracts, isolation, imports/retries/disposal, first input, network absence, dormant ownership | `npm run test:scoped-registries`; `npm run test:lazy-registries`; other prepare/config pairs | Packed prerequisites include other packages and isolated esbuild installation; named gates cover different mechanisms. |
| Custom browser verifiers | Production sticker sheet, installed package consumption, highlighting, typography, token portability/properties and theme journeys | `npm run test:sheet`, `npm run test:properties:browser`, or explicit Node verifier | A command beginning with Node may still launch all browsers. See custom-verifier appendix. |
| Showcase functional checks | Nine native implementations: interaction smoke, secondary workflows, structure/overflow/errors, provenance | `npm --prefix showcases/tools test`; `node showcases/tools/qualify.mjs --systems … --artifacts … --receipt …` | Production demos must be installed/built/served. npm test runs 163 smoke checks; full qualification adds 36 secondary checks plus inspection/provenance (199 assertions). |
| Performance harness tests | Sampling/statistics, event attribution, HTTP/bundle policy, matrix/lane behavior, reference/report integrity | `npm --prefix showcases/performance test` | 43 Node cases test the measuring machinery; they are not component performance measurements. |
| Performance campaigns | Load/startup/input/scroll, memory/DOM/listeners, diagnostics, Lighthouse, BFCache, observer overhead and registry policies | Lab `qualify`, `pilot`, `baseline`, `interactions`, `memory`, `lighthouse`, or explicit CLI `run --suite …` | Separate install/preparation/qualification, fresh run IDs and shared browser lock. Serial and potentially long. |
| Report-reader tests | Numeric sorting, missing values, CSV escaping, links/headings, keyboard, mobile/sticky/print/no-JS and receipt provenance | `npm --prefix showcases/performance-results run build`, then `npm --prefix showcases/performance-results test` | Six Node + 15 browser cases. Exhaustive sorting scales with report size; specific report verifiers are narrower. |
| Specialized production/date studies | Packed production activation, SSR/hydration, deferred date loading, cancellation/retry, retention and budget/provenance | Per-probe prepare → qualify → capture → verify/analyze commands | No root aggregate. Historical/frozen protocols must not be casually rerun into old outputs. Manual acceptance is separate. |

### Aggregate gates are selections

- **`test:api`**: API graph freshness → nine-file tooling suite → API Parts → events → transactions. No build, general unit sweep, all browser sweep, or theme sweep.
- **`test:release`**: full build unless `--skip-build` → bind candidate source identity → `test:api` → three transaction-related Node files → customization freshness → geometry → command-family browsers → recheck source identity/artifact hashes. Theme migration explicitly requires the separate theme gate. It does not publish or approve a release.
- **`test:theme`**: full build unless `--skip-build` → customization freshness → selected token/tooling/theme Node tests → original-candidate contrast → property/scope probes → cascade/state/Parts/composition/docs regression/candidate browsers. It omits nested portability, general primitives/SSR, minifier, and some authoring/custom verifiers.
- **`npm test --workspaces --if-present`** is not a complete substitute: `test:*` scripts, standalone configs, probes and non-workspace installations remain outside it.

Both release and theme orchestrators fail fast and persist stage start/finish timestamps. Adding their runtimes to their constituent suite times double-counts work. Their build stages generate metadata/source-derived outputs and should not be mistaken for read-only inspection.

## Fresh runtime measurements

<!-- FRESH_TABLE_START -->
| Measured invocation / selection | Fresh wall | Result | Log |
|---|---:|---|---|
| Tokens top-level Node · 25 files | **13.827 s** | 133 passed / 0 failed | [tokens-node](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/tokens-node.log) |
| Primitives Node · 14 .mjs files | **0.331 s** | 104 passed / 0 failed | [primitives-node](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/primitives-node.log) |
| Primitive token-document · separate .ts file | **0.131 s** | 9 passed / 0 failed | [primitives-token-document](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/primitives-token-document.log) |
| SSR Node · 13 files | **1.162 s** | 71 passed / 0 failed | [ssr-node](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/ssr-node.log) |
| Elements Node · 10 .mjs files | **0.347 s** | 31 passed / 0 failed | [elements-node](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/elements-node.log) |
| Root test:tooling | **10.046 s** | 69 passed / 0 failed | [tooling-node](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/tooling-node.log) |
| Root test:minify | **0.505 s** | 21 passed / 0 failed | [minify-node](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/minify-node.log) |
| Docs core + API Node · 3 files | **6.550 s** | 15 passed / 0 failed | [docs-node](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/docs-node.log) |
| Styles test:authoring | **0.709 s** | 45 passed / 0 failed | [css-authoring-node](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/css-authoring-node.log) |
| Theme candidate catalogue | **91.050 s** | 16 passed / 0 failed | [theme-candidates-node](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/theme-candidates-node.log) |
| Theme proof Node | **1.784 s** | 7 passed / 0 failed | [theme-proof-node](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/theme-proof-node.log) |
| Lazy manifest freshness | **1.052 s** | Passed | [check-lazy](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/check-lazy.log) |
| Public API graph freshness | **3.717 s** | Passed | [check-api](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/check-api.log) |
| Public type snapshot freshness | **2.697 s** | Passed | [check-types](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/check-types.log) |
| Customization freshness | **0.621 s** | Passed | [check-customization](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/check-customization.log) |
| Primitive consumer typecheck | **0.500 s** | Passed | [primitives-types](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/primitives-types.log) |
| Elements Node · 3 .ts files | **0.557 s** | 4 passed / 2 failed | [elements-node-typescript](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/elements-node-typescript.log) |
| Performance lab Node | **0.557 s** | 43 passed / 0 failed | [performance-lab-node](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/performance-lab-node.log) |
| Performance reader Node | **0.336 s** | 6 passed / 0 failed | [performance-reader-node](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/performance-reader-node.log) |
| Date-budget Python unittest | **0.725 s** | 8 passed | [date-budget-python](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/date-budget-python.log) |
| Nine probe Node files combined | **0.611 s** | 50 passed / 0 failed | [probe-node](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/probe-node.log) |
| Primitives browsers · three workers | **11.123 s** | 36 passed / 0 failed / 0 skipped | [primitives-browser](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/primitives-browser.log) |
| SSR browsers · alternate-port diagnostic | **70.881 s** | 111 passed / 6 failed / 0 skipped; hardcoded-port issue | [ssr-browser](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/ssr-browser.log) |
| SSR browsers · default port, three workers | **81.486 s** | 117 passed / 0 failed / 0 skipped | [ssr-browser-default-port](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/ssr-browser-default-port.log) |
| Token @property browser verifier | **11.594 s** | Passed in Chromium, Firefox, WebKit | [token-properties-browser](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/token-properties-browser.log) |
| Paired token CSS browser verifier | **4.015 s** | 18 recorded engine/check combinations passed | [token-paired-browser](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/token-paired-browser.log) |
| Token compiler portability · hybrid Node/browser | **13.011 s** | 1 hybrid test passed; 64 author/reader combinations + 16 corruption checks | [token-portability](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/token-portability.log) |
| Composable-editor document Node | **0.612 s** | 8 passed / 0 failed | [composable-editor-node](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/composable-editor-node.log) |
| Token scopes browser verifier | **8.786 s** | 66 engine/check rows passed | [token-scopes-browser](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/token-scopes-browser.log) |
<!-- FRESH_TABLE_END -->

Exact expanded commands, working directories, output overrides, timestamps, exit codes, and log names are in [fresh-measurements.json](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/fresh-measurements.json). Reproduction scripts are retained alongside it. The main Node groups are **test-only against existing artifacts** unless the measured command itself says otherwise. No total “all tests” duration is claimed.

The size/SSR failures originate at [size-ssr.test.ts](/Users/westbrook/Documents/repos/design-system/packages/elements/src/internal/tests/size-ssr.test.ts:4): importing `en-element.ts` leads to `src/element-scope.js`, which is absent. Native Node type stripping does not resolve that `.js` reference to the sibling `.ts`. This is a reproducible direct-execution failure, not proof that built component SSR is broken.

The default-port SSR run completed **117/117 cases in 81.486 seconds** across Chromium, Firefox and WebKit. A preceding isolated-port run completed 111 cases successfully but failed six connection attempts in 70.881 seconds: [hydration.spec.ts](/Users/westbrook/Documents/repos/design-system/packages/ssr/tests/browser/hydration.spec.ts:6) and [description-slots.spec.ts](/Users/westbrook/Documents/repos/design-system/packages/ssr/tests/browser/description-slots.spec.ts:38) hardcode port 4192 while the configured server was correctly running on the supplied port 48992. These six failures are an **override/fixture mismatch**, not observed component failures. The original receipt remains preserved; the successful rerun does not remove the port bug. Both runs include the SSR fixture server's startup/minification work.

The token portability run also directly confirmed the browser versions reported above. Its single Node test contains a cross-runtime matrix rather than one elementary assertion. The scope/property/paired verifiers passed across the same three engines.

## Runtime reduction opportunities

The follow-up investigation found both a measured scheduling improvement and substantial repeated work. **No normal test pathway or library code was changed.** The complete [runtime optimization investigation](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/runtime-optimization.md) explains the evidence, coverage constraints, every pathway family, and a proposed implementation order.

| First targets | Evidence | Proposed change |
|---|---|---|
| Catalogue CPU work | Same 16 cases: **103.261s → 39.700s**, 0 failures/skips, unchanged input hashes | Integrate bounded process partitioning; the observed **61.6%** improvement is one screening pair, not a whole-library estimate. |
| Documentation preparation | `prepareDocs` runs **four times per docs build**; a root build constructs at least six type snapshots | Give preparation one owner and share verified immutable outputs. Savings in seconds still need measurement. |
| Results-reader sorting | **93.3% of historical summed test time**; current matrix requires **12,834 real sort clicks** | Batch observations/pure assertion reporting and balance table groups while preserving every column/direction/browser. |
| Overlapping pathways | **486 equivalent-default repeat candidates** among 5,432 package/docs invocations | Execute once only after proving identical build, fixture and environment; retain all distinct device/viewport/engine facets. This is not an 8.95% wall-time promise. |
| Theme browser reads | Signature checks make **1,920 evaluations** | Batch the same expected/actual reads into **240 evaluations**, retaining independent expected values and every assertion. |

The investigation also identifies duplicate SSR builds and packed-fixture preparation, existing evidence-cache code that is not integrated into the gates, unsafe shared state that limits concurrency, and a bounded collector-finalization opportunity. It distinguishes **faster complete runs**, **valid reuse for unchanged inputs**, and **earlier feedback from smaller selections**. Performance sample counts, observation windows, browser freshness, serial capture and manual acceptance remain required facets.

Start with catalogue partitioning and single-owner docs preparation, then reader/theme batching, then a complete execution manifest with shared prerequisites. A trustworthy total runtime or combined savings percentage requires a complete current baseline with equivalent coverage; the earlier audit timings cannot be summed into one.

## Historical browser runtimes

These selected receipts are useful planning observations, not promises for the current expanded suites. Dates are UTC. All selections in this table passed except where explicitly stated; “pass/skip” counts are browser-expanded.

| Observed selection | Historical runner time | Pass / skip | Date / scope |
|---|---:|---:|---|
| Forms/native fields | 88.144 s | 116 / 1 | Sep 18, six files, three workers |
| Combobox desktop | 44.459 s | 93 / 0 | Sep 18, two older files; current config selects 138 invocations |
| Commands desktop | 22.772 s | 119 / 1 | Sep 23, three workers |
| Geometry | 15.113 s | 54 / 0 | Sep 23, nine workers |
| Tooltip pointer/position/warmup | 45.8 s | 273 / 0 | Retained log; no trustworthy run timestamp in the log |
| Slider / rating | 41.9 s / 25.5 s | 66 / 0; 48 / 0 | Sep 18 associated receipt, three workers |
| Styles composition / state paint / cascade | 25.609 s / 16.031 s / 11.049 s | 93 / 0; 30 / 0; 33 / 0 | Sep 23, three workers |
| SSR popup motion | 38.412 s | 90 / 0 | Sep 11, three workers |
| Docs API completion subset | 102.256 s | 352 / 2 | Sep 19, seven files, four workers; **not full docs** |
| Docs workflow subset | 113.927 s | 145 / 2 | Sep 23, three files, two workers; **not full docs** |
| Docs theme regression | 122.252 s | 127 / 2 | Sep 23, three workers |
| Theme refresh/candidates | 312.919 s | 49 / 2 | Sep 23, older candidate scope; current config lists 63 |
| Mobile showcase / assets | 38.050 s / 4.815 s | 15 / 0; 8 / 0 | Sep 11, emulated profiles |
| Framework consumption | 16.991 s | 84 / 0 | Sep 13, two workers, independent verification receipt |
| API Parts / events / transactions | 132.0 s / 13.3 s / 39.3 s | 291 / 0; 60 / 0; 204 / 0 | Main-integration log; about 184.6 s for browser stages alone |
| Scoped / lazy registries | 32.7 s / 34.3 s | 64 / 11; 69 / 0 | Main-integration logs; one worker |
| Scoped hydration | 25.542 s | 44 / 1 | Archived Phase 5 runner receipt |
| Performance results reader, older full run | 379.469 s | 14 pass, **1 failure** | Firefox sort timeout; a separately retained focused case passed in 385.053 s |

The [historical runtime appendix](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/historical-runtimes.md) supplies exact receipt paths, selections, versions, dates and failure caveats. The [configuration runtime index](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/configuration-runtimes.md) marks each of the 70 configuration files with available timing evidence or an explicit gap. **No successful full-current-docs duration was established.** Multiplying 2,214 tests by a per-test average, or presenting a filtered docs run as the whole suite, would be misleading.

## Performance campaign runtime and activation

The latest retained En Rêve comparison acquisition ran from `2026-09-24T00:15:11.548Z` to `00:37:45.430Z`: **1,353.882 seconds (22m 33.88s)**. It recorded 306 successful observations across three systems. Preparation, installs/builds, earlier functional qualification and later reader QA are outside that interval. Source: [execution.json](/Users/westbrook/Documents/repos/design-system/showcases/performance/reports/en-reve-main/execution.json).

| Suite / CLI activation | Recorded workload | Historical campaign wall |
|---|---|---:|
| `run --suite load --samples 10` | 3 systems × 2 profiles × 2 cache states × 10 = 120 | 373.831 s |
| `run --suite startup --samples 10` | 3 × 2 profiles × cold × 10 = 60 | 42.523 s |
| `run --suite interactions --samples 10` | 60 | 343.015 s |
| `run --suite lighthouse --samples 5` | Three systems, mobile/cold; 15 | 230.223 s |
| `run --suite memory --samples 1` | Three desktop runs; checkpoints 0/10/50 | 245.066 s |
| `run --suite diagnostic --samples 1` | Three desktop runs | 18.068 s |
| `run --suite bfcache --samples 5` | 15 desktop runs | 45.536 s |
| `run --suite overhead --samples 5` | 30 desktop instrumented/uninstrumented runs | 55.581 s |

Use the full CLI prefix `node showcases/performance/src/cli.mjs`, explicit system/profile/cache selections matching the desired study, and a fresh `--id`. The short commands in the table describe suite/sample selection only; their defaults otherwise produce a larger matrix. Run required installation, production builds, `prepare:lab`, functional qualification and calibration first. Do not reuse the historical acquisition script's fixed IDs.

The full nine-system template plans **1,080 load + 540 startup + 540 interaction + 18 diagnostic + 90 memory + 90 Lighthouse + 90 BFCache + 180 overhead = 2,628 jobs**, plus 180 current-library reference observations and functional checks. Its 480-minute CI timeout is a cap, not a measured duration. Documentation describes several-hour runs; this audit did not execute or establish a precise runtime for that full matrix.

Specialized retained production studies provide other actual wall durations: production-registry 480 timing + 20 retention **19m 22.87s**; Phase 4 follow-up 540 + 15 **31m 9.97s**; Phase 5 closeout 540 + 15 **9m 14.07s**; Phase 6 v2 cold 720 + 20 **14m 2.27s** and warm 240 **3m 10.73s**. They measure different protocols and must not be pooled or treated as interchangeable speed claims. The [specialized campaign appendix](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/specialized-campaigns.md) provides reproduction commands, archive paths and scope. In the date harness, **`--qualify` alone does not reduce the default workload**; explicit sample/retention controls matter.

## Review findings and recommended follow-up

These are recommendations from this audit, not implemented changes or accepted project decisions.

| Priority | Finding | Concrete next step |
|---|---|---|
| High | No complete maintained activation manifest; release/theme naming can overstate breadth | Define named fast, browser, theme, compatibility, release and performance tiers; explicitly enumerate inclusions, exclusions and prerequisites. Keep full campaigns opt-in. |
| High | Two orphaned size/SSR tests fail as directly invoked | Give the elements Node suite a documented runnable entry point; resolve source-vs-built import handling and verify the two cases without weakening their assertions. |
| High | Theme asset verifier hardcodes 10 results despite 10 candidates × 2 appearances | Derive expected case count from selected candidates/appearances; include a small assertion against catalogue growth. [Source](/Users/westbrook/Documents/repos/design-system/tooling/theme-candidates/verify-assets.mjs:231). |
| High | Evidence outputs can be overwritten even by Playwright `--list` | Use fresh caller-owned directories, explicit reporter overrides for discovery, and separate execution/discovery record types. Preserve existing receipt bytes before inspection commands with reporters. |
| Medium | Missing activation for button/content and several Node/type/portability checks | Add each to the intended tier or explicitly document its experimental/retired status. Source presence is not activation. |
| Medium | No active CI discovered; performance workflow is a template | Activate desired lanes deliberately and record trigger policy. No external CI status or branch-protection policy was queried by this local audit. |
| Medium | No `forbidOnly` in resolved package/docs configs; retries all zero | Reject focused tests in the intended gate. Keep retry policy explicit and preserve original failures rather than hiding them. |
| Medium | Direct checks rely on generated outputs; test TS often excluded from compilation | Declare build dependencies and bind source/build identities to results. Typecheck test code where its contracts matter. |
| Medium | Runtime records are inconsistent and suites evolve | Persist monotonic whole-command time, stage time, selected tests, worker count, browser version, source/build identity and outcome; establish repeated baselines on a quiet host when needed. |
| Medium | Screenshot/axe evidence can be misread as complete visual/accessibility coverage | State asserted regions/states, distinguish evidence captures from pixel comparisons, and track manual AT/device/IME checks separately. |
| Medium | Two SSR specs hardcode 4192 despite `EN_SSR_TEST_PORT`; other fixed ports and repeated matrices also complicate parallel runs | Use configured baseURL/relative routes in those SSR specs, then verify a nondefault port. Serialize conflicting servers or use supported caller-selected ports; maintain one owner for performance capture. Do not sum overlapping suite counts or rerun benchmarks concurrently. |

## Runtime reduction kickoff prompt

Copy this prompt into a new implementation task to reduce runtime across the library's test pathways while retaining their required coverage. The HTML report has a **Copy runtime kickoff prompt** button. This is separate from the tool-upgrade prompt below; adding it does not apply any optimizations.

<!-- RUNTIME_KICKOFF_START -->
```text
Reduce the end-to-end runtime of all active test command pathways in /Users/westbrook/Documents/repos/design-system while preserving every required test facet and meaningful failure signal. Implement and validate the changes; do not stop at a plan or optimize only the first easy suite.

Read AGENTS.md, the existing Progress Report's handoff and unresolved feedback through .progress-report/project.json, and these reports:
/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24.md
/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/runtime-optimization.md
Consult their linked inventories and runtime-investigation evidence. Maintain the same Progress Report. Preserve unrelated tracked/untracked edits and historical receipts; inspect the working tree before choosing an isolated checkout. Do not reset or silently omit relevant user changes. Use codex/ if creating a branch. Reconcile the dated audit against current sources. Coordinate with any tool-upgrade work, record toolchain differences, and avoid unrelated upgrades during timing comparisons.

1. Define the complete workload and comparable baselines.
Create a machine-readable execution manifest for every command and prerequisite: builds, metadata, packing/install, Node/Python, production/test/consumer types, maintained Playwright configurations, custom verifiers, framework/registry/packed consumers, showcase qualification, reader checks and specialized performance/date/hydration campaigns. Cover root/workspaces and isolated installations. Include the audit's omitted direct checks; the existing API/release/theme gates are selective.
Identify obligations by test/assertion source, source/build/fixture bytes, tools and browser binaries, environment, viewport/device/media and configuration. Record exact selected cases, passes/failures/skips, prerequisites, monotonic whole-command and stage durations. Capture pre-existing failures and cold/warm baselines with fixed resources. Never sum overlapping historical selections into a supposed measured full-library runtime.

2. Integrate the measured catalogue scheduling opportunity.
The same 16 unchanged cases took 103.261s sequentially versus 39.700s in three processes. This single screening pair used existing generated outputs; it is not a guaranteed 61.6% saving for a larger gate.
Extract shared case definitions and split independent cases into a few process-level groups/files, initially evaluating three workers. Derive membership from the actual catalogue so new candidates are included. Preserve both appearances, edit/undo, round-trip exports, authored baselines, stale-base rejection and tamper controls. Update all selecting commands and prove every case runs exactly once. A concurrency flag inside one file cannot parallelize synchronous CPU work by itself. Apply one total resource budget and benchmark the integrated gate.

3. Remove repeated build/preparation and metadata work.
A normal docs build calls prepareDocs four times; the investigated root path constructs at least six type snapshots. Give preparation one owner and pass immutable, source-verified outputs to SSR/Vite and metadata consumers. Preserve npm, direct CLI/Vite/SSR, type-check and watch entrypoints. Validate complete input/output identities; an already-prepared boolean or existing directory is insufficient. Write-if-changed does not avoid computation.
Remove duplicate prerequisites such as the two breadcrumbs SSR builds. Reuse exact compiled examples, actual packed tarballs and minification fixtures across consumers while retaining per-browser source extraction and genuine native/packed consumption. Respect registry isolation and differing packaging flags. Establish dependency edges before parallelizing independent builds/installs; never rebuild shared outputs beneath tests. Measure stage savings rather than infer a fourfold build speedup from four preparation calls.

4. Reduce browser overhead without shrinking coverage.
Prioritize reader exhaustive sorting. Preserve every table, numeric column, direction and engine, real Playwright clicks, settled-state retries, finite/numeric order, missing-last behavior, row counts, unique aria-sort state and page-error checks. Batch observations and equivalent pure row predicates with precise failure diagnostics. Partition large loops into balanced table groups without excessive page setup. Update receipt validation and an exact coverage manifest together. Retain keyboard, CSV, mobile, print, links and no-JavaScript tests. Synthetic DOM clicks are not equivalent to trusted input.
Batch theme signature reads while keeping actual values and browser-canonicalized expected values independently derived; the audited helper can reduce 1,920 evaluations to 240. Preserve target-floor combinations, visibility, real transitions, screenshots and Axe scope/states. Share example compilation only when each browser's extracted source and dependency hashes match. Parameterize independent gallery groups without deleting required within-journey transitions. Benchmark worker/chunk sizes instead of globally enabling unlimited parallelism.

5. Make public commands views of one complete execution graph.
Keep standalone API/release/theme/package commands and their prerequisite guarantees. Add a documented comprehensive entrypoint/plan that unions obligations, runs shared producers once, and references one valid receipt from every fulfilled pathway.
Reconcile the 486 statically equivalent package/docs repeat candidates and the separately scoped 846 repeated invocations in an API+release+theme chain. These counts overlap; do not add them. Prove identical runtime build, fixture and environment before deduplication. Preserve distinct engines, device/viewport heights, touch/pointer, motion/forced-colors, source versus built/packed fixtures, hydration states and framework-major cohorts. Include omitted Node/type/browser/portability checks or justify their inactive status. Do not label a subset complete.

6. Integrate safe reuse and bounded concurrency.
Use existing tooling/evidence identity, graph and cache foundations. Start with same-invocation reuse, then immutable setup caching. Add completed-result reuse or changed-only selection only after validating a complete dependency graph. Keys must cover relevant additions/deletions/untracked files, generated/packed bytes, locks, tools/browsers, options, environment and platform where required. Publish atomically, revalidate artifacts, reject incomplete/corrupt entries, retain failures and label reused evidence with its original run. Unknown edges must expand selection conservatively. Keep a cold, uncached complete lane; cached artifacts do not prove clean installation/build behavior or provide fresh performance samples.
Assign owned ports/output directories and one resource budget. Isolate breadcrumbs' global releaseStream before concurrent streaming tests; fix hardcoded SSR origins before using alternate ports. Keep allocation/GC/resource measurements isolated. Replace generic readiness sleeps with observable completion, but preserve absence windows and real motion/frame assertions. Use virtual time only when equivalent timer/debounce/cancellation behavior and necessary real-time integration coverage remain.

7. Optimize performance overhead while preserving its protocol.
Keep fresh browser/session conditions, required sample counts, engine/profile/cache cells, observation windows, memory lifecycle checkpoints, collector-on/off coverage and serial acquisition. Do not run builds, correctness browsers or profiles beside timed campaigns. Reuse deterministic preparation, not historical samples or missing controls.
Investigate replacing the post-navigation 100ms collector sleep with document-specific receipt acknowledgement registered before navigation, retaining bounded failure and complete payload validation. The audit's 25.8s recent-campaign and 226.8s full-native-lane figures are maximum fixed-wait allowances, not promised savings. Test delayed, missing, duplicate and wrong-document delivery. Recalibrate and qualify old/new harness overlap; never silently rebaseline or pool incompatible observations.
Run cheap failures/current-library qualification before expensive panels. Keep development/performance smoke clearly separate from full qualification; Phase6 --qualify alone does not reduce workload. Earlier failures and fewer development samples improve feedback, not the completeness or passing-run cost of full verification. Preserve manual device, assistive-technology and IME acceptance.

8. Validate improvement and deliver the complete result.
Implement in reviewable stages: catalogue scheduling and single-owner docs preparation; reader/theme batching; complete execution graph and verified reuse; targeted concurrency and measurement-harness changes. Address every pathway family. Document evidence when a family warrants no change rather than silently omit it. Avoid broad product rewrites unless profiling justifies them; pure-computation/hash changes must preserve exact canonical bytes, browser support and negative controls.
Compare equivalent required-facet sets and candidate inputs with recorded toolchains. Use alternating baseline/candidate order and repeated complete affected correctness runs, initially three to five pairs, separating cold/warm states. Report median/range, whole-command/stage time, maximum case duration, cache hits/misses, worker budget, memory where available and all outcomes. Keep long full-campaign tiers explicit, execute necessary qualification for affected protocols, and label anything unrun. Validate changed/added/deleted inputs, corrupt/missing outputs, interrupted writes, prior failures, shared-state interference and seeded assertion defects. Do not get green by dropping assertions, adding skips, inflating retries/timeouts indiscriminately, narrowing accessibility scope or accepting snapshots without review.
Use fresh evidence directories and explicit non-file discovery reporters, such as Playwright --list --reporter=list. Preserve historical receipts and the audit's discovery-incident exclusions.
Deliver implementation, exact setup/activation commands, a before/after pathway matrix, facet-equivalence proof, measured timing/resource results, cache/invalidation design, required harness fixes, remaining bottlenecks and any unfinished work. Update the audit and existing Progress Report with a new review checkpoint without inventing human approval. Distinguish faster full runs, valid reuse and earlier feedback; claim no combined percentage without an equivalent measured full run. Complete the authorized local work and required validation, or identify a specific genuine blocker. Do not publish packages, deploy, or activate external CI services.
```
<!-- RUNTIME_KICKOFF_END -->

## Upgrade kickoff prompt

Copy the entire prompt below into a new implementation task in this repository. It authorizes the dependency and compatibility work, defines evidence required for completion, and preserves the audit's historical results. **Adding this prompt has not upgraded any tool.** The HTML report includes a **Copy upgrade kickoff prompt** button; the Markdown code block is also directly selectable.

<!-- UPGRADE_KICKOFF_START -->
```text
Upgrade all active test-pipeline tools in /Users/westbrook/Documents/repos/design-system to their latest stable releases and implement the repository changes needed to support them. Complete the implementation and validation, not just an upgrade plan.

Start by reading AGENTS.md and the existing audit:
/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24.md
Read its detailed appendices, version snapshot, activation gaps and execution disclosure. Reuse the project's existing Progress Report through .progress-report/project.json; read its handoff and unresolved feedback, maintain progress, and finish with a new review checkpoint. Preserve unrelated user edits and historical evidence. Inspect the current working tree before choosing an isolated checkout; do not reset, discard, or silently omit relevant uncommitted changes. Use the codex/ prefix if creating a branch.

1. Establish the upgrade inventory and baseline.
Inventory declared, locked, installed and actually executed versions in the root workspace and every active isolated installation, including showcases/performance, showcases/tools, showcases/performance-results, probes/framework-consumption and its environments, and any still-active external pilot. Include Node/npm/Python, Playwright and its browsers, Axe, TypeScript, metadata/CEM tooling, template/HTML/CSS minifiers and parsers, Lit SSR, Vite/esbuild, performance collectors/statistics, report rendering and formatting. Inspect transitive copies that materially execute in these paths. Record exact executable paths, owning manifests/lockfiles, runtime engines and source/build identity. Capture existing failures with focused baseline checks before changing their dependencies.

2. Verify current targets from primary upstream sources.
Resolve stable releases at execution time from npm metadata, official runtime releases and migration notes; save dated evidence. Do not rely on the audit's September snapshot as a permanent version target. It identified Node, npm, Python, Vite, parse5, html-minifier-next, framework-probe esbuild, marked, Prettier and @types/node as behind. Recheck tools that were already current, too. Use latest stable Node Current for the latest-version target and retain any supported LTS validation as an additional matrix entry. Align Node types with the declared support policy. Provision a project-local/version-manager runtime as needed; do not overwrite the app's bundled runtimes or system Python. Update repository runtime pins, engines, scripts, retained CI templates and documentation consistently.

3. Upgrade all active owning installations coherently.
Update manifests and regenerate their lockfiles with the selected package manager, then prove clean installs reproduce the resolved versions. Keep Playwright packages aligned and install their matching browser binaries; record browser versions. Do not stop after updating the root package.json. Trace older transitive compilers to their owners: the audit found CEM analyzer 0.11.0 using TypeScript 5.4.5 and the literal-minification plugin 0.2.0 using TypeScript 5.9.3 despite a TypeScript 7.0.2 root compiler. Check upstream support and migrate, adapt or replace incompatible integrations while preserving their behavior. Do not force incompatible compiler majors through blanket overrides or use npm audit fix --force. If an upstream constraint cannot reasonably be removed, document the exact dependency, latest available/compatible versions, evidence, impact and remaining work; do not label it fully upgraded.

4. Preserve intentional compatibility subjects and frozen evidence.
React 18/19, Vue 2/3 and Svelte 4/5 are compatibility subjects, not duplicate test-tool versions to collapse into a single latest major. Preserve the promised compatibility matrix; update its tooling and required supported-line patches deliberately. Do not opportunistically upgrade unrelated product dependencies. Keep frozen baselines, vendor snapshots, historical locks and old measurement receipts immutable. Distinguish active reproduction harnesses from archived experiments. For the external CSS-authoring pilot, respect the required external source and digest; migrate or explicitly document its blocked/retired status rather than fabricate input or rewrite historical provenance.

5. Implement the necessary compatibility and harness changes.
Review changes to Node/ESM/TypeScript execution, compiler/AST APIs, CEM extraction, package exports, Vite fixtures/builds, esbuild outputs, parse5 structures, minifier semantics, SSR/hydration, browser behavior and marked rendering. Preserve public component behavior, accessibility, emitted API contracts and meaningful assertions. Regenerate affected metadata, type/API snapshots and fixtures only from the updated sources and review semantic differences. Keep formatting changes scoped.
Reproduce and resolve the audit's blockers to credible validation: the two elements size/SSR tests' source .js resolution failures; the two SSR specs that hardcode port 4192 instead of configured baseURL; and the theme asset verifier's fixed count of 10 despite 20 catalogue/appearance cases. Derive counts from the actual selected catalogue and verify both full and filtered selections. Validate SSR on a nondefault port. Give omitted elements Node, button/content browser, docs API Node, token-document, nested portability and consumer-type checks a documented runnable tier, or document why a check is inactive. Reject accidental focused tests in gating configurations. Do not make failures disappear by weakening assertions, adding skips, increasing retries/timeouts indiscriminately, or accepting regenerated snapshots without review.

6. Validate the full affected pipeline with explicit coverage accounting.
Build required packages and fixture artifacts from the upgraded source before testing. Run production and relevant test/consumer typechecks, Node and Python suites, minification and authoring checks, and the API/release/theme gates. Supplement these selective gates with the omitted suites described in the audit; npm test --workspaces --if-present is not comprehensive.
Reconcile every maintained Playwright configuration against the current inventory (70 at audit time) and run each active affected configuration across its intended browser/device projects. Account for overlapping selections, expected platform skips and prerequisites. Include package/docs, SSR specializations, framework/packed-consumer and registry probes, custom token/property/scope/portability verifiers, showcase functional qualification and results-reader Node/browser tests. Provide a command/result ledger and explain any unrun configuration or manual-only acceptance item. Do not claim a full release pass from a subset.
Validate the performance machinery with its unit tests, functional qualification, calibration and explicit bounded samples across affected measurement modes. Check browser-lock ownership, collectors, Lighthouse, bundle/source-map attribution, analysis and report generation. Run additional campaigns when changes warrant them; keep full historical multi-hour campaigns an explicit documented tier. Phase6 --qualify alone does not reduce its workload. Use fresh run IDs and new baselines when instrument/browser versions change; do not pool observations from different toolchains or silently compare them as equivalent.

7. Keep evidence safe and timings reproducible.
Use fresh caller-owned output directories for every execution and discover reporter destinations before invoking tools. Playwright enumeration must use an explicit non-file reporter, such as --list --reporter=list; never overwrite execution receipts with discovery output. Preserve the audit's discovery-incident exclusions. Serialize conflicting fixture servers and all performance capture; parallelize only genuinely independent work. Record exact commands, install/build prerequisites, source and build hashes, runtime/tool/browser versions, test selections, workers, outcomes/skips, logs, monotonic whole-command time and relevant stage time. Separate failures that predate the upgrade from introduced regressions, and separate fresh durations from old audit timings. Add meaningful regression tests for compatibility fixes and changed harness behavior.

8. Deliver a reviewable, reproducible result.
Provide a before/after table covering every tool and installation, including remaining older transitive copies and justified compatibility constraints; list supporting repository changes and why they were needed. Supply reproducible setup and validation commands, actual pass/fail/skipped/unrun counts, timings, fresh evidence links and any unresolved blockers. Update the audit and existing Progress Report without replacing historical measurements or marking human review complete. Recheck clean-install reproducibility and relevant checks after the final changes. Finish the authorized local work; do not publish packages, deploy, or activate external CI services as part of this task. Claim full completion only when active tools use verified latest stable releases and all required compatibility changes are validated. If unavoidable blockers remain, document them candidly and distinguish completed work from the unfinished scope.
```
<!-- UPGRADE_KICKOFF_END -->

## Complete inventories and evidence

The report is organized into focused appendices so the main findings remain readable. Together they cover every maintained configuration and named custom verification family discovered in scope.

- [Node/static/type systems, versions, commands and aggregation](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/node-static.md).
- [45 package/docs browser configurations, assertions, devices, workers, timeouts, servers and skips](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/browser-configurations.md).
- [Contract/framework/registry/editor probes and consumer types](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/contract-probes.md).
- [Custom production/token/theme browser verifiers](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/custom-browser-verifiers.md).
- [Native-showcase functional checks, performance tools/lanes and results-reader tests](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/performance-lab.md).
- [Production-registry, hydration and date-picker protocols and manual boundaries](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/specialized-campaigns.md).
- [Per-configuration runtime index](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/configuration-runtimes.md) and [historical timing receipts](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/historical-runtimes.md).
- [Runtime reduction investigation, measured experiment and coverage-preserving recommendations](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/runtime-optimization.md).
- [Exact measured commands/results](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/fresh-measurements.json), [all package scripts](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/package-commands.json), and [source inventory/hashes](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/inventory.json).

## Audit execution disclosure

One probe-discovery subtask invoked Playwright `--list` without overriding configured JSON reporters. It ran no browser tests but wrote discovery-only receipts to 17 configured destinations. Eight originally clean tracked receipts were restored byte-for-byte from HEAD. Five untracked repository receipts, two ignored receipts, and two temporary receipts had no retained original bytes available to this audit; their prior existence/content cannot be recovered with certainty. They were left in place and are explicitly unsuitable as execution or runtime evidence. This did not modify library implementation sources. See the [exact affected paths and recovery record](/Users/westbrook/Documents/repos/design-system/plans/test-systems-audit-2026-09-24/discovery-incident.md).

Fresh executions redirect evidence into the dedicated audit directory. Existing user edits were preserved. No tests or product behavior were changed, no dependency was upgraded, and no publishing, scheduling, or CI activation was performed. Human review checkpoints and unrelated open project feedback remain unchanged in the existing [Progress Report](http://127.0.0.1:4177).

## Upgrade implementation addendum — September25,2026 (in progress)

The follow-up is implemented in the shared dirty checkout, preserving the captured
starting diff and historical evidence. The [upgrade report](test-pipeline-upgrade-2026-09-25.md)
and [version inventory](../artifacts/test-pipeline-upgrade-2026-09-25/versions.md)
record freshly verified upstream targets and remaining compatible transitive constraints.
The September24 tables and durations above remain historical observations.

Node26.10 Current, Node24.21 LTS, npm12.1 and Python3.14.7 are private project runtimes.
All20 active owning installations passed clean `npm ci` with unchanged lock hashes.
The full Current production build passed in66.702s. Current624 and LTS626 Node test
invocations, eight Python cases per wave, consumer types and authoring watcher checks
passed; the LTS count includes two new runtime-selection regressions. The initially
mis-selected bundled LTS npm attempt is retained and excluded from the corrected npm12
matrix. These are fresh command times and outcomes, not a revised interpretation of
the earlier audit measurements.

The size/SSR source-resolution blocker is fixed; the two SSR hardcoded origins are
removed. Full/filtered asset case accounting is derived and regression-tested. Those
browser changes still require the fresh full browser wave before they are certified.
HTML-minifier8 compatibility now preserves distinct adjacent Lit directive expression
holes. The complete configuration inventory is71, adding the omitted button/content
suite. All gating configs reject focused tests, and explicit fresh output roots avoid
historical reporter/screenshot overwrites. Discovery continues to require a non-file
reporter; the prior [discovery incident exclusions](test-systems-audit-2026-09-24/discovery-incident.md)
remain in force.

The [execution ledger](../artifacts/test-pipeline-upgrade-2026-09-25/execution-ledger.json)
currently distinguishes planned configurations/prerequisites from actual command
receipts. Full browser, direct-verifier, API/release/theme and bounded performance
validation is pending. This addendum does not claim a full release pass or human review.

A later inventory cross-check upgraded the independently owned SSR parse5 to8.0.1;
Lit's constrained transitive7.3 copy is separate. A new root clean install (2.333s),
full build (56.291s) and71 SSR Node tests per runtime passed. The three public
metadata artifacts remain identical to the preserved starting checkout. Dependent
browser configurations were reopened for validation after this change.

The first bounded package/probe sweep executed42 configurations, recording2691
passes,12 skips,74 unexpected outcomes and one separate server-startup failure.
Its1480.341s command-time sum is fresh upgrade evidence. Stale fixture/selector
repairs retain their assertions and await reruns; the incomplete first sweep
does not establish a release pass. The detailed upgrade report retains both
the failures and the subsequent outcomes without replacing this audit's history.


### Superseding upgrade checkpoint — September25,2026, direct validation

Earlier numbers in this addendum describe their original checkpoints. Current evidence is linked from the [upgrade report](test-pipeline-upgrade-2026-09-25.md); no historical timing is replaced. The v7 matrix passed 724 Node invocations from 139/139 maintained source files plus eight Python tests on each runtime, zero failures/skips. Both builds passed. Subsequent direct-verifier repairs passed 13 and then31 affected Node cases per runtime.

Scoped, qualified overrides also update Lit SSR's actual parse5/@parse5/tools to8.0.1/0.7.0 and both executing Magic String owners to1.4.2. CEM's legacy TypeScript5.4.5 and the literal plugin's TypeScript5.9.3/imported unused default minifier2.1.8 remain explicit upstream constraints. CEM/public declarations remain byte-identical to the start. Public API JSON has only the reviewed generatorDigest provenance change; its remaining semantic contract is unchanged.

The preserved earlier full browser sweep recorded71 configurations,7,567 invocations,7,461 passes,59 unexpected failures and47 expected skips. Focused repairs passed; the ledger is reopened for all71 actual complete configurations on stable combined sources. The direct API smoke run now passes159/159 across three engines. Slider, typography, lazy preparation and swatch checks pass with original assertions retained. Full candidate verification passes60/60 in357.493s; full/filtered assets pass20/20 and2/2, registration passes15/15, and development highlighting passes across all three engines.

The [clean-install proof](../artifacts/test-pipeline-upgrade-2026-09-25/clean-install-final-v5/proof.json) binds all20 owners to current lock hashes, with fresh root/reader receipts after integration and unchanged matching receipts for18 other owners. Final correctness, gates and bounded performance/Phase6 remain outstanding. This checkpoint is not full release certification or human review.


The subsequent combined cold attempt exposed two runner qualification gaps: inherited cache policy in isolated cache-behavior tests, and duplicate test-runner loading during multi-installation browser identity collection. Its19 completed configurations (1,583passes/19skips) remain partial failed-run evidence. Both fixes are regression-qualified; the latest Current/LTS Node matrix passes703/703 from140 sources per line with no skips. Actual browser distribution identity across all71 configurations passes on both lines. The fresh full run is required before complete correctness certification.

### Superseding upgrade checkpoint — September25, interrupted-run repairs

Shared-v2 ended without complete certification:24 configurations passed, the main docs command is incomplete, and46 later configurations lack completed receipts. The original receipt is preserved rather than rewriting its stale status. Six main-docs assertion failures motivated a restored exact breadcrumb count and capability-gated shared hover rules; seven later WebKit timeout/browser-closure outcomes remain retained for fresh qualification. The results reader completed30/30 with all18 exhaustive groups and exact facet parity.

Both post-repair builds passed, and all141 maintained Node sources passed708/708 on each runtime without skips. The focused hover/API after-control passed43 with two original platform skips; its before-control reproduced the defects in all three engines. Further stdout flushing fixes cover all four maintained forced-exit plan commands and add one case, requiring final709-case qualification. Root/reader clean installs were freshly rerun and all20 owning locks still match successful receipts. See the detailed [upgrade continuation](test-pipeline-upgrade-2026-09-25.md) for exact paths, durations and the bounded coordinated runtime integration. Full shared-v3, gates, bounded performance/Phase6 and final review remain outstanding; no main commit or deployment is claimed.

Final maintained-plan qualification then passed all141 Node sources and709 cases on both LTS (53.030s) and Current (50.064s), zero failures/skips; `artifacts/test-pipeline-upgrade-2026-09-25/final-node-union-v1` retains exact commands, identities and native facets. All eight public metadata/provenance copies still match the reviewed prior checkpoint. The following edit records results only; the next fresh comprehensive run binds the resulting documentation and implementation source together.


### Superseding upgrade checkpoint — September25,2026, final local validation

The [current upgrade report](test-pipeline-upgrade-2026-09-25.md) now records the completed local qualification and remaining upstream constraints. Historical audit figures and failed attempts above remain unchanged. No commit, merge to main, package publication, deployment or external CI activation was performed by this task.

All71 maintained Playwright configurations have complete passing selections across shared-v3 and the full affected forms repair:7,529 passes,47 existing skips,0 unexpected/flaky outcomes,7,576 configured invocations including overlaps. Shared-v3 remains a failed original receipt; its forms cold-start failure, stale reader acquisition assertion and exact Finder-metadata identity difference are repaired and reconciled, not erased. The main docs passed2,209/11skip; results-reader30/30 retained all18 exhaustive groups and exact4,278-facet parity per engine. All direct verifier families have passing complete receipts.

Final Current/LTS Node qualification covers143 sources and723/723 cases per runtime, no skips (Current53.079s; LTS60.496s). The standalone API gate passed555 browser and69 Node cases in192.275s. Release passed728/1skip in237.280s; theme638/4skips in703.453s. Each gate retained exact unchanged input/source manifests. Release/theme explicitly used previously validated built artifacts. These overlapping selections are not additive unique coverage.

Bounded performance passed19 stages and80 successful samples with six explicit unsupported native Firefox scoped-registry cells; all collectors, Lighthouse, attribution, reports and negative controls passed. Phase6 passed17 stages,28 cold/eight warm jobs and analysis serialization, retaining identical root source/build bytes. These n=1 observations establish machinery qualification only; full historical campaigns, budget/statistical acceptance and manual device/assistive-technology work remain separate tiers.

The [final clean-install proof](../artifacts/test-pipeline-upgrade-2026-09-25/clean-install-final-v7/proof.json) binds all20 owners to their exact successful locks, with fresh root/reader installs. [Final integrity](../artifacts/test-pipeline-upgrade-2026-09-25/final-integrity-v2/integrity.json) confirms all27 installation rows retain the documented tool versions, seven coordinated script-only manifest changes match the validated source, reviewed public contracts and nine explicitly protected historical files are unchanged. All7,945 actual browser distribution entries match qualified bytes/modes.

CEM TypeScript5.4.5 and literal-plugin TypeScript5.9.3/imported unused minifier2.1.8 still require compatible integration ports. The frozen external pilot remains blocked/retired on unavailable exact input. This is a reviewable local checkpoint, not a fully upgraded release or human acceptance. The report-only documentation changes after the executable checks are explicitly separated from their source identities. The independent Progress Report receives an immutable review card while preserving all unresolved user feedback.
