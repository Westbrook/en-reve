# Phase 5 server cost attribution

This is a separate investigation of the opt-in request-isolated renderer. The
frozen Phase 5 client campaign and server timings are unchanged. Client performance
remains the primary phase comparison; build-time rendering and ordinary warm
`renderToString()` remain supported deployment choices.

## Results

Thirty successful samples per arm, after five warmup blocks:

| Strategy | Request median | Advance preparation | Creation through result |
| --- | ---: | ---: | ---: |
| Warm `renderToString` | 0.35 ms | Outside timer | Not measured |
| Unchanged isolated API | 128.91 ms | Included in request | Not separately measured |
| Instrumented fresh worker | 129.22 ms | Included in request | 129.22 ms |
| Prewarmed single-use prototype | 8.64 ms | 123.24 ms before request | 132.77 ms |

The instrumented fresh worker measured 12.44 ms reaching the worker entry,
28.84 ms importing/installing the DOM shim, 1.30 ms importing registration helpers,
68.90 ms importing the SSR entry/dependencies, 8.41 ms importing the application,
0.36 ms collecting/registering definitions, and 7.43 ms rendering/buffering HTML.
These are medians of individual stages and do not sum exactly to the median total.
The shim imports the upstream CSS loader hook; we have not separately measured
that hook's contribution. Import order assigns shared/transitive dependencies to
the first importing stage, so this is not exclusive per-package CPU attribution.

The new unchanged API result reproduces the original 127.07 ms cost. The
instrumented fresh-worker difference versus that control is +0.31 ms, exploratory
95% interval −10.83 to +12.14 ms; this is not an equivalence test. The prepared
prototype reduces request latency by 120.27 ms (interval −128.11 to −117.18 ms),
**excluding preparation**. It does not reduce total worker creation-to-result time
in this capture. The total including observed termination was 133.52 ms fresh and
135.38 ms prewarmed. No CPU, memory, capacity or energy savings are established.

All 120 outputs match the original 169,496-byte HTML SHA-256. Ten checks exercise
conflicting tag versions and fresh module counters; the parent registry stays
unchanged. Each prepared worker imports modules and registers definitions before
receiving a snapshot, renders exactly one request, and is discarded. It never
warms the template cache with a prior render. Consequently its first render remains
more expensive than the cached warm process.

## Reproduce

Prerequisites: the exact Phase 5 extracted package stage recorded by
`artifacts/scoped-registry-phase-5/production/stage.txt` and repository dependencies.
If that temporary stage has expired, reconstruct it from the frozen package
archives and harness; do not silently substitute current workspace packages.

```sh
python3 probes/scoped-hydration/ssr-profile/verify-packages.py
node probes/scoped-hydration/ssr-profile/run.mjs --run=unique-qualification --qualify
node probes/scoped-hydration/ssr-profile/run.mjs --run=unique-capture
```

`run.mjs` creates a temporary study using the original extracted packages, and
acquires the shared performance lock. Other browser/build work should be stopped.
Output directories cannot be reused. `campaign-v1` is the captured reference for
`analyze.mjs` and `report.mjs`; change the explicit input if analyzing a new run.
The combined report appends two sortable `en-table` tables to a new HTML artifact;
it does not rewrite the previous report. `verify-report.mjs` checks seven tables,
change-direction notes, sorting, narrow layout and the Developer UI return link in
Chromium, Firefox and WebKit.

Use the default installed Playwright cache. The separate `/private/tmp` Chromium
installation failed to launch because its ICU data was missing; no report checks
or measurements were obtained from that launch. The first isolation qualification
also used an incorrect plain-text assertion across Lit comment markers; the
assertion was corrected and qualification restarted before timing capture.

## Measurement boundaries and limitations

- Five randomized warmup blocks and 30 randomized measured blocks, seed 20260922.
  All samples retained. Difference-of-medians intervals resample matching block
  indices 5,000 times. They are exploratory, not production guarantees.
- Warm process imports/registration/cache setup are outside its timer. Public API
  timing uses its unmodified promise boundary: termination is initiated before
  returning, but can still be settling while the next serial sample begins.
- Instrumented workers report stage boundaries and fully terminate before the
  following sample. Their public-API queue/cancel machinery is not reproduced.
  The uninstrumented control checks aggregate instrumentation distortion.
- Prepared workers finish setup before submission. No human lead, burst, pool
  depletion, worker replenishment, idle wait, cancellation or overload was tested.
  This is a probe, not a shipped pool API. Fresh module realms still benefit from
  warm filesystem/OS caches. Elapsed durations are not CPU measurements.
- Browser HTML delivery, parsing, hydration and interaction are outside these
  server timers. Existing client metrics used pre-rendered HTML and remain valid.
  A request-time deployment would also need end-to-end response/TTFB measurements.
- No new retention campaign: the prototype is not promoted into the library.
  Idle pool memory and loaded request tail latency require separate measurement
  before considering a production pool.

## Recommendation

Keep server policy independent of browser scoped registries and hydration policy.
Use a warm renderer with compatible definitions, or generate/correctly cache HTML
before navigation when content permits. Keep fresh-worker isolation opt-in for
applications that need its registry, cache and module-state boundary. The user
considers its request-time latency a tradeoff, not a Phase 5 blocker.

Prewarming is promising if demand justifies it, but production capacity and memory
work is deferred until request-time isolated SSR is an actual requirement. Do not
reuse a worker across requests without revisiting the isolation contract. Continue
client adoption against the unchanged frozen client results. Existing Phase 5
manual input/accessibility acceptance and commit status are unchanged.
