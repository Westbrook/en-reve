# Reproducing test-pipeline validation

Run `python3 tooling/test-pipeline/setup-runtimes.py` to install official, checksum-verified Node 26.10.0 Current, Node 24.21.0 LTS and npm 12.1.0 beneath `.toolchains`. It never installs into Codex or system runtime directories. `tooling/test-pipeline/with-toolchain.sh` puts the private Current runtime first in PATH. A version manager using `.nvmrc`/`.node-version` is equivalent. Use `EN_TEST_NODE_LINE=lts tooling/test-pipeline/with-toolchain.sh <command>` for the additional LTS matrix; npm 12 supports both lines. Node API types follow the supported Node 24 minimum.

Python checks require 3.14.7. When available, use `UV_PYTHON_INSTALL_DIR="$PWD/.toolchains/python" uv python install 3.14.7 --no-bin` and select that interpreter explicitly. If uv lacks that release, build the official `https://www.python.org/ftp/python/3.14.7/Python-3.14.7.tar.xz` into `.toolchains/cpython-3.14.7` with `./configure --prefix="$PWD/../cpython-3.14.7"`, `make`, and `make install`. The macOS validation build used `--with-openssl=/opt/homebrew/opt/openssl@3`. Optional GUI/database/compression extension availability is recorded separately from repository Python-suite results; system Python is unchanged.

From the root:

```sh
tooling/test-pipeline/with-toolchain.sh npm ci
tooling/test-pipeline/with-toolchain.sh npm run build
tooling/test-pipeline/with-toolchain.sh node node_modules/@playwright/test/cli.js install chromium firefox webkit
```

On initial setup or when its lockfile/runtime changes, each isolated owning installation must also run `npm ci`: `probes/framework-consumption` (the builder), `showcases/performance`, `showcases/tools`, `showcases/performance-results`, and each active showcase. Framework cohorts in `probes/framework-consumption/cohorts.mjs` remain independent subjects: current/preceding minor lines plus retained React18, Vue2 and Svelte4 compatibility. Their `environments/*` manifests/locks seed fresh tarball installations owned by the framework preparation stage; do not install redundant source-tree cohort copies. Do not regenerate historical baseline/vendor installations. The external authoring pilot is historical and needs its exact external engine; its production-authoring mode uses the root runtime.

The performance fixtures generate local TLS certificates with an OpenSSL CLI.
Provision the private OpenSSL 4.0.2 CLI with
`tooling/test-pipeline/with-toolchain.sh python3 tooling/test-pipeline/setup-openssl.py`.
This verifies the official source checksum, builds a static binary using the host
compiler/Perl/make, and installs its configuration beneath `.toolchains`.
Both Node lines select that CLI through the existing wrapper. It does not replace
the host OpenSSL installation or relink Python. Identity receipts separately record
the certificate CLI, Node's bundled runtime libraries and Python's linked OpenSSL;
they must not be reported as one shared OpenSSL version.

`record.py --out <new-directory> -- <command> <args…>` records the exact command, selected executable, recorder interpreter, timestamps, monotonic command wall time, exit code and log. It refuses to reuse a command directory. Select the private runtime for both recorder and child command:

```sh
tooling/test-pipeline/with-toolchain.sh python3 tooling/test-pipeline/record.py \
  --out artifacts/my-new-command -- tooling/test-pipeline/with-toolchain.sh npm run test:extended:node
```

Keep timed capture isolated and serial, and use a unique run ID. Correctness uses the shared dependency scheduler and a global budget of three; do not start independent outer gates against the same lease. No result from a previous toolchain is a new baseline.

For nested API/release gates set `EN_TEST_PIPELINE_OUTPUT=<fresh-directory>` to route every Playwright configuration to a distinct hashed subdirectory. Configurations retain their usual paths when unset. For a theme gate, use `EN_THEME_TEST_OUTPUT_DIR=<fresh-directory>` and leave `EN_TEST_PIPELINE_OUTPUT` unset because the theme orchestrator consumes its named stage receipts. Discovery must always pass `--list --reporter=list`; otherwise even a listing can overwrite execution receipts.

