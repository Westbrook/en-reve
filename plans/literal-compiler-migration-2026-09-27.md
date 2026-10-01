# Literal compiler and Python migration — local checkpoint

The maintained literal transform and docs specimen parser use the explicit TypeScript 6 API. The old Lit rollup plugin and its TypeScript 5.9.3/default-minifier dependencies are removed. The root build compiler remains TypeScript 7.0.2. This is qualified local work in the isolated candidate, not a main commit or Production deployment.

## Tool ownership

| Role | Before this continuation | Qualified candidate |
|---|---|---|
| Literal/parser API | Plugin 0.2.0-owned TypeScript 5.9.3 | Explicit wrapper 6.0.2 / effective TypeScript 6.0.3 |
| Literal mapped edits | Plugin wrapper with scoped MagicString override | Direct MagicString 1.4.2 |
| HTML minification | Active 8.5.3 plus imported unused default 2.1.8 | Active html-minifier-next 8.5.3 only in root tree |
| Package build/typecheck | TypeScript 7.0.2 | TypeScript 7.0.2, unchanged |
| Candidate Python | Prior CEM checks explicitly used host 3.14.6 | Private 3.14.7, executable/child resolution verified |

Upstream plugin 0.2.0 still supports only TypeScript 2–5 and imports its old default minifier. The replacement preserves import-binding selection, nested literal traversal, expression positions, indexed holes, escaping and effective minifier defaults, including short doctypes. It does not force a new compiler through the old plugin. TypeScript 6 remains the explicit JavaScript AST API compatibility boundary; these checks do not establish a TypeScript 7 JavaScript compiler API port.

## Verification

- Current 26.10.0 and LTS 24.21.0 each compare all 1,484 selected maintained source/built modules, including 314 transforms, plus five boundary fixtures. Exact emitted code and serialized source maps match the preserved old implementation. Both docs and API-reference modes emit the same 59 specimens each. Whole result-object hashes are not used as code/map equality because property order differs.
- After dependency removal, a fresh scripts-disabled npm 12.1.0 clean install passes with unchanged lock and verified compiler/package owners. Each runtime passes 29 literal/specimen and 72 consumer regressions: 202 total, no failures or skips.
- Actual docs production builds, SSR minification client/server builds and breadcrumbs client/server builds pass on both runtimes. Static markup and source-map checks pass. Each docs capture contains 1,171 site files and 69 valid SSR receipts, and verifies the complete authored route set and exact qualified metadata/generated API files. Browser hydration, computed styles and manual acceptance are separate.
- Private Python 3.14.7 passes identity/child-PATH verification and eight budget regressions. Four fresh historical parent/candidate preparations under Current/LTS use that interpreter, preserve the frozen commit and lock, and reproduce packed runtime JavaScript and fixed CEM/type/API semantics. The only permitted historical receipt change is the copied literal-source hash. The historical route Vite config does not run the literal plugin; its replay qualifies Python/metadata integration, while the maintained consumer builds qualify the transform.
- npm removes 53 lock entries and 28 installed packages / 739 filesystem entries. All 223 retained resolved dependency edges and retained package bytes/modes/links stay unchanged. MagicString remains present, removed package directories are absent and retained command links resolve. No TypeScript 5 entry remains in the root lock.

Private Python's optional extension inventory is in its identity receipt; `_lzma` is unavailable in that build. SSL/zlib, the required repository paths above and the actual private interpreter are verified. This is not a claim that every optional CPython extension was built.

The first ordinary attempt passed Python and all 29 JavaScript tests but failed runner accounting because it expected 22. The corrected run retained all assertions. The first removal attempt installed successfully but its verifier omitted peer-dependency traversal; the preserved failed receipt remains failed, and a separate read-only verification proves the exact Rollup peer closure without reinstalling. Fresh consumer/historical attempts retain their own logs and failures. Durations are ordinary single-run wall times including guards, not performance comparisons or speedup evidence.

## Evidence

| Tier | Local output | Execution seal SHA-256 | Ordinary wall time |
|---|---|---|---|
| Literal differential | `/Users/westbrook/.codex/worktrees/cem-candidate/design-system/artifacts/literal-python-qualification-2026-09-27-run4` | `83c9fa0071e5eed20e08bca12022c395f5f88edec3a0fafa6daff95434ded45f` | 105.715 s |
| Dependency-removal verification | `/Users/westbrook/.codex/worktrees/cem-candidate/design-system/artifacts/literal-removal-2026-09-27-run5` | `c287ae7573520f9e678822ca95b4452b672539ef023c991e2dcaf9ecbe3fb796` | 31.413 s |
| Final consumers | `/Users/westbrook/.codex/worktrees/cem-candidate/design-system/artifacts/literal-consumers-2026-09-27-run1` | `ae05c6169fdb890040d079b765254b49a732f79511078a072437fb3968ed99e8` | 498.336 s |
| Python historical preparations | `/Users/westbrook/.codex/worktrees/cem-candidate/design-system/artifacts/literal-python-historical-2026-09-27-run1` | `0f77583814c8784d37677e6f6dc32a54450d9987f16241c43c893c12547792fb` | 191.697 s |

Executed source inventory: `333f4d2e39867df8af99a339136004fa41890a40e241213a296e3205cab21ceb`. Root lock: `cd184c3fedda03dbc7cb5d6c0790bd12fe7906774412328aef9b11c46e099b4c`. Documentation added after executable checks is separately bound by the final documentation application record. The private old plugin closure and original failed attempts remain preserved in separate evidence directories.

For reproduction, use the repository's private runtime wrapper and fresh caller-owned output paths. Run `npm ci --ignore-scripts --no-audit --no-fund`, the complete `tooling/minify/*.test.mjs` and `apps/docs/tests/specimen-source-assembly.test.mjs` suites, both `tooling/css-authoring/*.test.mjs` suites, SSR minification preparation and breadcrumbs adapter/stream-gates suites. Use `EN_SSR_MINIFIER_FIXTURE_DIR` and `EN_BREADCRUMBS_ADAPTER_BUILD_DIR` with fresh directories; set `EN_BREADCRUMBS_ADAPTER_PREPARE_ONLY=1` for its build-only tier. Build `@en-reve/docs` after its prerequisites. Repeat with `EN_TEST_NODE_LINE=lts`. The sealed runner configurations record exact commands, owners, time bounds, inputs and output destinations for these checks.

## Remaining upgrade scope

Callable/mixin CEM support remains explicitly rejected and unqualified; there are no callable superclass factories in the selected maintained library. Its coordinated identity/provenance/composition implementation remains open. Affected CEM browser/framework/API/release/theme and equivalent timing qualification, the unavailable frozen external-pilot input, and root-owned integration into the shared canonical checkout remain visible in the project report. The inactive archived release comparator is not qualified for the new schema/Parts policy. Human review is pending. No packages, site or external CI were published or activated.
