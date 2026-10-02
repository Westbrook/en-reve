# Selective registration consumer verification

`@en-reve/elements/define/split-view.js` registers `en-split-view` and the `en-splitter` and `en-button` children that its shadow template creates. Class-only imports remain side-effect free. The split-view catalog descriptor carries the same dependency so selecting that descriptor preserves the closure. Slotted author-supplied components still require their own explicit definitions.

After building the workspace packages, run:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright node tooling/registration/verify-packed.mjs
```

This script does not build or install anything. It packs the existing tokens, styles, primitives and elements artifacts with lifecycle scripts disabled, extracts them into a temporary consumer, and copies the installed Lit/Signals browser dependencies. An import map is generated from actual package exports. No source aliases, Vite transforms, full-catalog registration or remote CDN are used by the selective fixture.

The checks run in Chromium, Firefox and WebKit:

- Importing a class or catalog does not register any element.
- The single split-view definition import registers exactly its required children and the view, and does not load the catalog.
- Actual keyboard and mouse interactions resize the panes in both orientations.
- Two related imports (split view/splitter) share their dependency closure; two unrelated imports (split view/checkbox) remain selective. Each performs keyboard and pointer interactions; the checkbox also checks native form values.
- Shared module URLs are requested once per page.
- An already registered compatible splitter remains idempotent.
- A conflicting parent or child constructor rejects the import before registering the other tag.
- Registering only the split-view catalog descriptor includes its splitter/button dependencies and no unrelated elements.

Each scenario uses a fresh page and registry. The receipt at `results/packed.json` records package versions, exact workspace tarball hashes, browser versions, exact import map, served-asset hashes, per-scenario request URLs and individual results. Set `EN_REVE_REGISTRATION_EVIDENCE_DIR` to place the receipt elsewhere. Temporary archives, consumer files and the server are cleaned up when the run completes.

These checks concern selective consumption of the built package artifacts. They do not establish complete library coverage, scoped-registry support, SSR, current-minus-one browser/framework compatibility or manual assistive-technology acceptance. Build current sources before running; packing does not rebuild stale output.

The packed SSR fixture uses the independently locked `showcases/performance` esbuild installation. On a clean checkout, install it with `tooling/test-pipeline/with-toolchain.sh npm ci --prefix showcases/performance`; no showcase snapshot is rebuilt or repacked.

For a fresh owned build plus the packed SSR/consumer tests, pathway selection contract and semantic test types:

```sh
tooling/test-pipeline/with-toolchain.sh npm run test:plan -- --pathways=consumer-delivery
EN_EXECUTION_OUTPUT=/absolute/non-existing/run tooling/test-pipeline/with-toolchain.sh npm run test:union -- --pathways=consumer-delivery
```

The pipeline retains packed-registration evidence under `registration/` and prepares an isolated consumer under `fixtures/consumer-contracts/`. SSR checks cover immediate/delayed adoption and actual hydration-module failure in shadow/global delivery; failed hydration leaves the original native input editable. Custom-element form association still requires successful upgrade; this is not a no-JS submission fallback. These are selected delivery-contract checks, not every framework server stack.
