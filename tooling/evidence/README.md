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

`impact.mjs` now generates a graph from the current built token manifest, public
component graph, authored module imports, customization-source inventory and the
same specimen assembler used by docs. The docs build emits `/impact.json` before
its exact-build inventory is sealed. Run the normal metadata freshness checks
before rebuilding; the generator consumes that matching producer output.

```sh
node tooling/evidence/impact.mjs /absolute/new-impact-directory
node tooling/evidence/impact.mjs select /absolute/new-impact-directory/impact.json token:component.button.radius
node tooling/evidence/impact.mjs select dist/impact.json source:packages/styles/src/buttons.ts
```

The manifest contains source/content and compiler identities, potential token
alias/derivation edges, optional-property fallbacks, runtime imports (including
literal lazy imports), declared generated children, source locations,  authored
specimen consumers and workflows. CSS-authored adapters point back to their
inputs. Open token-name swatches depend on all properties; shared module imports
are a conservative superset of the particular exports used. Docs asset changes
select all docs cases rather than pretending precise asset ownership. Nonliteral
imports, missing sources and unknown CSS expressions expand selection to all
known nodes. Unknown changed IDs also expand; they never produce an empty pass.

The result is **potential source impact**, not browser-effective cascade proof.
External application code and consumer import-map observations remain outside
this authored-library graph. It does not prune the full review sheet or skip any
required gate. The broad browser qualification compares observed computed-style
changes across every rendered sticker-sheet case with selected cases for three
representative pins; initial-state observations do not prove all hidden states,
all candidate values or pixel equivalence. The visual evidence pipeline remains
separate. A retained manifest describes its exact inputs, not the current checkout
merely because the pathname is unchanged.

The pure traversal is shared in `graph-core.ts`. `impact-client.mjs` provides a
browser-safe integrity/selection boundary used by both the CLI and Theme Review;
`graph.ts` also adds content identity for general Node consumers. The candidate UI
checks the map’s transport digest against its exact review build before selection.
Paired changes select across both appearances, and exports retain the selection
and candidate identities. This does not mark visual evidence run or approve a theme. Tests retain selector, identity and cache controls alongside
real-source coverage. Newly introduced dependency policies require broad uncached
qualification before trusting reduced execution or cache reuse.

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
