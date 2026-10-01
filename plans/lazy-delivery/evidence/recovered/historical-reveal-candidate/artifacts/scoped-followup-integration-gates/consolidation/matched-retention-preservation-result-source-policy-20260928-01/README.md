# Retention preservation result

Preserves 151 original files (998200924 bytes).
The original campaign exit is 1; preservation
success is a separate result. The matched candidate is not qualified for promotion.

`run/retention.tar.gz` contains every new raw member and replay metadata; its existing
producer read back all 150 members. `run/completeness.json` maps
every original file to its unchanged hash and member. Staging copies are omitted
from this delivery because these exact bytes are in the verified archive; the
original staging directory remains untouched in the run cache.

Resolve new archive names in completeness relative to `run/`. Resolve its two
`../matched-arm-preservation-result-source-policy-20260928-01/run/...` references
relative to this packet directory. Those existing canonical archive members
provide the two unchanged source deltas (945353958 bytes); they are not rewritten
or duplicated. All referenced archive identities remain explicit in completeness.

`outer/`, `configuration/` and `reviews/` retain supervision, original command,
actual tool completion, configuration, independent review and resource handback.
Historical absolute paths describe the original run. This is portable evidence
reconstruction with relative member links, not a promise that historical commands
can be rerun unchanged in a relocated environment.

No new campaign, timing pooling, retention clearance, actual AT/device review,
remote, publishing or hosted CI is introduced. Retention remains 2 successful,
1 failed and 17 not-run, with six unresolved heap signals and unclassified cause.
