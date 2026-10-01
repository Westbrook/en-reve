# CEM and literal-tooling upgrade checkpoint — 2026-09-27

The isolated candidate has qualified literal/compiler, ordinary CEM, and historical Python work. Callable/mixin CEM support is unfinished. This checkpoint records completed evidence independently of the remaining implementation; committing this document does not integrate or qualify the candidate code.

The original upgrade request excludes package publication, Production deployment and activation of external CI. The subsequent closeout instruction authorizes focused commits toward `main`; the coordinating task sequences integration and verifies ancestry. No Production completion is claimed.

## Qualified boundaries

| Scope | Recorded result | Limit |
|---|---|---|
| Ordinary maintained CEM generation | 358 passing Node checks; independent evidence review passed | Does not establish callable superclass support or a full release/browser pass |
| Literal transform and specimen parser | 58 checks across Current/LTS; 1,484 selected modules per runtime, including 314 transforms and five extra boundary fixtures; emitted code/maps match the retained implementation | Limited to the selected source/build identities |
| Literal consumers after dependency removal | 202 Node checks, zero skips; clean install and docs/SSR/breadcrumbs builds pass on both runtimes | Browser hydration, computed styles and manual acceptance remain separate |
| Historical preparations with private Python 3.14.7 | Four subjects and 12 routes; packed runtime JavaScript membership/bytes and fixed metadata semantics preserved | Historical routes copy the literal source; maintained consumer builds exercise its transform |
| Callable constructor graph | 62 checks, zero skips | Graph only; isolated draft, not applied to the candidate |
| Callable declaration origins | 40 checks, zero skips | Origin identity only; isolated draft, not full extraction/composition |

These selections overlap. Do not add their counts and describe the sum as unique pipeline coverage. The 358-check ordinary CEM qualification precedes the final literal-only change; later literal/consumer/historical tiers have their own exact identities.

The explicit JavaScript AST API uses `@typescript/typescript6` 6.0.2 with effective TypeScript 6.0.3. The native package build compiler stays TypeScript 7.0.2. The candidate replaces the old Lit literal plugin with the maintained import-binding-aware transform and direct MagicString 1.4.2. Candidate root HTML minification uses html-minifier-next 8.5.3. The complete candidate removes the old analyzer/plugin TypeScript 5 copies; this is not a claim about the dependency graph currently on `main`.

Literal consumer qualification includes 1,171 captured docs files and 69 SSR receipts per runtime. Private Python's required paths were verified; its optional `_lzma` extension is unavailable. Recorded wall times are ordinary correctness receipts, not evidence of a performance improvement. Historical failures, old locks and vendor snapshots remain preserved.

## Wiring failure and repair

The first own-extraction wiring run executed 49 named tests on Node Current 26.10.0: **28 passed, 21 failed, zero skipped/cancelled/todo**. Fail-fast behavior left all 49 LTS tests unrun. The actual host process exited 1. Machine/stage owners released normally; no retry, install or browser run occurred.

The repair addresses exact symbol lookup for anonymous returned class expressions, constructor-versus-instance Lit ancestry, attached JSDoc in four fixtures, and a fixture field that collided with `HTMLElement.hidden`. It preserves all 49 original names/assertions and adds one native/opaque constructor control. Independent source review found no remaining blocker in this narrow repair. Source review does not establish runtime correctness.

At this checkpoint, repair v3 has **100 proposed checks and zero executed checks**: 50 on Current 26.10.0 and 50 on LTS 24.21.0. Its fresh five-command runner is pending source review and a new coordinated allocation. The consumed run1 allocation cannot authorize another run. Seven-facet composition, occurrence-specific policy, real generator/serializer transitions, strict consumer checks and callable-heritage guard removal remain unfinished after this narrow tier.

The failed run did not reach its ordinary postflight guard or produce the full outer `inputs-after.json`. A separate post-failure check preserved the 1,357 input pins, 1,319 stage files and owner absence. That check does not replace missing ordinary postflight/runtime receipts or qualify the failed attempt. Original receipts are immutable.

## Integration dependencies

A literal-only code commit needs a coherent dependency and compiler-command boundary. Copying the frozen candidate root manifest/lock wholesale would also switch CEM packages and import invocation-harness script changes. The literal/specimen implementations require the TS6 wrapper and shared compiler API module; adding that compiler wrapper also requires preserving explicit TS7 selection for native build/typecheck commands, rather than relying on the package-manager `.bin/tsc` winner.

