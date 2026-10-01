# Spectrum Web Components Gen2 refresh

This campaign measures `@adobe/spectrum-wc` 2.0.0-beta.3 with retained Gen1 1.12.2 form, menu and dialog controls. It is a mixed-generation whole-showcase implementation, not a Gen2-only package benchmark. The frozen En Reve and Fluent WC artifacts are contemporaneous controls; the other eight fixture fingerprints remain unchanged.

`config.json` identifies the eight immutable acquisitions and separate connected-DOM evidence. `prior-inventory.json` and `prior-results.md` retain the pre-refresh identities and reader source. Earlier raw acquisitions, Web Awesome evidence, and regression anchors are not rewritten or promoted. The old Spectrum artifact remains under `.cache/archive/spectrum-web-components-<old fingerprint>` and is retained in the evidence archive.

Qualification uses the separate `showcases/verification-spectrum-gen2.json` receipt. Preparation was selected and explicit:

```sh
node showcases/performance/src/prepare.mjs --refresh --systems spectrum-web-components --receipt verification-spectrum-gen2.json --reason 'Refresh to Gen2 beta plus Gen1 coexistence'
node showcases/performance/src/cli.mjs functional --systems spectrum-web-components
```

The historical default receipt catalog still describes the original panel. Use the selected receipt above for this refresh; do not replace or mutate the original `showcases/verification.json`. Future full-panel preparation must deliberately compose current receipts without duplicate implementation IDs.

`experiments/run-spectrum-gen2.mjs` holds one shared browser lock over the entire 306-sample queue. Its IDs and execution receipt cannot be reused. Desktop is unthrottled; mobile uses 4× CPU, 100 ms latency, 8 Mbps download and 2 Mbps upload. Lighthouse uses its separately recorded DevTools throttling, without stacking the primary throttle. Memory uses full Chromium with isolated origins and checkpoints at 0, 10 and 50 journeys. Qualification/calibration and connected-DOM diagnostics are excluded from timing distributions.

After acquisition, from the repository root:

```sh
node showcases/performance/src/cli.mjs diagnostics --run spectrum-gen2-diagnostic-v1
node showcases/performance/experiments/report-spectrum-gen2.mjs --integrate
node showcases/performance/experiments/archive-spectrum-gen2.mjs
npm --prefix showcases/performance-results run build
```

DOM collection must also finish first: `run-dom-review.mjs spectrum-gen2-dom-v1 --systems spectrum-web-components,en-reve,fluent-web-components`, then `run-dom-ownership.mjs --systems spectrum-web-components,en-reve,fluent-web-components --output reports/spectrum-gen2/shadow-ownership.json`. Run them under the shared browser lock, after primary acquisition.

The integration replaces Spectrum rows in the main grouped tables, first reference comparison and rendering excerpt. Each replacement carries its acquisition ID and a Gen2 + Gen1 label. Historical paired contrasts, source audits and the earlier Web Awesome supplement remain historical; the new supplementary tables provide same-campaign contrasts. Rebuilding older reports first requires rerunning this latest integration last. Missing measurements remain unavailable and failed samples are retained.

`tables.json` preserves sample distributions, source hashes, coverage and within-campaign differences. `main-integration.json` records replaced rows. `evidence/receipt.json` hashes compressed raw runs, original harnesses, qualification, measured build and analysis sources. Ten-sample cells and one-session memory are exploratory; this refresh does not establish a CI timing gate or a causal before/after Gen1 comparison.
