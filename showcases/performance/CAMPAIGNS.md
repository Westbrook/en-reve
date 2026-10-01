# Reusable performance campaigns

Start here in a new task. The protocol is in [the performance plan](../../plans/native-showcase-performance-plan.md), metric definitions and limitations in [README](README.md), and current-source registry/SSR workflows in [REGISTRY](REGISTRY.md). Everything below is repository-local; no personal skill, previous chat, absolute checkout path, globally installed npm package, or running report server is required.

## Entry point

From the repository root, use the pinned runtime:

```sh
tooling/test-pipeline/with-toolchain.sh node showcases/performance/campaign.mjs doctor
# Read-only: inspect the exact configuration, output IDs and ordered stages.
tooling/test-pipeline/with-toolchain.sh node showcases/performance/campaign.mjs plan \
  --config showcases/performance/campaigns/native.json --id native-YYYYMMDD-01
# Acquisition: the same command with run instead of plan.
tooling/test-pipeline/with-toolchain.sh node showcases/performance/campaign.mjs run \
  --config showcases/performance/campaigns/native.json --id native-YYYYMMDD-01
```

`npm --prefix showcases/performance run campaign -- <command> ...` is an equivalent entry point when the pinned runtime is already active. Paths supplied as command arguments are relative to the current directory; internal paths resolve from the script, not the shell's working directory. Unknown options and configuration fields fail rather than silently falling back.

Copy and edit a recipe before changing its matrix; do not change a retained campaign's saved configuration. `native.json` covers every currently registered implementation, desktop/mobile, cold/warm loading, startup input, settled interactions, diagnostic traces and coverage, memory, Lighthouse, BFCache and observer overhead. Add new implementations through [ADDING_SYSTEMS](ADDING_SYSTEMS.md), then include their registered IDs in the recipe. Profiles are defined in [profiles.json](profiles/profiles.json); requested mobile settings are CPU 4×, 100 ms latency, 8 Mbps down / 2 Mbps up. Desktop is unthrottled.

`current.json` builds and packs current root En Reve packages into an isolated consumer, seals a unique candidate variant, and compares it with the frozen En Reve control. It runs the same full suite matrix, including Lighthouse, with exact-fingerprint qualification receipts. Add registered peer IDs to its `systems` list for wider comparisons. Candidate and native suites are sequential cohorts, not randomized matched blocks; the report labels that distinction. Use a clean reference checkout because ordinary package builds regenerate their normal outputs.

`calendar.json` preserves the three-policy comparison: eager control, deferred construction, and split optional calendar code. It qualifies all three in Chromium, Firefox and WebKit, interleaves policies within seeded blocks, measures first/repeated activation and preparation separately, counts connected DOM with/without date content, samples memory, runs separate Lighthouse audits, and checks import failure/cancellation/retry/reload/touch behavior. Its fixed matrix retains desktop/mobile and cold/warm coverage. Change sample counts to create a short pilot; the full preset retains 383 primary observations and 15 Lighthouse audits. Smaller pilots establish harness operation, not statistical confidence. Calendar timing remains Chromium-only.

Every campaign needs a **new ID**. Builds, qualification receipts, raw acquisitions and logs are namespaced. Existing outputs cause failure before any campaign work. A stage failure retains evidence, stops the campaign, and does not retry or replace a sample. Investigate and use a new ID. `state.json` records completed stages and failure information. A failed/incomplete campaign can still be reported; never present it as a completed baseline.

## Fresh checkout or machine

1. Use the repository's supported runtime setup in [test-pipeline](../../tooling/test-pipeline/README.md). Install the pinned Node/npm runtime and OpenSSL. On Linux, install the OS libraries needed by the pinned Playwright engines (`playwright install --with-deps` on an appropriately provisioned runner); the setup command does not elevate privileges or change OS trust.
2. Run `tooling/test-pipeline/with-toolchain.sh node showcases/performance/campaign.mjs setup --id setup-YYYYMMDD-01` in a checkout without a prepared inventory.
3. Run `doctor`, inspect a campaign with `plan`, then acquire it with `run`.

Setup installs each project's own lockfile with `npm ci`, installs all three pinned Playwright engines, builds the isolated fixture applications, records new source/build hashes, creates a local TLS certificate, and functionally qualifies the new snapshots. It does not install comparison dependencies into the root workspace. It refuses an existing inventory and never promotes or overwrites a reference. New-machine builds are new candidates; they are not assumed byte-identical to a historical acquisition. Failed setup evidence remains under `reports/setup/<id>`. Local TLS certificates expire after 30 days: renew only that operational credential with `node showcases/performance/campaign.mjs certificate`, under the pinned runtime. This leaves snapshots, results and OS trust unchanged.

