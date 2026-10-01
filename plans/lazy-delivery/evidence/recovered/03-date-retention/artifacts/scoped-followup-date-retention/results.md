# Calendar retention decision

**Retain current behavior.** Do not add a detach or recreate API. Eager defaults and connected-after-first-use deferred calendars stay unchanged.

## Established functional result

Discard/recreate fails the compatibility gate. With selected value 2026-09-15,
ArrowRight moves focus to 2026-09-16 without committing. Connected and detached
warm instances reopen on September 16; a recreated calendar reopens on September 15.
After moving from October 12 into November and reopening, retained instances focus
October 1; recreation focuses October 12. All five tested engine/registry cells
agree. The selected value and actual FormData are unchanged, but active-date and
spoken focus context can differ. This is sufficient to reject a transparent
recreation policy. No new public active-date state transfer API is proposed.

The renderer applies value and month at opening. An equal value does not mark
`value` changed; same-month active navigation survives. A month change can clamp
the active date to day 1. A broad "retain view state" API would not describe the
current mixed behavior accurately. Detaching retained the existing semantics.

240 automated fixture assertions passed: canceled close, explicit busy/pending guard,
native editing, active gesture, value/constraints, form transaction veto,
author-write precedence, accepted selection, removal/reconnection and eager
uncommitted ranges. Three existing calendar SSR tests pass on the export. These
are not actual screen-reader speech/cursor, physical-device, IME/autofill/history
or full hydration qualification. The pending guard is exercised through the fixture busy set; there is no slow network-chunk cancellation campaign in this eager-code study. Existing local status and date-label source remain unchanged; DOM checks cannot establish identical speech on reconnection. The shared Phase 6 manual decisions stay accepted.

## Interpretation rules

Only subtract matched same-campaign, engine, actual/requested registry, cache state
and workload. Negative time, heap, node or listener differences indicate lower
cost; detached nodes remain memory until collected. Realm heap and CDP listener
counts are proxies and include fixture, modules, shared caches and observers.
WeakRef instrumentation retains its weak wrapper list, not strong calendar roots;
that bounded instrumentation overhead remains in the captured heap.

Every policy imports/registers the eager calendar graph. Construction and post-close
storage are the experimental axes. All fields share one scope. Disposing fields
does not unregister that scope's definitions or evict imported modules. The scope
is deliberately kept alive after all fields are removed; then the context is
closed. No registry-collection or module-unloading claim is made.

Cold is a fresh isolated browser context; warm is a primed same-context HTTP cache
followed by a new document. Both differ from same-document repeat opening. Browser
processes are reused, so neither is a fresh-process compilation study. Programmatic
fixture invocation to usable DOM focus is the timing endpoint, not trusted input,
INP, physical response or paint. CSS/layout counters are available only in Chromium.
Firefox auto is actual global fallback; WebKit is functional coverage only.

The fixture is an explicit quiescence experiment, not a production event hook. It
waits accepted closure, focus restoration and reported animations, then allows
parking only with no focus/edit/gesture/pending/range owner. There is no eviction
timer. A complete production implementation would still need native close,
transition/adoption/loading and targeted manual qualification plus date-cost owner
coordination. No such implementation is included.

## Independent retention result

All 80 requested retention runs completed: four policies × two populations × two
Chromium modes × five independent contexts, 100 mount/open/close/remove/reconnect
cycles each. The immediate double-GC protocol did not produce uniformly zero
node/listener growth. Six one-field runs had nonzero deltas (including negative
deltas), with maxima +654 nodes and +146 listeners. Positive runs occurred in
eager, connected and detached arms. Preserve these observations; pending native
close/cleanup work is a possible explanation, not a proven attribution or leak.
Some all-removed checkpoints still observed the former fields through WeakRefs.
No timer-based teardown or post-hoc trimming was used.

Twenty-field closed medians (five separate repetitions) were connected→detached:
scoped 4,768,940→5,782,060 B; global 4,757,400→5,771,056 B. Listeners stayed 3,078.
Connected nodes fell from 12,684 to 2,784, while 9,940 calendar subtree nodes stayed
detached. Authored inert template storage was zero. This is not zero renderer template memory. Lit cache fragments/template caches are outside
that observed detached-calendar count; realm-wide CDP node totals are retained in
raw checkpoints. This is no memory reduction.

Discard lowered closed heap to 3,461,192 B scoped / 3,449,240 B global and listeners
to 418. That real memory benefit cannot override its failed active-date semantics.
Definitions still existed in every all-removed checkpoint. Modules remained
loaded for the realm. Calendar collection does not imply module/registry disposal.

