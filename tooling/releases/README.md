# Release drafts

Private maintainer tooling, executable with Node 24. It never publishes packages,
changes package versions, adopts screenshots, or approves a change. The installable
packages share a proposed version train; component entries record their changes
within that train, without inventing independent component package versions.

```sh
node tooling/releases/cli.ts --help
node tooling/releases/cli.ts diff tooling/releases/fixtures/sample-before.cem.json tooling/releases/fixtures/sample-after.cem.json --cem-only
node tooling/releases/cli.ts draft tooling/releases/fixtures/sample-changes.json tooling/releases/fixtures/sample-before.cem.json tooling/releases/fixtures/sample-after.cem.json /tmp/en-sample-release --cem-only
node --test tooling/releases/releases.test.ts
```

The output directory must not already exist. The `fixtures/sample-*` files are
synthetic format examples: their artifact hashes and unavailable demo are explicitly
samples, and are never actual library release or browser evidence.

## Inputs and classification

`cem-diff.ts` reads structured CEM JSON. It describes each element's attributes,
public properties/methods, events, slots, CSS Parts/properties and declaration
metadata. Local superclass/mixin declarations are traversed; external/unresolved
bases are explicit review gaps. Private/protected members are excluded. Exported
classes/functions and other module exports are also compared under `$package`.
CEM `schemaVersion` describes its format. It never supplies a component version.

Additions suggest features; removals require a breaking release. Changed types,
defaults, semantics, extension metadata and required additions retain a
`reviewRequired` flag. Description/summary-only edits suggest fixes. The tool does
not attempt TypeScript assignability analysis or infer browser behavior. Unknown
CEM schemas and unresolved definitions cannot become a confident classification.

Use `release.ts`'s `ReleaseInput` shape for authored changes. Every change has an
ID, affected component names (or `$package`), level, summary, rationale and evidence
array. Include behavioral, visual, accessibility and performance changes even when
the CEM is identical. Optional `tokens` and `affected: "inherited"` record effects
from shared dependencies. Attach migration/replacement guidance to breaking,
removed or deprecated contracts; a planned removal version is optional.

Run `diff` first, then associate unknown facts with a declared classification via
their content-derived `cemFactIds`. A fact association must name the same component.
An authored fix cannot downgrade a detected public removal. Authored classification
is a proposal for human review, not an approval receipt. Changes without enough
classification keep `classificationComplete: false`; the proposed version is not
safe to adopt until those issues are resolved.

The maximum required level determines the proposed train version:

| Base | Changes | Result |
| --- | --- | --- |
| `0.x.y` | Breaking/removal/deprecation | `0.(x+1).0` |
| `0.x.y` | Feature/fix | `0.x.(y+1)` |
| Stable `x.y.z` | Breaking/removal | `(x+1).0.0` |
| Stable `x.y.z` | Feature/deprecation | `x.(y+1).0` |
| Stable `x.y.z` | Fix | `x.y.(z+1)` |

No changes produce no increment. Explicit `stabilize: true` proposes `1.0.0` from
an initial version and records a mandatory stability-review issue. Prerelease/build
labels are rejected until a policy for them is chosen.

## Outputs and evidence limits

`release.json` contains facts, declared changes, exact base/candidate artifact
identities, component history, proposed version, migration notes, links and open
review requirements. `CHANGELOG.md` is a human-readable view of that record.
`releasedIn` stays null in a draft; `introducedIn` stays unknown unless prior
history or a newly added element establishes it. Neither schema completeness nor
an empty issue list adopts a release: the status is at most `ready-for-review`.

Evidence links retain `available`, `not-run` and `unsupported` status. Available
links need an exact content digest; this tool does not fetch links, verify remote
access controls, execute scenarios or authenticate reviewer identities. The
calling evidence pipeline must supply verified artifacts. CEM cannot describe all
CSS behavior, focus/keyboard/IME behavior, accessibility, composition constraints,
SSR compatibility or performance; declared records and live evidence remain
necessary.

The initial implementation does not select a submission service, grant an adoption
authority or enforce time-based deprecation windows. The
[interactive version review packager](REVIEW.md) now consumes the exact release
record and two original documentation builds, with mapped live scenarios and
version-bound feedback. This does not adopt a release or qualify missing evidence.

## Pending theme migration

Carry [the unreleased theme migration record](../../plans/theme-next-release.md)
into the next package release draft. Runtime fallback/paint changes need authored
classification even when the CEM is unchanged.


## Type-aware release review

The CLI now requires each CEM's sibling `public-types.json` by default. Retain the
CEM and snapshot together for each release. Select other exact files with:

```sh
node tooling/releases/cli.ts diff before/custom-elements.json after/custom-elements.json --types before/public-types.json after/public-types.json
node tooling/releases/cli.ts draft changes.json before/custom-elements.json after/custom-elements.json /tmp/en-release-review --types before/public-types.json after/public-types.json
```

Use `--cem-only` explicitly for historical CEM-only evidence. Its output is marked
`typeCoverage: "not-supplied"`; it cannot establish type API compatibility. The
low-level `diffCem()` remains CEM-only. Programmatic `createRelease()` accepts an
optional fourth `{ before, after }` snapshot argument; callers that omit it retain
legacy limited coverage, also marked `not-supplied`.

Type changes appear as `$package` facts with `surface: "type"`, named by package
import and export. Each before/after includes the reachable declaration graph.
Assign their IDs through the existing `cemFactIds` field (retained for compatibility)
and include `$package` in `components`. Changed and added types require an explicit
compatibility classification; removals retain the removal severity floor. Compiler,
extraction-policy or dependency-requirement changes remain review gaps. External
dependency declaration bodies and runtime behavior still require separate evidence.


## Public graph review

Keep `public-api.json`, `public-types.json` and `custom-elements.json` together for
both release sides. The normal `diff`/`draft` commands consume matching graphs when
present, reject one-sided graph coverage or mismatched digests, and add explicit
review facts for supported-entry policy, registration dependencies and event
behavior. `graph <before-cem> <after-cem> <before-graph> <after-graph>` selects graphs
explicitly. Older pairs without graphs retain type/CEM coverage; `--cem-only`
remains an explicit limited-evidence mode.

Unresolved local CEM exports remain gaps unless the corresponding side's package
type snapshot resolves that exact entry and symbol. External declaration bodies
and browser semantics remain review limits, not fabricated local declarations.

## Candidate verification gate

Run `npm run test:release` before preparing or publishing a candidate. It builds,
checks graph/source freshness, tooling, all catalog Parts, shared API events and
transactions, event/token/form units, customization, all control geometry and
command/menu regressions. `-- --skip-build` reuses an already completed build;
freshness still runs. Results and log hashes are written to
`node_modules/.cache/release-verification/verification.json` (override with
`EN_RELEASE_TEST_OUTPUT_DIR`). The receipt binds the tracked and unignored source
files to a digest and rejects source changes during verification.

`npm run test:api` now includes `probes/api-events` and `probes/api-transactions`.
Existing native-registry skips remain explicit. The gate does not run physical
hardware or assistive technology, publish a package, acknowledge user review, or
replace `test:theme` for theme migration. Carry [the combined API/theme migration
record](../../plans/api-next-release.md) into the actual package release.