Additional standalone selections (already included where applicable in `test:union`; do not repeat them after an applicable passing union):

```sh
npm run test:extended:node
npm run test:extended:types
npm run test:types -w @en-reve/primitives
npm run test:extended:button
EVIDENCE_DIR=/absolute/new-directory npm run test:extended:portability
node --test tooling/test-pipeline/*.test.mjs
```

`test:extended:node` includes all elements Node tests, docs API tests and the token-document test. It requires freshly built packages. The size SSR test intentionally imports the same built module consumers use; CEM extraction continues to parse source. `test:extended:types` checks every maintained top-level probe consumer fixture plus CSS authoring. The button/content config selects all previously omitted browser cases in all three engines. Token portability is a real Node/browser matrix, not a pure unit test.

For SSR use `EN_SSR_TEST_PORT=4292` with `packages/ssr/playwright.config.ts` to validate a nondefault origin. Theme asset verification requires fresh prepared candidates bound to `dist/review-build.json`; `--ids id1,id2` selects an explicit subset while still verifying the complete prepared catalogue's integrity. The expected cases are exactly the selected candidates × light/dark; missing, duplicated, empty and failed selections cannot pass.

The upgrade report in `plans/test-pipeline-upgrade-2026-09-25.md` records current evidence and upstream constraints. A passing subset is not a full release pass. Physical devices, screen readers, saved-profile autofill and actual IME remain manual acceptance. Full historical multi-hour performance campaigns are a separate tier, with fresh IDs and toolchain baselines required for new acquisitions.

Historical September 25 qualification (preserved evidence): exact-parent npm
overrides advanced qualified transitive tools: CEM analyzer
0.11.0 uses comment-parser1.4.9; Lit literal plugin0.2.0 and Tailwind Node4.3.3
use magic-string1.4.2; Tailwind uses Lightning CSS1.33.0; Lit SSR4.1.0 uses
parse5 8.0.1 and @parse5/tools0.7.0. Isolated actual-import qualification preserved
complete CEM bytes, all965 examined literal-source code/maps (189 transforms),
and every Tailwind showcase output file;22 minifier and71 SSR Node cases passed.
Fresh clean installs reproduce these versions. Full builds, consumer types and
browser gates remain required after installation. Reassess each override when
its exact parent changes. The older TypeScript AST APIs and the upstream literal
plugin's imported default minifier remain separately documented constraints.

Current isolated compiler migration: WC Toolkit replaces the legacy CEM analyzer;
the literal transform and docs specimen parser share the explicit TypeScript 6
API. Direct `magic-string` 1.4.2 replaces the old Lit plugin, and both older
TypeScript 5 owners are absent from the root installation. The former analyzer
and literal-plugin overrides are removed. Existing Tailwind and Lit SSR
constraints remain owner-specific. See the [literal/Python checkpoint](../../plans/literal-compiler-migration-2026-09-27.md)
for current evidence and limits; the paragraph above describes its original run.

Direct verifiers (`highlighting`, `swatch`, `slider`, `typography`) also honor `EN_TEST_PIPELINE_OUTPUT`, with a unique module directory. The authoring parity fixture supports `EN_AUTHORING_OUTPUT=node_modules/.cache/<new-name>`; keep this relative depth because the generated consumer imports built packages relatively. Packed fixture overrides are listed in the execution ledger. Use `functional --id <fresh-id>` and `calibrate --output <fresh-file>` for performance qualification. These reject existing explicit destinations; acquisition `run --id` remains single-use. Original defaults remain available for existing callers.

Before a validation wave, run `tooling/test-pipeline/with-toolchain.sh python3 tooling/test-pipeline/identity.py <new-identity.json>`, then set `EN_TEST_PIPELINE_IDENTITY` to that path for recorded commands. The identity contains per-file SHA256 source/build bytes and resolved runtime paths/versions. Compare a second snapshot after the wave to disclose concurrent changes. It does not turn preexisting evidence into fresh execution proof.

