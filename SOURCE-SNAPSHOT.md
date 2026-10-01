# Source-only GitHub snapshot

This branch preserves the source tree from `codex/initial-pass-closeout` at `0cb051a81f693201c03fd4a9ac7b7dbdea69398b`.
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
