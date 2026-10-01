# Adding a native comparison system

Keep each library in its own `showcases/<id>` project with an exact lockfile and the dependency-isolation build plugin. Reuse the sixteen-card content contract and native default components. Register the new ID at the end of `registry/systems.json` and the project lists in `showcases/tools`; existing port assignments must remain stable. Record component gaps and any vendor-specific testing adapters rather than silently replacing a native implementation.

Build and qualify only the new showcase. With its preview running, use `node showcases/tools/qualify.mjs --systems <id> --artifacts artifacts/<new-evidence-directory> --receipt verification-<id>.json` from the repository root. This serial driver holds the same browser lock as measurement campaigns while running smoke, secondary, inspection and receipt creation. Wait for an existing campaign to finish; do not delete a live lock. Inspect the generated desktop/mobile screenshots. A filtered receipt must not replace the original full-panel receipt. The lower-level tools also accept `SHOWCASE_FILTER` (exact ID or comma-separated IDs), `SHOWCASE_ARTIFACTS` (absolute directory with trailing slash), and `SHOWCASE_RECEIPT`; use them directly only when browser serialization is already coordinated.

From `showcases/performance`, freeze the addition with:

```sh
node src/prepare.mjs --add --systems <id> --receipt verification-<id>.json --reason 'Add a native comparison system'
node src/cli.mjs functional --systems <id>
node src/cli.mjs functional --systems <id> --engine firefox
node src/cli.mjs functional --systems <id> --engine webkit
```

Additive preparation rejects an existing ID or snapshot, verifies only the new fixture's receipt and preserves every original inventory entry. It marks the added system pending until Chromium functional qualification passes. Browser-specific failures remain in their receipts; do not treat missing/failed measurements as zero. Qualification against a subset never clears another system's pending qualification.

After the new receipt is final, append its path (relative to `showcases/`) to `registry/verification-receipts.json`. Default full-panel preparation and the inactive CI template compose that explicit catalog in memory, reject missing/duplicate project evidence before snapshot writes, and retain each receipt's path/hash in preparation provenance. Keep `verification.json` as the historical eight-system receipt. Selected additive/refresh commands retain their explicit `--receipt`; an alternative full composition can use `--receipts verification.json,verification-<id>.json`. Registering the system also includes it in default full benchmark suites; the fixed sentinel panel and deliberate baseline promotion policy remain separate.

Run the same production measurement lanes with explicit `--systems` and new immutable `--id` values. Include unchanged frozen control systems in the new campaign to expose workstation/session differences. Use the main runner's load, startup, interactions, diagnostic, memory, BFCache and observer-overhead suites, plus the separate Lighthouse suite. Match the reference profiles, cache modes, sample counts and memory checkpoints; keep qualification samples separate from final timing distributions.

Save additional bundle and DOM evidence without replacing historical reports:

```sh
node src/cli.mjs bundles --output reports/<campaign>/bundles.json
node experiments/run-dom-review.mjs <new-dom-run-id> --systems <comma-separated-ids>
node experiments/run-dom-ownership.mjs --systems <comma-separated-ids> --output reports/<campaign>/shadow-ownership.json
```

The DOM run produces three fresh desktop journey sessions and one narrow initial session for each selected system. Supported custom date controls add three independent open/close sessions; a native date input's inaccessible browser picker is not a zero-cost custom calendar. New date implementations need an explicit complete field boundary in both DOM collectors and a reviewed open/close workflow if they use a custom popup.

Archive the final inventory, bundle evidence, reports, qualification receipts and source identities. Label cross-session historical values separately from same-campaign comparisons. Do not rebuild or repin existing controls merely to add a new competitor.

Count only HTTP(S) responses in over-wire totals and completion/cache accounting. Embedded `data:` or local `blob:` responses are not additional network delivery; their bytes may already be carried in a JS/CSS asset. Keep those response counters separately for diagnostics. If a derivation is corrected after acquisition, replay the unchanged raw observations, retain captured versus corrected values and hash the analysis sources; do not rewrite historical raw samples.

The [Web Awesome expansion recipe](README.md#web-awesome-comparison-expansion) is the concrete nine-system example: package 3.13.0, a 306-sample three-system control panel, 30 DOM snapshots and three ownership snapshots. It also documents the pre-memory lock interruption and bounded `web-awesome-memory-v2` resumption. Use new immutable IDs for future campaigns; those completed IDs and the recovery script are evidence of this acquisition, not reusable retry targets.

If qualification reveals a fixture correction before promotion, preserve the failed/superseded receipt and rebuild only that project. `prepare.mjs --refresh --systems <id> --receipt verification-<id>.json --reason 'Describe the correction'` archives its former fingerprint under `.cache/archive`, replaces only the selected entry and requires fresh functional qualification. Use new immutable run IDs for the corrected fixture; never combine its preliminary samples with the promoted campaign.
