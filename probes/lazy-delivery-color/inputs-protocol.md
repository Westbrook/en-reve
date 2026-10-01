# Frozen color diagnostic input adapter

`prepare-inputs.mjs` derives color diagnostic inputs from a complete, frozen production docs build. It authenticates the source, package, parser, graph and asset identities, attributes the selected route's startup and optional code, and creates a separate output directory for the cold probe. Attribution is a necessary input and byte-eligibility check; it does not establish observed traffic, latency, retention or candidate qualification.

Run the producer through a fresh outer command recorder:

```sh
EN_EXECUTION_OUTPUT=/absolute/fresh-color-inputs \
  tooling/test-pipeline/with-toolchain.sh python3 -B tooling/test-pipeline/record.py \
  --out /absolute/fresh-color-inputs-command -- \
  tooling/test-pipeline/with-toolchain.sh node probes/lazy-delivery-color/prepare-inputs.mjs \
  --prepared=/absolute/complete-packed-docs \
  --out=/absolute/fresh-color-inputs
```

The command-receipt directory and producer-output directory must be distinct and initially absent. The recorder creates its directory before starting the producer, preserving stdout/stderr, exit status, command and source identity even when validation fails before the producer creates its output directory. Preserve that failed receipt and all available inputs or partial outputs; use new directories for any subsequent attempt. A missing `producer.json` is incomplete attribution, never a passed gate.

The complete packed docs build must use the existing `probes/lazy-delivery-families/prepare-performance.mjs` schema. The output directory must not exist and must be disjoint from the prepared tree and both sealed source snapshots. Run from the validation checkout, serially in the validation owner's allocated preparation slot, with the existing outer command recorder/identity convention. The producer hash-verifies and imports the existing machine/execution lease helpers from the immutable candidate seal; heavy inventory/parser/output work is inside both leases. Inherited leases use those helpers' normal owner verification. The command recorder alone does not acquire a lease. Only normal checkout lease files and the fresh output are writable; this script starts no server or browser and performs no writes within a prepared build or sealed source.

Outputs:

- `reference/site`, `candidate/site`: links to the original, verified regular-file site trees. The cold probe reads through each link; its own output-only HTTP/2 server wrapper remains unchanged.
- `reference/receipt.json`, `candidate/receipt.json`: exact unchanged input receipt bytes.
- `reference/assets.json`, `candidate/assets.json`: JSON serialization of each unchanged receipt's complete `assets` array; includes original per-file raw size, gzip-6 size and SHA-256 fields. It does not invent a different inventory or compression policy.
- `optional-assets.json`: sorted unique candidate site-relative emitted JavaScript paths. Empty is a valid attribution result; the cold probe cannot consume it and must be skipped.
- `producer.json`: schema below, complete even when the necessary static byte gate fails or the cold mechanism is inapplicable.
- `producer.sha256.json`: SHA-256 of the entire final producer file, avoiding a self-referential file hash.

## `producer.json` schema v1

`kind` is `en-reve-color-cold-assets`; `status: "complete"` means input attribution succeeded, not candidate qualification. `producerSha256` hashes `JSON.stringify(payload)` after omitting that one self-seal field. The separate sidecar hashes the full file bytes.

- `prepared`, `route`: canonical input root and `/api-examples/composable-chat.html`.
- `runtime`: exact executing Node identity (also present in `inputs`) and each arm's retained prepared runtime receipt/tree hash, parse5 path/version, TypeScript wrapper path/declared version, actual `ts.version` and backing `@typescript/old` version.
- `inputs`: absolute path, exact byte count and SHA-256 for every read file, including executed producer source, lease helpers, Node executable, complete build/arm/source/package/runtime receipts, archives, inventoried regular files, emitted modules/assets, HTML, and frozen gate plan. Every required frozen fingerprint must be present and well formed; discovery reads cannot replace missing parent-to-child identity bindings. Regular inputs are rehashed before and after wrapper creation. Source, asset, package and runtime inventories require exact file sets; runtime uses only the preparation's five declared exclusions, preventing unrecorded nested parser dependency shadowing. `inputLinks` records declared links and real targets, rechecked after extraction. `inputsUnchanged` and `outputsReadbackVerified` are true only after those checks.
- `arms.reference`, `arms.candidate`: frozen commit/tree/source/seal identity; receipt, graph and HTML hashes; parsed HTML roots; selected registry import bindings; source-display and review-control bindings; shared eager color utility source/chunk bindings; complete sorted startup closure; candidate optional definition roots, full static optional closure, shared intersection and unique difference. Each binding includes importer, literal specifier, actual source module ID/path/hash and emitted chunk filename. `startupAssets` and `optionalAssets` preserve corresponding exact receipt asset records.
- `eligibility`: exact frozen plan path/hash and unchanged **4,096 gzip bytes AND 10% of reference entire selected-route startup JS gzip** limits; independent reference/candidate startup totals; candidate unique optional totals; matched saving/fraction; static gate boolean; optional definition roots already present at startup; separate cold applicability and next-step disposition. Startup saving is reference minus candidate, including new helper/profile/status/retry overhead. Unique optional size alone never decides the benefit gate.
- `outputs`: path, byte count/SHA-256 for receipts, asset sidecars and optional list; link targets and target-string hashes for the site wrappers. The producer and its checksum sidecar are deliberately sealed separately.