The verified Python3.14.7 source tarball SHA256 is
`3b48dac8fb59f62eaa67ac83c1eb12bda1b7a08406dd286e252c11a66be27f81`,
from its official release page. Reproduce the private macOS build from the root:

```sh
curl -fL https://www.python.org/ftp/python/3.14.7/Python-3.14.7.tar.xz -o .toolchains/Python-3.14.7.tar.xz
shasum -a 256 .toolchains/Python-3.14.7.tar.xz
# Compare to the official hash above before extracting or compiling.
tar -xJf .toolchains/Python-3.14.7.tar.xz -C .toolchains
cd .toolchains/Python-3.14.7
./configure --prefix="$PWD/../cpython-3.14.7" --with-openssl=/opt/homebrew/opt/openssl@3
make -j6
make install
```

The OpenSSL path is host-specific; use the locally installed development libraries
on other platforms. No `sudo` or system prefix is needed.

npm 12 changes `npm pack --json` from an array into an object keyed by package
name. Active packers use `npm-pack.mjs` to support both shapes while checking the
expected package, integrity and safe archive filename. Historical reproduction
recipes remain frozen with their original provenance.

The active Phase6 reproduction harness copies the current minifier adapter into
both isolated historical comparison arms. Its `toolchain.json` distinguishes
the adapter's historical and executed SHA256 hashes, the candidate subject
overlay, the archived lock and the host toolchain lock. Frozen component sources,
locks and old observations are not rewritten; newly collected samples belong to
a separate current-toolchain campaign.

## Validation cadence and ownership

Use `npm run test:fast` during edits to get package compiler, consumer, test/config/tooling TypeScript and orchestration failures before docs or browser work. Production compiler outputs double as semantic evidence; the union references the identical successful styles emitting compiler instead of repeating no-emit checking. Standalone `styles-check` retains its own check. Elements owns lazy generation before emit; root build uses `metadata:after-build` for the remaining metadata stages. Use `npm run metadata` when independently regenerating all metadata.

`npm run test:types` selects both semantic phases: core test/config/tooling files immediately after package declarations, then docs test/config files after generated docs sources, before docs bundling. `test:fast` selects only the core phase. The docs phase includes the actual built element declarations so custom-element globals do not depend on unrelated test imports. `npm run check:types` continues to check API snapshot freshness. The semantic gate uses pinned TypeScript 7, strict checking, and exact reviewed pre-existing diagnostics in the core/docs files `tooling/testing/semantic-types-*-baseline.json`. New diagnostics fail, duplicate counts cannot hide new failures, and resolved diagnostics require removing obsolete baseline entries. The baseline is technical debt, not a clean-types claim. It does not blanket-ignore an erroneous file. Intentional fixture programs and independent showcase installations have separate owners; JavaScript without declared types is still runtime checked. Do not refresh the baseline to make a new regression pass.

```sh
EN_EXECUTION_OUTPUT=/absolute/new-fast-run npm run test:fast
npm run test:plan -- --pathways=registry,hydration
EN_EXECUTION_OUTPUT=/absolute/new-final-run npm run test:union -- --pathways=registry,hydration
npm run test:cost -- /absolute/new-final-run/execution.json
```

The final command selects only those pathways; it is subset evidence. A sweeping cross-package change still needs the full `test:union` or its required exact-candidate integration acceptance selection. Public standalone gates preserve their existing caller prerequisites and forwarding behavior. Do not compose release/theme/API calls as independent runs when a union selects their obligations once.

The shared scheduler admits ready types and pure checks before unrelated producers, groups Node sources by prerequisite boundary, and caps total work at three slots. No-emit consumer checks can share slots; unresolved resource contracts remain exclusive. Browser configurations retain their lower limits and full facets. A final integration selection expands the same canonical package/metadata/docs producers, maps assertion owners, and references identical passing Node sources within that invocation. Exact commit, source stability, child receipts, and explicit skips remain acceptance requirements. There is no cross-run completed-result cache or changed-only acceptance.

