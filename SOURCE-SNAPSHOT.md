# Source-only GitHub snapshot

This branch preserves the source tree from `main` at `6d792eba74135f12a1e6f026ffbd1357e3391819`.
It starts a new GitHub history as requested; the original local repository and
its complete history remain unchanged.

Large historical evidence is retained locally. Execution artifacts, performance
baselines, installed dependencies, and test output directories are omitted here.
The exact omitted paths and original Git object IDs are listed in
[the export manifest](.source-export/manifest.json). Source, documentation, tests,
package locks, metadata and required checked-in vendor packages are retained.

`main` represents accepted local main. Task and archive branches preserve work
in progress or historical source; their presence does not establish qualification.
Evidence-dependent historical replay requires restoring the retained evidence.

## Performance publication — 2026-10-01

The current source now includes local main `d314733215b89149d538bce3a3f8728c2dcc0822`. This update
is a normal descendant of the previous GitHub main commit. The original
large history and regression baselines remain local. Compact comparison evidence
and the checksum-verified 2026-10-01 acquisition archive are included deliberately.
See [the publication record](plans/performance-publication-2026-10-01.md) for
qualification limits and replay instructions, and [the source mapping](.source-export/updates/performance-20261001.json) for exact changed blobs.

## Validation efficiency publication — 2026-10-01

Current source maps to local main `0bc14ea0f82c379c5d8ab3d5bdcd2df399255d32`. The user approved stopping remaining confirmation and merging. LTS controls passed; the broad Current run was intentionally stopped before completion. No complete correctness pass is claimed. See `.source-export/updates/validation-efficiency-20261001.json`.

## Tooltip context checkpoint

Local main `b5bb6064c2b4c26a7c62c71796a575c23abb664a` includes the component-qualified tooltip context implementation and generated metadata. Demo review controls and source sample remain pending; see `plans/tooltip-context.md`. This is a source checkpoint, not a completed publication.

## Tooltip context checkpoint

Local main `a277af17a110df00d582d8162d89bb28d8b7cd30` includes the component-qualified tooltip context implementation and generated metadata. Demo review controls, reset and maintained source sample pass all 12 focused browser checks; see `plans/tooltip-context.md`. Publication identity is tracked in the independent Progress Report.

## Reference Target investigation

Local main `8e7fdacfefe6ce58a9d17d23adea4d3925f9ea8c` retains the pinned-source comparison and explicit adoption gaps in `probes/reference-target/README.md`. Production field semantics remain unchanged.

## Component-owned FACE label investigation

Local main `49e71cfcab7bd1cc4a3f9ecc6c3e70fb79fb0c09` retains the component-owned FACE bridge, SSR proof and explicit adoption gaps in `probes/reference-target/README.md`. Production field semantics remain unchanged.

## Production external field labels and Reference Target SSR

Local main `138829bc35cc4c361637cf47b0cb07d4d58bab19` integrates external labels for the nine common fields, shared subscriptions and per-renderer SSR serialization. Qualification and remaining relationship/device/AT limits are retained in `probes/reference-target/README.md`.

## External checkbox, radio and switch labels

Local main `c98507742d685c186dffd271f1bf054cfe900067` extends the shared external-label bridge to native checkbox, radio and switch activation, preserving cancelable transactions and grouped-radio ownership. Qualification and remaining relationship/device/AT limits are retained in `probes/reference-target/README.md`.

## Dynamic button descriptions and platform scope reconciliation

Local main `771f0e1f1c6a24e7103f5984c84d847ccb9abe2e` keeps documented native descriptions synchronized with their host-tree targets. Platform plan status now points to delivered scoped and framework evidence, and records the explicitly retired historical CSS pilot rerun. Remaining real AT/device and broader relationship scope stays open.

## Nested and conditional Reference Target comparison

Local main `dcb52a27dd5d0007218a006ad9c7121e7f978222` completes the planned isolated description/error and active-descendant comparison, preserving the native error-routing gap and unsupported fallback relations. Production descriptions and option relationships keep their documented semantic owner. See `probes/reference-target/README.md` for evidence and limits.
