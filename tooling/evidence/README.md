# Evidence identity, selection and cache

Private maintainer modules, executable with Node 24. They do not execute browser
tests or imply that a component, screenshot or accessibility workflow passed.

```sh
node tooling/evidence/cli.ts --help
node tooling/evidence/cli.ts select tooling/evidence/fixtures/sample-selection.json
node --test tooling/evidence/evidence.test.ts
```

## Three independent identities

`identity.ts` hashes canonical JSON using SHA-256. Object-key order is irrelevant;
array order remains significant. Unsupported/lossy values are rejected. File bytes
use `digestBytes`, and structured manifests use `digestJson`.

- `renderingIdentity` includes artifact/dependency content, fixture/test code,
  resolved dependency URLs and their content identities, theme, fonts/assets,
  browser/OS/tool environment, locale/direction, preferences, viewport/scale,
  readiness and capture controls.
- `comparisonIdentity` includes the candidate and baseline image digests,
  comparison implementation digest and comparison settings. Changing a threshold
  or baseline invalidates comparison without invalidating an unchanged image.
- `reviewIdentity` scopes an exact candidate/baseline, review scope and evidence
  set. It is a review-request key, never approval or baseline adoption. Changed
  content requires a new review identity.

Inputs must be complete and reproducible. A mutable URL, version label, timestamp
or branch is not a substitute for content identity. The caller must hash actual
artifacts, include nondeterministic/external inputs or disable reuse, and record
exact installed browser/tool/OS details. The identity function cannot discover
missing environmental facts on its own.

## Dependency selection and coverage

`selectAffected(graph, changed)` follows reverse dependencies from changed inputs
through token aliases/derivations, theme scopes, styles, components, internal
modules, assets, docs and scenarios. Edges point from a consumer to its inputs.
The receipt explains each affected node. Incomplete metadata or unknown edges
expand selection to every known node and leave explicit gaps. A token source can
therefore invalidate controls and contrast/state recipes without their JS changing.

Graphs are explicit inputs in this first implementation. Source/consumer graph
generation, import-map runtime observations and token-manifest adapters must feed
those inputs later. Tests prove selector semantics on structured graphs, not the
completeness of a real library graph. Compare focused selection against a broad
uncached run before trusting newly generated graph/caching logic.

`coverageReceipt(required, outcomes)` distinguishes `passed`, `failed`, `not-run`,
`unsupported` and `reused`. Missing checks become `not-run` with a next action;
unsupported checks need an explanation. Executed/reused checks require evidence
and originating-run provenance. A cached result is never labeled as executed.

## Local cache API

Use `EvidenceCache(directory)` with a private local directory outside published
assets. `storeArtifact(bytes, { label, mediaType })` writes a content-addressed
artifact. `writeCompleted` accepts a validated identity, originating run, outcome,
selection-receipt artifact, result data and complete evidence artifacts. Files
become visible through atomic rename only after full writes and integrity checks.
Every lookup revalidates entry and artifact hashes; missing/corrupt/interrupted
entries cannot become hits. History retains every completed attempt.

Only completed rendering/comparison passes can be reused. Unknown dependency gaps
make a stored run ineligible for reuse. Failed evidence remains a cache miss;
even a later passing retry with identical inputs cannot hide the previous failure.
That input identity stays ineligible for reuse, preserving the need to investigate
flakiness. This first implementation has no authority to dismiss failures or
transfer review approval; a future explicit review policy can add that separately.
The cache rejects review identities as executable evidence.

The store is an optional optimization with an uncached execution path. It does not
adopt visual baselines, authenticate humans, implement distributed locking,
garbage-collect evidence or make a production support claim. The existing
application/report workflow should display misses, hits, originating runs, gaps
and unresolved findings when it integrates the module.
