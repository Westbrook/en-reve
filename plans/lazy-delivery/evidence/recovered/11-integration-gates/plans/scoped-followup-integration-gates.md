# Scoped follow-up integration gates

Task 11 owns orchestration and portable evidence. Runtime behavior and assertion ownership remain with the existing suites, task 10 (public consumer conformance) and task 9 (diagnostics).

Base: local `main` **66386af7daac295cb2e178236d45289a9ebced4f**, tree **6f0cd79db801f483dd40b51885742580c951b8a0**. Ancestor **220d2dd3e4f55c6f2557d7e7fc593d5d16099bba** verified before starting. Branch `codex/scoped-integration-gates`. `git remote -v` returned no entries. Original dirty checkout and Phase 0–6 archives remain separate; no merge, remote, deployment or hosted CI configuration is authorized.

## Commands

Use Node 24 (native TypeScript stripping), npm, Python 3, Git and tar. Install the existing locked tools in the checkout:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm ci --prefix showcases/performance --ignore-scripts --no-audit --no-fund
npx playwright install chromium firefox webkit
npm run check:smoke -- --base <comparison-commit> --list
npm run check:smoke -- --base <comparison-commit>
node tooling/integration-gates/run.mjs --stage metadata
node tooling/integration-gates/run.mjs --stage registry
node tooling/integration-gates/run.mjs --stage release --stage theme --stage workflows
npm run check:integration -- --commit <full-40-character-HEAD>
node tooling/integration-gates/reproduce.mjs <full-40-character-commit>
node tooling/integration-gates/bundle.mjs <completed-run> <new-portable-bundle>
```

Browser installation is an explicit environment prerequisite, not an automatic fallback. Honor `PLAYWRIGHT_BROWSERS_PATH` when deliberately configured; do not assume a historical temporary cache has installed executables. `EN_GATE_OFFLINE=1` makes reproduction's npm install use the existing cache. No command adds a remote or provisions a CI service.

`--output` accepts a **new**, unoccupied directory. Default outputs are unique ignored `artifacts/cache/integration-gates/<mode>-*/run/`. Reproduction uses its own unique ignored directory. `--list` prints the exact selected commands and dependency closure without running them. Multiple `--stage` arguments compose groups and individual IDs. Unknown names/options fail. `--skip ID` explicitly leaves that stage required and returns nonzero. Exact integration rejects partial `--stage` selections.

Exact integration requires an exact HEAD SHA and clean tracked/untracked source before execution. Its receipt binds the Git tree, all tracked non-archive source byte hashes, lockfiles, installed package versions, commands, configuration, built asset byte hashes, logs and output files. Any generated metadata drift or source mutation during execution fails the aggregate. A successful build does not authorize committing regenerated API changes.

## Selection and inventory

| Selection | Inclusion rule | Existing owners invoked |
| --- | --- | --- |
| Smoke, docs/evidence or runner only | Orchestration semantics and frozen integrity | Node test runner; original seals/checksum inventories |
| Smoke, relevant source | Metadata/tooling edits select metadata/tooling/Parts; styles/tokens select metadata/theme units/Parts/geometry/cascade/states; docs select workflows; scoped/lazy/activation/hydration harness edits select their affected groups | Build and capability dependencies included automatically |
| Smoke, runtime or unknown paths | Metadata, tooling, registry group, Parts, geometry, cascade, states, workflows | Conservative widening for unclassified changes |
| `metadata` | Build dependency plus API, type, lazy, customization and CEM freshness | `check:api`, `check:types`, `check:lazy`, `check:customization`, `generate-elements.ts --check` |
| `release` | Existing release verifier's six post-build stages, expanded to visible leaf checks | tooling, Parts, events, transactions, transaction units, customization, number-field geometry, commands |
| `theme` | All 11 existing theme regression stages, sharing build/Parts/customization once | unit, contrast, properties, scopes, cascade, **static CSS Parts states**, catalog Parts, composition, docs, candidates |
| `registry` | Packed scope, context, lazy, activation and hydration; actual capability recording | scope packed types/ownership, context protocol, loader Node tests, lazy packed real settings workflow, activation boundaries and library, registration Node tests, all existing SSR Node tests, scoped/lazy/activation type consumers, hydration fixtures |
| `workflows` | Complete existing application workflow config | real settings, form, date, editor and other application interactions |
| Exact integration | Every current catalog stage, all installed configured engines, no retries | All above on the same source commit, no inherited pass from another commit |
| Metadata reproducibility | Required when generators, source types or generated metadata change; also run for this task | Two fresh local sparse Git checkouts, locked npm installs, library builds and two metadata generations in each |

This table describes orchestration, not new assertion definitions. `catalog.mjs` maps commands; `playwright.config.ts` preserves each suite's tests/projects/expectations and server, and changes only output routing, retry policy and owned-server reuse. New suite additions must be added to the catalog deliberately. Existing release/theme entrypoints remain supported independently.

Smoke's relevant selection is a regression gate, not a full release certification or evidence of a performance improvement. Supply `--base` to compare committed changes. Without change provenance it widens conservatively. Runtime or unknown source changes include CSS Parts and number-field geometry: the merged integration receipts showed that fixture/tool alignment (`6c767c0c`) and the compound-number sizing fix (`37e91654`) were distinct. The retained 80-pixel assertions caught an 82-pixel frame caused by specificity. Original integration qualification ran broad theme before the selector fix and an affected cascade/geometry/workflow supplement afterward; this task does not recast those as all running on the same commit.

## Stage and failure semantics

Every catalog stage appears as `passed`, `failed`, `skipped`, `unsupported`, or pending/running in an interrupted receipt. Required dependency failures skip dependents visibly. Independent stages continue to gather evidence. The first failing required child retains its positive nonzero exit code; missing/unsupported required stages return 2, orchestration errors return 1, and lock contention returns 75. Passed commands with missing browser JSON or zero executed cases cannot pass the aggregate. Individual capability skips and annotations remain in the browser inventory. Unexpected/flaky outcomes fail even if a child incorrectly returns zero. Explicitly excluded stages are not evidence of coverage.

A failed assertion is initially **unclassified**, with the original command, exit status and log. A missing executable is evidenced environment failure; missing required report data is evidenced harness failure. Do not automatically label browser timeouts transient or downgrade them to capability skips. Diagnose product versus harness/environment/transient with exact source/configuration evidence and store a new attempt beside the failed one; never overwrite it or retry until green. Existing skip annotations retain their owners' meaning and are not inferred to be native-capability results.

Requested `auto`/global construction, actual native/global registry and import bridge, and unsupported dormant parsing are recorded separately in `capabilities/capabilities.json` with browser versions. Every browser stage depends on this recorder, including standalone release/theme selections. This provenance uses the existing public capability adapter. Registry mismatch exceptions never trigger orchestrator fallback. Browser case reports carry native-only skip reasons.

## Resources and portability

All gate runs and metadata reproductions acquire the same host-wide `os.tmpdir()/en-reve-integration-machine.lock` directory, record its owner and fail closed if occupied. Fixed-port historical harnesses are therefore explicitly serialized. Do not run their raw commands concurrently outside this protocol. `reuseExistingServer` is false: a foreign occupied port fails instead of consuming another task's app. Per-stage output, traces, JSON, packed sites and temporary package directories live below the unique run. Output-only env inputs are `EN_SCOPE_OUT`, `EN_LAZY_OUT`, `EN_ACTIVATION_OUT`, `EN_ACTIVATION_LIBRARY_OUT`, `EN_HYDRATION_OUT`; defaults preserve standalone compatibility. The scope server serves the owned packed bytes at the fixture's existing URL without editing test assertions or archived files.

Locks are never stolen and preexisting output directories are never deleted. After an interruption, inspect the recorded PID and owned server processes before manually removing that specific stale lock. Completed/failed run artifacts remain for diagnosis; prune only a run you own. Local checkout build directories are shared, so the lock covers builds as well as browsers. Receipts preserve relative artifact links and hash exact raw bytes; raw logs/traces can contain machine paths and are not rewritten. Source paths and hash-inventory keys are repository-relative. Absolute runtime paths are configuration inputs, not package identity.

The historical performance lock is checkout-local. Timing owners must also coordinate with the canonical measurement-machine lock and reserve a quiet interval before capture. CPU count/load snapshots describe contention context, not proof of a quiet machine. This task runs no timing campaign. Promotions require matched parent/candidate workloads with unchanged budgets, at least 30 successful samples per affected configuration and separate repeated retention runs, retaining failed attempts. Never pool Phases 0–6, cold/warm caches, preparation policies or requested/actual registry paths. Deterministic payload/budget and functional smoke checks alone do not establish an improvement.

Metadata is compared as generated bytes, without stripping absolute paths or sorting after generation. The existing inferred-import normalization was already merged; authored types and substantive API changes remain visible. Compare repeated generation, both clean paths, and the committed files. Frozen manifests, raw trials and checksums are read-only; `frozen.py` validates all original checksum inventories and seals and writes only a new receipt.

## Ownership, review and handoff

Task 10 confirmed additive `probes/consumer-contracts` ownership and `EN_CONSUMER_CONTRACTS_OUT` support; its command is prepare then Playwright, fixed port 4257. It is not on this base yet. Integrate its catalog stage only after its commit is present; don't synthesize its API assertions or import an unmerged task. Task 9 was not running in the task inventory at kickoff. Its future diagnostics interface should return commands/configuration and artifact-relative receipts under a caller-owned output, preserving failure classification and requested/actual capability. This task owns no diagnostics content/API checks.

No product interactions changed; automated DOM/focus evidence does not reopen accepted Phase 5/6 manual review. Physical devices, real IME, native dialogs/autofill and assistive-technology speech are unperformed in this task. Existing unresolved report feedback remains open. No new numeric report tables are introduced; future change tables must retain sortable `en-table` behavior and below-table better-direction notes for every change column.

Verification results and exact tested implementation commit are recorded in `artifacts/scoped-followup-integration-gates/README.md`. The canonical independent report remains at http://127.0.0.1:4177. Only this task's iteration, handoff, deliverable and review card are updated under `data/.project.lock`; other work and review checkpoints are preserved.