Services start at the first consumer and close after the last selected work. Docs consumers share the runner-owned ephemeral origin; pages/contexts remain isolated. An arbitrary already-running server is not an acceptable substitute. Keep valid installations during edit loops; retain actual clean-install/tarball acceptance when installation, packaging or the runtime is the change. Do not introduce setup caches whose verification costs more than rebuilding.

The outer public/union runner waits up to 60 seconds for a live machine owner, recording queue time. `EN_TEST_MACHINE_WAIT_MS=0` requests immediate contention failure. A dead, mismatched or unreadable owner still requires explicit recovery; waiting never steals it. Cancellation and terminal receipts retain owner cleanup. Integration also retains its canonical browser lease.

For changes to delivery analyzers or report provenance, `test:union -- --pathways=analysis-controls` runs the seven reviewed synthetic Python suites without package builds, browsers, timing samples or retention acquisition. These controls are also included in broad correctness. `test:inventory` records separately invoked delivery studies with their exact protocols and required inputs; retired preparation remains historical and unknown entry points remain unresolved.

## Prospective campaign admission

`npm run test:campaign-plan -- policy.json` validates and expands a prospective fixed-budget design. It requires a decision, functional qualification reference, source binding, comparison family, precision, analyzer, cold-session policy, explicit cells and maximum job count. Every cell lists arms/configurations/modes, timing samples, retention runs and cycles. Counts must fit the declared maximum. The output is a plan, never acquisition permission. Bind its policy digest and passing source-matched functional evidence to the future campaign receipt. Existing historical campaign definitions, sample counts and archives are unchanged; adaptive stopping requires a separately reviewed analyzer, not another round until a comparison passes.

Inventory includes npm pre/post lifecycles, canonical obligations, root rules, workflow presence and configured hooks. Extracted recipes are never executed. Cost reports separate queue, identity, command and owned-service timing and retain unmeasured phases explicitly. Command sums are not elapsed savings; child maximum RSS is not aggregate peak memory. A before/after claim requires equivalent source, coverage, environment and alternating cold/warm observations.

Default broad Node cohorts stop on a native failing event and retain the interrupted coverage as incomplete; `--continue-independent` keeps diagnostic collection enabled. Timing-sensitive CSS watcher regression runs in an exclusive cohort at its existing deadline.

Default union and integration CLI browser runs use native Playwright `--max-failures=1`, including the union discovery policy. Expected negative cases do not consume the failure budget; an unexpected case stops admission within that configuration, and partial coverage remains failed. Union `--continue-independent` preserves the owning configuration policy for deliberate full diagnostics. Standalone public gates retain their original policy. First-failure timing records native Node detection when monitored, and command completion otherwise; browser command timing is not a per-assertion notification timestamp.

Scoped-registry browser runs selected through the broad or integration runner reserve a dynamic loopback port. Discovery and execution retain the same endpoint; the reservation closes immediately before the strict-port server starts. Explicit `EN_SCOPE_PORT` overrides remain authoritative and occupied ports fail without adopting or stopping another owner. Standalone fixture defaults remain unchanged.

### Installed browser product runs

The framework pathway accepts an opt-in `EN_BROWSER_PRODUCTS` manifest; see the
[fixture contract](../../probes/framework-consumption/README.md#opt-in-installed-chromeedge-qualification).
Explicit Chromium-product projects retain the default pinned-engine matrix and
use isolated temporary profiles. Their resolved project metadata declares the
entire application distribution; runtime identity hashes that directory, including
supporting libraries, before and after execution. Metadata must match the actual
executable and headless launch options. Arbitrary channels/remote connections still
require separate identity handling and cannot masquerade as a pinned engine.
Record the platform app version, protocol version and reduced UA separately.
These are actual headless product results, not manual or physical-device acceptance.
