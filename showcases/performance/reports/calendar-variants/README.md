# Calendar delivery variants

The original En Reve default remains the eager reference. This is an application policy comparison of the same frozen `6d09b31c` packages and all sixteen cards, not a library implementation change or a peer-library rerun.

- `calendar-eager`: byte-for-byte copy of the frozen main reference.
- `calendar-deferred`: only the single-date field receives `calendar-loading="deferred"`; code is still eager.
- `calendar-split`: same deferred attribute, shell definition registered into the existing global registry; optional calendar code is dynamically imported. All other imports and controls are unchanged.

Run scripts from the repository root. Variant builds and run IDs refuse existing outputs. Preserve them and choose a new ID for new acquisitions.

1. `node showcases/performance/experiments/build-calendar-variants.mjs`
2. `node showcases/performance/experiments/qualify-calendar-variants.mjs`
3. `node showcases/performance/experiments/run-calendar-variants.mjs calendar-variants-pilot-v1 --pilot`
4. `node showcases/performance/experiments/run-calendar-variants.mjs calendar-variants-v1`
5. `node showcases/performance/experiments/calendar-followup.mjs`
6. `node showcases/performance/experiments/report-calendar-variants.mjs`
7. `node showcases/performance/experiments/date-report-tables.mjs`
8. `npm --prefix showcases/performance-results run build`
9. With the reader on port 4188: `node showcases/performance-results/scripts/verify-calendar-variants.mjs`
10. `node showcases/performance/experiments/archive-calendar-variants.mjs`

The existing browser lock prevents concurrent benchmark/reader browser work. Primary policies are interleaved within matched blocks; new browser processes isolate HTTP cache state. Warm pages are primed without opening the optional calendar. OS/server caches remain shared. Test dates are the recorded UTC sample timestamps, not report modification times.

The primary calendar metric begins at trusted keyboard Enter and ends when the selected day is observed focused in an open native dialog. A later rAF is a frame opportunity, not proof of actual paint. The automation's focus setup and prior native edit are excluded from that duration. Preparation lead and preparation-to-focus are separately reported. The full response total counts speculative bytes.

DOM counts include connected nodes and open shadow roots; the date subtree includes its input, trigger, dialog and calendar. With/without totals are from the same document state. Native browser-picker internals are inaccessible and excluded. CDP DOM counters also include retained/detached objects and are not interchangeable with connected counts.

Recovery qualification intercepts the optional chunk to test a pending-open cancellation and a failed import, then explicit retry and reload recovery. This is correctness evidence, separate from timing. Failed module imports can remain cached; a successful retry is not assumed.

Exploratory workstation results. Mobile CPU4x, 100ms requested latency, 8Mbps download, 2Mbps upload; desktop unthrottled. Calendar mobile n30, desktop n10, prepared n10. Other primary cells n10; Lighthouse n5/policy, one memory session/policy. No physical-device, field INP, manual AT, or leak conclusion. The narrow build transform does not produce corrected source maps for the two transformed fixture files; this campaign does not use those maps for CPU-source attribution. Library and application runtime files are not changed.

Qualification correction: the first recovery run asserted the failed-import message while the loading message was still present. The check now awaits the explicit error wording. `recovery-early-assertion-failure.log` retains that harness failure; `recovery.log` and `recovery-qualification.json` retain the passing rerun. No performance sample or Lighthouse audit was replaced. To rerun just that correctness lane, use `calendar-followup.mjs --recovery-only`.
