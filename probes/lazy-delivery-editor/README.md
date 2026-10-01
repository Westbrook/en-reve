# Editor delivery qualification probe

`census.mjs` inspects the existing built `/api-examples/rich-text.html` route. It
records whole-document, contextual-toolbar and generated-toolbar connected node
counts before selection, including text/comment nodes and open shadow roots. A
maximal bound computes the result of removing the *entire* contextual host; if
that is below the predeclared 5% route gate, any narrower construction boundary
fails the route gate without a runtime experiment. It is not a measured lazy
implementation or performance gain.

The probe also uses ordinary Playwright pointer hit testing for initially closed
and visible contextual controls, backward/forward selection, persistent controls,
Escape and Link Apply/Cancel ownership. Failure screenshots and action errors are
retained. Phone-width desktop engines do not establish physical touch, keyboard,
IME or screen-reader acceptance. The existing production route controls its
registry; the probe reports that actual mode and does not pretend to test arbitrary
scoped fixtures.

First freeze a production docs build and its source identity with the validation
owner. Run only in the allocated build/browser window, using the pinned runtime
and installed matching Playwright engines:

```sh
EN_EDITOR_CENSUS_SITE=/absolute/frozen/site \
EN_EDITOR_CENSUS_OUTPUT=/absolute/fresh-output \
tooling/test-pipeline/with-toolchain.sh node probes/lazy-delivery-editor/census.mjs
```

The output directory must not exist, and its parent must exist. The built site
must contain the standard workflow pages as well as the rich-text route. The
probe uses the documented docs static server on an ephemeral loopback port and
`exclusiveBrowserWork`, preserving machine, checkout and browser leases. It fails
rather than bypassing another owner. Normal `EN_EXECUTION_OUTPUT` and identity
recording remain the outer runner's responsibility.

Inspect `census.json`, `started.json` and retained screenshots. Nonzero exit may
be an expected reproduced interaction failure; it remains failed evidence. A
complete census can establish a deterministic negative node gate independently
of pointer qualification. No samples in this probe establish startup latency,
first-use latency, byte savings, or retention. Those use a separate declared
campaign only if the structural and interaction prerequisites pass.

## Matched route timing and separate retention

`timing.mjs`, `analyze.mjs`, and `retention.mjs` are source-only qualification
harnesses until validation runs them. They consume the shared actual-docs freezer's
complete `manifest.json` and three immutable arm directories: `reference`,
`candidate`, and `rollback`. Each arm receipt includes asset hashes, level-6 gzip
sizes and an AST-derived route entry closure. The common helper verifies both
source seals, candidate-bound acquisition and budget files, receipts and emitted
assets before and after execution. The rollback arm renders the candidate source
with eager policy on both server and client.

The production route uses its existing global registry. These scripts do not
invent a scoped URL mode. Native scoped, global fallback and independent SSR
ownership are covered by the separate packed component fixture. The applicability
clarification is recorded in `plans/lazy-delivery/editor-results.md`; the original
numeric protocol in `editor.md` remains unchanged.

After serialized source validation and frozen-build qualification, commands are:

```sh
tooling/test-pipeline/with-toolchain.sh node probes/lazy-delivery-editor/timing.mjs \
  --prepared=/absolute/frozen-actual-docs --out=/absolute/fresh-timing

tooling/test-pipeline/with-toolchain.sh node probes/lazy-delivery-editor/analyze.mjs \
  --input=/absolute/fresh-timing --output=/absolute/fresh-comparison.json

tooling/test-pipeline/with-toolchain.sh node probes/lazy-delivery-editor/retention.mjs \
  --prepared=/absolute/frozen-actual-docs --out=/absolute/fresh-retention
```

Timing uses 100 successful matched blocks per arm in Chromium, Firefox and WebKit
at desktop and phone widths, plus a separate 4× CPU Chromium cell. Every first
selection starts in a fresh browser/context. Explicit native focus starts in a
second fresh browser/context and is requested in the first eligible real editor
state event before deferred controls render. The record also retains the complete
selection-to-focus interval. Repeat selection verifies retained control identity
and a fresh source positioning mutation. Only the actual browser readiness
interval is timed; fixture HTML is warmed before sampling. `--qualification`
(default one sample) is diagnostic and the analyzer refuses to promote it.

The append-only journal preserves start, success, failure and interruption events;
an incomplete run cannot be resumed or pooled into a passing campaign. Analysis
requires the full matrix, all structural gates, and empirical p95 ceilings with
conservative confidence bounds. Absolute p95 acceptance uses a binomial-inverted
one-sided 95% order-statistic bound; at 100 samples that is the 99th sorted
observation. Regression acceptance subtracts the reference p95 lower 97.5% bound
from the candidate p95 upper 97.5% bound, giving at least 95% joint coverage even
for paired observations. The 5,000-draw paired bootstrap remains descriptive.
This statistical correctness repair was chosen before timing, with the numeric
limits and sample plan unchanged; a bound crossing a limit stays unqualified. Entry/settled gzip counts and observed
resource transfer data remain distinct. The unused 500 ms observation precedes
first selection; settled cumulative resources are captured after repeat use.

Retention is a separate five-context, 100-cycle acquisition for each arm and
selected engine/viewport. Real selection, Link-draft editing and Escape preserve
native editor and command identities. Checkpoints at 0/10/50/100 record connected
nodes and, where available, post-GC CDP nodes/listeners/heap. Chromium missing a
required counter is incomplete evidence; Firefox/WebKit unsupported counters
remain explicit. Subset arguments never establish the complete matrix. No timing
or retention result constitutes manual accessibility or physical-device review.


All heavy source, artifact, browser and installed Playwright package verification
runs inside the same exclusive acquisition lease, including failure finalization.
The executing JavaScript driver dependency closure is compared with the builder's
fresh exact-lock SSR runtime inventory and checked again afterward. Each arm is
bound to its declared source, policy, package receipts, archive bytes, source
overlays and emitted graphs; candidate and eager rollback must share identical
production archives and packed module graphs. Source review and earlier pure-test
passes do not replace validation of these repaired sources.