## Completed campaign and acceptance

- 1,080 successful timing samples: 36 configurations × 30 (eager / connected / detach; Chromium native scoped, Chromium explicit global, Firefox actual global fallback; one / twenty used fields; cold / warm cache).
- 120 separate exact twenty-field resize/reopen samples: 30 for each connected/detached × Chromium mode.
- 80 separate retention runs: five per policy × population × Chromium mode, 100 cycles each.
- 144 diagnostic captures with all four policies (three per cell); 72 separate sparse captures with 20 fields but only one used (three per cell). No promotion inference from those small cells.
- 20 final functional configurations / 240 automated assertions, plus three existing SSR tests. Preliminary functional runs and a failed asset-path attempt remain separate.

Each timing sample is a fresh context visit, not each field in its nested array.
First/repeat latency in overview tables describes field 1; all-field sums and
navigation distributions remain in expanded tables and raw data. All captures
finished without errors in final named runs. Measurement success is not functional
acceptance of the deliberately rejected discard arm.

| Predeclared gate | Result | Disposition |
| --- | --- | --- |
| Preserve active-date repeat semantics | Detach matches; recreation differs in all five functional engine/mode cells | Reject recreation |
| Twenty-field heap benefit >=20% and >=256 KiB | Detached medians increase by about 989 KiB; listeners unchanged | Fail |
| Twenty-field resize/reopen style+layout benefit >=20% and >=2 ms | Native scoped +1.221 ms, 95% paired bootstrap −1.871..+4.971; explicit global +5.7405 ms, +0.9495..+9.7145 | No qualifying benefit |
| First median regression <=8 ms; repeat <=4 ms / p75 <=8 ms | Largest matched first/repeat median increase is 1 ms across serious timing cells; largest repeat p75 increase 1.75 ms; per-cell distributions retained | Latency alone does not justify policy |
| Additional heap growth <=128 KiB and no additional positive nodes/listeners | One global one-field detach repetition adds 169,312 B relative to paired connected growth and +654 nodes / +146 listeners | Not a clean retention pass; no leak attribution |

For context, the native-scoped cold twenty-field timing cell has first focus
8.90→8.90 ms and repeat focus 2.90→3.30 ms; repeat delta interval +0.15..+0.55 ms.
The broad interaction style/layout envelope (first+navigation+close+repeat) is
109.955→115.246 ms. The exact declared resize/reopen window is separately measured
at 65.7945→67.0155 ms; it is not derived by subtracting unlike stages or campaigns.
These are local desktop laboratory results, not historical Phase 0–6 deltas.

## Module and registry accounting

Reference emits three JS files, 217,620 raw bytes / 55,778 offline gzip9 bytes;
experimental emits three, 219,054 / 56,416. Two eager graph files are actually
requested at startup; the tiny optional-definition wrapper is emitted but unused.
Warm Chromium captures confirm zero JS transfer on the measured new-document visit.
Offline gzip is inventory only: the fixture server sends uncompressed HTTP/1.
The extra cache/prototype code is not a production payload proposal.

All 80 all-removed retention checkpoints still resolve the known `en-calendar`
definition from the one intentionally retained scope. No global inventory or
per-picker registry is used. No module-only retained-byte metric is available;
realm heap contains code, shared caches and fixture/application state together.
Definitions cannot be unregistered, imported modules remain cached, and removing
or collecting DOM does not reverse either lifetime. Scoped-owner collection after
release of the owner itself was not measured; context closure ends observation.

## Failed attempts, limits and next action

`attempts.json`, the rejected absolute-asset build, and `functional-v2/failures.jsonl`
retain infrastructure and readiness failures. Browser-lock refusals/waits launched
no overlapping campaign. Final runs are not pooled with rejected or diagnostic
attempts. Assets are verified before/after every completed campaign. Source and
built-byte fingerprints, dependency versions, OS/CPU/browser and power snapshots
are retained. Thermal/background OS load is unmeasured; the lock serializes
cooperating browser campaigns only. Five retention repetitions are descriptive.

The decision needs no production change or reopening of accepted manual review.
Any later distinct opt-in proposal must first reconcile active-date semantics,
qualify functional/SSR and changed AT/device paths, and coordinate date payload /
first-use ownership. That is conditional future work, not an unfinished promotion
in this task. No merge, remote publication or deployment was performed.
