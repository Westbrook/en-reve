# Interactive old/new release review

Pair two original documentation builds with a reproduced release draft. A portable
package provides change/migration notes, API facts, mapped scenarios, independent
live previews, explicit gaps, and version-bound feedback. No service, package
release, adoption authority or network connection is required for local review.

## Prepare exact inputs

1. Retain both original documentation output directories, each with its intact
   `review-build.json` and public contract artifacts. Do not use the transformed
   GitHub Pages output. Package versions alone do not identify a build.
2. In the normal release input, set `baseArtifacts.reviewBuild` and
   `candidateArtifacts.reviewBuild` to `sha256:` followed by the SHA-256 of the
   respective **raw `review-build.json` bytes**. Preserve other artifact identities.
3. Generate `release.json` with the existing release CLI against those builds'
   `custom-elements.json` files and matching type/graph snapshots. Preserve its
   unknowns, issues and sample status; missing evidence remains missing.
4. Author scenario mappings and package them with the command below. Every affected
   component (including `$package`) needs at least one scenario. Added/removed or
   otherwise unavailable sides use `null` and an explicit reason; no replacement
   placeholder demo is silently substituted.

```json
{
  "schemaVersion": 1,
  "beforeDirectory": "./old-dist",
  "afterDirectory": "./new-dist",
  "releaseFile": "./release-draft/release.json",
  "scenarios": [{
    "id": "button-activation",
    "title": "Button activation and disabled state",
    "component": "en-button",
    "instructions": "Compare pointer and keyboard activation, then disabled behavior.",
    "before": "/api-reference?component=en-button",
    "after": "/api-reference?component=en-button"
  }]
}
```

Replace the example paths and owner with entries available in your actual builds.
Scenario paths may include queries/fragments, but must resolve to packaged HTML.
For an absent side, use `"before": null` and
`"beforeUnavailable": "This component did not exist in the base release."`.

```sh
tooling/test-pipeline/with-toolchain.sh node tooling/releases/review-package.mjs \
  /absolute/review-config.json /absolute/new-review-package
```

Configuration paths resolve relative to the configuration file. Output must not
exist. The packager verifies all build bytes, reproduces the release draft from
both builds' CEM/type/graph evidence at its declared coverage level, and rejects
mismatched drafts or artifacts. It copies the original HTML/JS/CSS unchanged.
CEM-only historical records remain explicitly limited; their viewer cannot imply
type/graph qualification. A synthetic `sample` remains conspicuously labeled.

## Review and keep feedback

Transfer the complete directory privately. With Node 24+ already available:

```sh
node serve.mjs --verify
node serve.mjs
```

Open the printed local URL. Select a scenario and **Load selected scenario**. The
portal and two builds use three separate loopback origins: custom-element
registries, styles, storage and interaction state remain independent. Each side
can be opened separately. Switching layout preserves the loaded frames; changing
scenario and loading it starts fresh frames. Narrow screens offer Before/After
views without horizontal page scrolling. Network resources are restricted to
these local origins; external evidence links require connectivity.

Read authored rationale/migration guidance alongside API facts and open release
requirements. Scenario mapping establishes a starting page, not captured or
synchronized application state. Navigation within either version can change its
view; reload the scenario to return to the recorded starting paths. Viewport,
locale, platform and workflow setup still belong to the reviewer/test fixture.

Record an observation and notes per scenario, plus a review-environment description.
**Export feedback** saves all observations with the exact review/release digests,
build identities and scenario routes. **Reopen feedback** rejects another version,
unknown/duplicate scenarios or invalid observations without replacing current notes.
A newer edit invalidates an outstanding import. Drafts remain in memory until
exported; store feedback outside the immutable package. Imports are data, never
HTML or executable content. An observation is not approval or a passed test.

The package starts with acceptance `not-run` and leaves the original release
record unchanged. No reviewer identity, remote submission, baseline adoption,
expected/actual/diff image acquisition, or release authority is manufactured.
Hashes detect corruption rather than authenticate a publisher; distribute trusted
application code and preserve the original manifest through a trusted channel.

## Verification

`review-package.test.mjs` covers build/release reproduction, immutable output,
identity mismatch, explicit missing sides, local route restrictions, separate
origins and post-start corruption. Shared build-copy/integrity/server primitives
remain covered by the offline-theme controls.

`apps/docs/tests/version-review.spec.ts` uses real production documentation in
independent origins, exercises controls and storage isolation, switches responsive
layouts, and round-trips/rejects feedback while blocking external requests. Set
`EN_VERSION_REVIEW_BEFORE_BUILD` to an original retained output directory for an
actual build pair. Without that explicit historical input it labels its same-build
pair a **sample isolation fixture**, not evidence of a library change.

## Native scoped component examples

Full-document panes cover documentation/workflows. Component coexistence has an
additional native scoped-registry path; the former is not a substitute for the
latter. Supply pure consumer modules from each version's own installation. Each
exports `async mount({host, registry, scenario})`, registers through that version's
public `createElementScope({document: host.ownerDocument, registry})`, attaches an
open scoped shadow root to `host`, renders the selected scenario, awaits component
readiness, and optionally returns a cleanup function. Imports must not register
global elements. Never use a fallback global registry for a version comparison.

Bundle each authored entry with the existing pinned esbuild installation used by
the registry probes (provision `showcases/performance` dependencies as documented):

```sh
tooling/test-pipeline/with-toolchain.sh node tooling/releases/scoped-fixture.mjs \
  /absolute/old-consumer/entry.js button-activation /absolute/old-scoped-fixture
```

Repeat for the new version. The entry's own installation resolves public package
imports. The output must be self-contained, with no external module imports. Its
manifest hashes every input and output; it is fixture provenance, not package
release or behavioral acceptance. Set the release input's respective
`baseArtifacts.scopedFixture` / `candidateArtifacts.scopedFixture` to SHA-256 of
the raw `fixture.json` bytes, then regenerate the release draft. Add configuration:

```json
"scoped": {"before": "./old-scoped-fixture", "after": "./new-scoped-fixture"}
```

Set `"scoped": true` on the matching scenario. The packager checks each fixture's
identity, complete asset inventory and declared scenario IDs. **Load scoped
components** constructs two native registries and loads each version's exact
bundle in the same document. It verifies shadow-root registry ownership. A missing
native capability reports **not run**, with no global fallback or replacement
claim. Scenario changes clean up mounted fixtures; asynchronous stale mounts cannot
replace a newer selection. Authored fixture code remains trusted application code,
not a sandbox for third-party scripts.
