# En Reve main refresh

The native En Reve fixture is rebuilt from exact tracked-clean local `main` commit `6d09b31cf43523ac8c75352208ab9697b62e2673`. `build-provenance.json` identifies all source hashes, content-addressed package tarballs and the regenerated default light theme. The branch was fast-forwarded to this commit; pre-existing working changes were preserved separately and are not library build inputs. `sync-receipt.json` records reconciliation of the three generated metadata conflicts, with the autostash retained.

The showcase deliberately retains its original sixteen-card application workload and global, eager individual component registrations. Scoped registries, lazy definitions, SSR and opt-in deferred-date delivery are different consumer policies, not enabled by repacking the library. This campaign therefore does not claim their possible benefits or replace their specialized historical experiments.

`run-en-reve-main.mjs` collects eight serialized suites under the shared browser lock. The fixed plan is 306 samples across En Reve main and frozen Fluent WC/Web Awesome controls. Desktop is unthrottled; mobile uses CPU 4×, 100 ms latency, 8 Mbps down and 2 Mbps up. Five mobile Lighthouse audits per system use their independently recorded DevTools throttle. Memory uses one full-Chromium cross-origin-isolated session per system at 0/10/50 journeys. Event Timing thresholds, quantization, first-input scope, observation windows and API timeouts remain explicit.

`finish-en-reve-main.mjs` runs connected-DOM and ownership diagnostics after acquisition and summarizes tracing. Date-field costs are counted both in and out of whole-page totals. Calibration/qualification/DOM diagnostics are not pooled into primary timing samples. Failed jobs are retained and unavailable values are never inferred from previous campaigns.

The current main tables replace only En Reve rows with explicit acquisition IDs. The new three-system section supplies contemporaneous paired comparisons; historical peer rows are descriptive. Historical supplements and source audits retain their original datasets and receive a current-baseline summary/link. Old source receipts, tarballs, raw acquisitions and previous report remain retained. No CI timing baseline is promoted.

To regenerate completed evidence and pages, from the repository root:

```sh
node showcases/performance/experiments/report-en-reve-main.mjs --integrate
node showcases/performance/experiments/update-en-reve-main-pages.mjs
npm --prefix showcases/performance-results run build
node showcases/performance-results/scripts/verify-en-reve-main.mjs
node showcases/performance/experiments/archive-en-reve-main.mjs
```

Start the reader with `npm --prefix showcases/performance-results run preview`, then open `http://127.0.0.1:4188/?progress-report#loading-and-visual-stability`. The current cohort is at `#en-reve-main-comparison`.

Never reuse acquisition IDs. A rerun after code, fixture, instrumentation or protocol changes requires a new immutable ID and qualification. Historical integration generators can replace newer rows; always apply the latest En Reve integration last.
