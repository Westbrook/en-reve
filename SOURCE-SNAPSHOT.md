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