The native/calendar recipes measure the isolated En Reve vendor snapshot. Use `current.json` to measure changed **current library source** without replacing that snapshot. The lower-level current-source consumer instructions in [README](README.md#experiments-and-current-library-regression) and registry workflow in [REGISTRY](REGISTRY.md) remain available. Replacing frozen vendor tarballs, changing the application fixture, or promoting a regression anchor is a separate explicit operation. The calendar build verifies that its source matches the prepared reference and fails if the expected date import/template contract changes; update and requalify the experiment rather than measuring a silently ineffective transform.

## Results and HTML

Each campaign writes `showcases/performance/reports/campaigns/<id>/` with configuration, profile/lock/registry copies, inventory, logs, stage outcomes, `results.md`, and `tables.json`. Raw acquisitions remain in `showcases/performance/runs/<run-id>/`. Successful samples and unavailable metric counts are separate. Tables contain measurement Date (UTC), Run ID, grouped metric columns, and explicit missing/failed counts. Calendar report interpretation derives from the acquired data, not fixed numerical claims from an old report.

Regenerate a report without opening a browser:

```sh
tooling/test-pipeline/with-toolchain.sh node showcases/performance/campaign.mjs report --id native-YYYYMMDD-01
# Use the existing En Reve reader, including sortable columns and sticky Implementation.
PERF_REPORT_SOURCE=showcases/performance/reports/campaigns/native-YYYYMMDD-01/results.md \
  tooling/test-pipeline/with-toolchain.sh npm --prefix showcases/performance-results run build
# Serve that completed build; do not use dev, which renders the default historical report.
tooling/test-pipeline/with-toolchain.sh npm --prefix showcases/performance-results run preview
```

The default reader build still renders the historical comparison document. A campaign build is an explicit alternate input and does not append observations to historical tables or overwrite their Markdown. Do not rebuild the reader during timed acquisition. If its normal port 4188 is occupied, choose another preview port rather than stopping an unrelated server. Date columns come from raw sample timestamps; missing measurements stay last when sorting.

Lighthouse TBT, primary long-task blocking excess, legacy first-input delay, scripted INP, connected DOM, CDP retained nodes, API memory and compiled/uncompressed JS are distinct measures. No fresh field INP, physical-device performance, source-map attribution for calendar transforms, manual accessibility acceptance, or memory-leak conclusion is implied. Read diagnostic trace/coverage outputs and retained raw evidence for deeper attribution. New algorithms/harness/browser versions require an overlap study; historical machine comparisons are descriptive unless the regression protocol's compatibility checks pass.

## Transfer source and evidence without relying on Git state

Checkouts containing this campaign entry point can use the commands above directly. The transfer command additionally captures selected **working files**, including uncommitted experiments, isolated lockfiles, vendor archives and explicitly selected acquisitions. This is useful when moving evidence or work that is not yet committed:

```sh
node showcases/performance/campaign.mjs export --output /tmp/en-reve-performance-source
# Include one campaign's raw observations and exact measured build bytes as well:
node showcases/performance/campaign.mjs export --output /tmp/en-reve-performance-evidence \
  --campaign native-YYYYMMDD-01
node showcases/performance/campaign.mjs verify --bundle /tmp/en-reve-performance-evidence
node showcases/performance/campaign.mjs restore --bundle /tmp/en-reve-performance-evidence \
  --output /tmp/en-reve-restored
```

Keep the generated bundle in durable project storage or a CI artifact. The bundle includes a manifest of relative paths, SHA-256 hashes, modes and a manifest checksum. Export verifies it; restore verifies all objects before writing to a **new** directory and refuses overwrites, traversal, duplicate paths and symlinks. Checksums detect corruption, not authenticity; transfer only trusted project bundles. Dependencies, runtimes, private TLS keys, environment files, generic build outputs and unrelated artifacts are excluded. Timing baselines are excluded unless selected with `export --baseline <baseline-id>`; carry the exact reviewed anchor when transferring a regression workflow. Install dependencies using lockfiles at the destination. For evidence-only report replay, install `showcases/performance` and `showcases/performance-results`; no browser or timing rerun is needed. Preserved absolute strings inside old evidence remain historical provenance, never executable input.

A restored directory has no Git history. To resume normal Git development, use a branch/checkout that includes the required source changes, or review the transfer as a working-source snapshot before committing. No automatic commit, push, baseline promotion, publication or CI scheduling occurs. Ordinary checkouts use the committed entry points without a source transfer bundle. Evidence-only replay can require restoring an acquisition bundle; the 2026-10-01 archive is documented in [the publication record](../../../plans/performance-publication-2026-10-01.md).

## Recurring use and CI

The existing [CI lane driver](ci/run-lane.mjs) and [workflow template](ci/performance.yml) remain available for qualification, sentinels and full regression checks. Baseline promotion requires a separately reviewed immutable anchor; supply both load and interaction anchors. This work does not activate schedules or claim a dedicated runner exists. For reproducible CI campaigns, invoke `plan` and `run` with the checked-in recipe and a unique job ID; always retain the campaign directory, its run directories and an evidence export, including when a stage fails.

Machine and checkout leases cover the entire campaign, including builds and analysis. Child correctness/timing lanes remain serial. Never bypass a lease or remove a live owner's file. Hardware, power/thermal state and background activity still matter; a workstation result is exploratory. Automation improves repeatability, not the comparability of different machines.

The original `experiments/*` historical recipes and compressed receipts remain for reproduction. Use this campaign entry point for new acquisitions rather than editing old campaign IDs. The more specialized connected-DOM ownership and registry/SSR investigations retain their own documented runners; links above identify their scope and required qualification.

The `main-refresh.json` current-source recipe matches the earlier refresh: load/startup/interaction n=10 across desktop/mobile, Lighthouse n=5 mobile, memory n=1 desktop at 0/10/50 journeys, and diagnostic/bfcache/overhead desktop. Optional `suiteOptions` pins profiles, samples and memory checkpoints per suite; omitted settings retain recipe defaults. It includes frozen En Reve, Fluent WC and Web Awesome controls and a freshly packed current candidate.

For a calendar refresh of a newly measured build, use `main-calendar-refresh.json` and set `referenceCampaign` to the completed current-source campaign ID. The builder verifies its archived consumer inputs, lockfile and package bytes, installs a separate consumer, copies the exact eager artifact, and builds deferred/split policies from those same packages. It does not silently repack the frozen reference. Run the current-source campaign first, then the calendar campaign with a fresh ID.
