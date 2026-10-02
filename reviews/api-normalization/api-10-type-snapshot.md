# API-10: public TypeScript snapshot

The supplemental type snapshot was the first published API-10 slice. The remaining
API graph, event, Parts, extraction, shared-tooling and support-policy work is now
implemented; see [the completion record](api-10-completion.md).

## Result

`packages/elements/public-types.json` now resolves the public `DateRange` export to
its declaration, including readonly `start: string` and `end: string`. `ToastOptions`,
`ColorFormat` and other reachable local declarations are likewise recorded. The
component APIs themselves do not need to change for this tooling improvement.

The snapshot follows actual package entrypoints through barrel exports and aliases.
It distinguishes type-only exports, retains generic contracts and cycles, and omits
runtime bodies. The current export map still permits nested implementation imports;
they are inventoried without changing or endorsing that release policy.

A hypothetical `DateRange.end: string` → `Date` change now produces a type fact for
that public export even with an identical CEM. The release draft remains incomplete
until an authored change classifies the affected facts. Type narrowing, readonly or
optional changes, generic changes and removals are likewise reviewable; the tool
makes no automatic assignability or behavioral-compatibility claim.

## Maintainer workflow

```sh
npm run metadata:types
npm run check:types
npm run test:tooling
```

`npm run metadata` includes type snapshot generation. Docs builds require a fresh
snapshot and expose **Exported TypeScript types** on the API reference, alongside a
download of the exact complete snapshot. The docs and release tool use the same
record and dependency-closure projection.

Keep the CEM and `public-types.json` together in each before/after release artifact
directory. Then use the normal release CLI, which loads both snapshots by default:

```sh
node tooling/releases/cli.ts diff before/custom-elements.json after/custom-elements.json
node tooling/releases/cli.ts draft changes.json before/custom-elements.json after/custom-elements.json /tmp/en-release-review
```

Use `--types <before-file> <after-file>` for other locations. `--cem-only` explicitly
permits historical limited evidence and labels type coverage as not supplied.
Programmatic `createRelease(input, beforeCem, afterCem, { before, after })` adds type
facts to the existing classification and versioning workflow. Historical three-arg
callers keep explicitly labelled CEM-only coverage.

## Verification and limits

Focused source fixtures cover barrel/alias resolution, reachable and recursive
types, generic/mapped contracts, inferred accessors, hidden private members, exact
export exclusions, type-only exports, runtime-only edits, stale snapshots, missing
local types, malformed inputs, release classification and CLI evidence requirements.
The regression changes a reachable field while holding the CEM fixed.

Source declarations are emitted in memory using the analyzer's pinned TypeScript
parser. The generator identity is recorded and freshness regenerates the entire
snapshot for comparison. External dependency symbols and requirements are retained;
changes to external declaration bodies require that dependency's own API review.
The completion record describes the additional extraction identity checks, event
validation and catalog-wide rendered Parts coverage.