The reconciliation preimages describe the dirty canonical/baseline snapshot, not `main` at `aa2d5ffc539b1a5c5368ae8ce70bd943d3db94e7`. Both the literal and specimen files already differ between those bases; the frozen specimen file also contains local-source assembly work beyond the parser port. Main and candidate have different minifier, MagicString, Vite and parse5 versions. A patch that matches a reconciliation preimage cannot therefore be applied blindly to main.

Prepare any split against the actual integration tree, regenerate its owning lockfile with the selected package manager, and qualify its clean install, literal/specimen behavior and affected builds. Earlier combined-candidate receipts do not prove an unexecuted partial dependency graph. The documentation checkpoint can land independently; executable tooling changes remain dependent on that reconciliation and validation.

The sealed integration selection contains 116 exact included file versions and 22 exclusions whose canonical presence must be retained. It is a reconciliation recipe for a fresh combined source snapshot, not authority to copy an entire checkout or to call a partial selection qualified. Recheck canonical preimages and resolve changed paths explicitly. Preserve unrelated user edits and frozen runtime inputs. Record a new combined source/build identity and perform the required qualification before reporting integration complete.

## Evidence and reproduction

Local evidence is retained outside this commit. The paths below are environment-specific receipts, not dependencies for a normal repository checkout.

Candidate evidence root: `/Users/westbrook/.codex/worktrees/cem-candidate/design-system/artifacts`.
Continuation evidence root: `/Users/westbrook/.codex/visualizations/2026/09/25/01a0d5e1-c40f-7f93-9d43-f4ed8bc09201`.

| Evidence under the corresponding root | Seal SHA-256 |
|---|---|
| Candidate: `cem-final-qualification-2026-09-26-run2` | `3a4644070e28f1856308d3c064bfdb7084e8d166c9f3a17d02362768999472cb` |
| Candidate: `literal-python-qualification-2026-09-27-run4` | `83c9fa0071e5eed20e08bca12022c395f5f88edec3a0fafa6daff95434ded45f` |
| Candidate: `literal-consumers-2026-09-27-run1` | `ae05c6169fdb890040d079b765254b49a732f79511078a072437fb3968ed99e8` |
| Candidate: `literal-python-historical-2026-09-27-run1` | `0f77583814c8784d37677e6f6dc32a54450d9987f16241c43c893c12547792fb` |
| Continuation: `cem-mixin-qualification-2026-09-27-run1` | `ac68ac646cf941754f30d63ca5a783d55bda72bb2ed7c8b8785d827351246e8e` |
| Continuation: `cem-mixin-origins-qualification-2026-09-27-run1` | `e6db0fb4f1486179fa329566814213bc2f51dcc4b79b971eae9770d255b24d3e` |
| Continuation: failed `cem-mixin-wiring-qualification-2026-09-27-run1` | `21d28d0f539230d7c4f4ab4ce0784e7af6df402f4d432e7750106c45bef2ba5b` |
| Continuation: repaired `cem-mixin-wiring-draft-v3` source | `fa81d325b8c468b715f6809bada0f177a1718b94347f032d6f9ca4ae445b8b6a` |

Frozen candidate source inventory: `01fb3880ff772bd7ca3efb7292896cc8c0779e257b7e68887b5ea302e3e8c922`.
Its root lock: `cd184c3fedda03dbc7cb5d6c0790bd12fe7906774412328aef9b11c46e099b4c`.
Literal-executed source inventory: `333f4d2e39867df8af99a339136004fa41890a40e241213a296e3205cab21ceb`; four separately reviewed Markdown changes account for the final source identity.

The exact commands, executable hashes, environment, dependency/stage maps, named selections, time bounds, output paths and receipts are in the sealed runner/evidence manifests. Reproduction must use a fresh caller-owned output and stage, the pinned runtimes, the qualified sources and a coordinated allocation. For the candidate literal consumer tier, the selected operations include a scripts-disabled clean install, all minifier/specimen and CSS-authoring tests, docs production builds and SSR/breadcrumbs preparations on both runtime lines. Do not run these commands in frozen evidence directories or assume the corresponding wrappers already exist on `main`.

The next wiring proposal is `cem-mixin-wiring-runner-2026-09-27-v2/config.json`, SHA-256 `62a93518b5159cc9a503cdc502b2d5860d276dde6d807da769da087772f99f40`. It proposes exactly five serial commands with fresh stage `/private/tmp/cem-mixin-wiring-20260927-run2`; no test/import/install/browser execution was used to prepare it.

Broader browser/framework/API/release/theme qualification, equivalent timing work, the unavailable frozen external-pilot input and final combined integration remain separately tracked. Human review is pending. The task is not ready to archive.

[Progress Report and current review checkpoint](http://127.0.0.1:4177/#review-cem-mixin-wiring-source-20260927-v1)