## Attribution contract and qualification limits

The producer parses final HTML with the exact retained parse5 installation. It includes executable script entries and script modulepreload/preload links, following emitted `chunk.imports`. Using the exact retained TypeScript parser, it selects only `exampleDefinitions['composable-chat']` and its literal dynamic imports. It includes the real generated composable-chat source-display module and standalone review button/select registrations. The displayed source text is inert payload: its embedded import strings create no graph edges. Other generated examples, theme editing, and source-highlighting on a closed disclosure are not selected startup branches.

The startup policy follows `main.ts`, `app.ts`, generated definitions, and the composable-chat wrapper for this consumer. It does not evaluate arbitrary JavaScript. Missing/ambiguous source-to-chunk mappings, changed import forms, absent standalone controls, missing graph edges, or changed utility placement reject attribution. Changes to those sources require qualification of the branch semantics before acquisition.

Candidate optional roots are the five literal pure public definition imports for color-picker, swatch, tab, tab-panel and tabs, validated against the authored optional-tag descriptor. Package export mapping is checked against the retained package manifest, then the bundler's exact source IDs map to emitted chunks. Optional paths are **candidate optional static closure minus complete candidate startup closure**. Reference startup is independently derived; cross-arm hashed filenames are never subtracted. `color-picker/color.js` and `color-picker/color-value.js` must remain startup, retaining normalization, parsing, serialization and paint utilities. The complete color-picker barrel is never declared optional.

Correctly derived zero/small optional payload is preserved, not treated as malformed input. A failed matched static byte gate stops the candidate before cold timing. A passing static gate does not prove wire savings or cold state. The unchanged candidate probe must additionally show every listed optional asset absent from pre-action navigation/CDP requests and transferred uncached via HTTP/2+gzip after the trusted click by full readiness. Registry absence alone never proves code cold. All existing timing, uncertainty, functional fail-stop, retention and manual gates remain unchanged.

## Operator gate before cold acquisition

Inspect the retained recorder receipt and producer outputs before invoking `candidate.mjs`. Do not infer eligibility from `status: "complete"` alone. All of the following are required:

1. The recorded producer command exited successfully, the executed source hash matches the frozen producer version, and both arm/source identities match the intended complete preparation.
2. `producer.json` has `schemaVersion: 1`, `kind: "en-reve-color-cold-assets"`, and `status: "complete"`. Verify its whole-file SHA-256 against `producer.sha256.json`. Independently verify `producerSha256` by removing that one field and hashing the UTF-8 bytes of `JSON.stringify(payload)`, preserving parsed property order. Do not reformat or sort properties for the self-seal calculation.
3. `inputsUnchanged === true` and `outputsReadbackVerified === true`. Recheck every recorded input file's byte length and SHA-256 and every recorded input link target/canonical target before acquisition; verify the prepared manifest, source seals and exact inventory membership with their recorded exclusions, not only files that happen to remain present. Verify output receipt/asset/list file hashes and site-link targets against `outputs`. The cold probe also rechecks the frozen site inventories and identities before and after its batch.
4. Both `eligibility.staticByteGatePass === true` **and** `eligibility.coldProbeApplicable === true`. Check the recorded thresholds against the frozen plan: matched startup saving at least **4,096 gzip bytes AND 10%** of the complete reference startup denominator. The candidate optional path list must be nonempty, canonical, sorted and unique, equal to the recorded `arms.candidate.optionalUnique`, and every path must belong to the authenticated candidate asset inventory.

If any verification fails, do not run the cold probe. If valid attribution fails the static byte gate or has no applicable cold payload, retain the complete producer receipt and its disposition; do not guess a path, alter a gate or overwrite the evidence. If all prerequisites pass, use the existing candidate probe command and unchanged frozen cold/remaining-matrix rules in `plans/lazy-delivery/color-popup.md`. A successful producer run or static gate cannot substitute for that browser qualification.
