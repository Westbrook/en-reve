# Paired theme candidates

This maintainer generator reads seven canonical inspired pairs at `inspired/{spectrum,fluent,astryx,shadcn,radix,web-awesome,holotable}.{light,dark}.json` and three original pairs at `originals/{vellum,signal,kinetic}.{light,dark}.json`. Each managed edit sequence explicitly chooses its mode and expected density. Definitions identify the theme's purpose, reference flavor when applicable, and independent light/dark mapping. The associated mapping/provenance documents remain review evidence, not executable theme configuration.

Each branch starts from `createReviewDraft(definition.baseOptions?.[mode] ?? {})`. Optional `baseOptions: { light: ThemeOptions, dark: ThemeOptions }` uses the existing code-authoring API to supply trusted fonts, structured shadows and other source choices before managed editing. Both baselines are required when this field is present. Documentation generation emits the same repository-owned baseline catalogue for preset loading and review-file reopening; an imported file cannot replace that authoritative base. The original themes use this existing API rather than weakening managed-value validation. Font files remain application assets: exported theme CSS names its font stacks but does not embed or download fonts or their licenses.

Use the repository's supported Node runtime and existing built packages, after the documentation build is complete. From the repository root:

```sh
node tooling/theme-candidates/prepare.mjs \
  --build-fingerprint sha256:<fingerprint-from-dist-review-build-json> \
  --output artifacts/theme-candidates/<review-checkpoint>
```

Both arguments are mandatory; output resolves from the current working directory and must be outside `dist`. The command does not install dependencies, build, start a browser, publish, or alter canonical recipes. It intentionally fails for mismatched build/asset bytes, invalid managed edits, wrong branch modes/density, compiler diagnostics, or a nonidentical v2 bundle roundtrip.

Each candidate produces a local Theme Review **v2** JSON bundle and a standalone paired CSS file. The JSON reopens only in its exact documentation build. The CSS equals the bundle's regenerated paired artifact and targets `[data-en-theme="<candidate-id>"]`; that boundary may choose `data-en-appearance="auto"`, `"light"`, or `"dark"`. It does not embed or copy the documentation application.

`manifest.json` records build/definition/generator/catalogue/input hashes, branch source and baseline hashes, the pair hash and emitted file/CSS hashes. All ten pairs are prepared and reopened before output writes; distribution bytes are rechecked after preparation, and the manifest is written last. Verify its file hashes before consuming a checkpoint. The build fingerprint is assigned before HTML metadata injection, so it is not recomputed from the final asset list.

Successful preparation proves managed replay, matching modes/density, no current compiler diagnostics, exact branch tokens, paired CSS and byte-identical export/reopen/export. Browser interaction, visual comparison, manual accessibility, hosted delivery and adoption remain unperformed by this command. No version bump is part of preparation.

The focused catalogue regression suite uses the current token build and the documentation's generated catalogue, without requiring a built documentation distribution:

```sh
npm run build -w @en-reve/tokens
npm run prepare:docs -w @en-reve/docs
node --test --test-concurrency=3 tooling/theme-candidates/catalogue-group-{1,2,3}.test.mjs
```

It replays all 20 branches, checks current compiler diagnostics and paired CSS/bundle round trips in both editing appearances, and rejects self-consistent files with an unauthorized baseline. This validates the portable theme data and review boundary; it does not claim rendered fidelity.

## Rendered verification

The current ten-theme release corpus checks rendered fonts, shapes, paired
JSON reopening, button/field/option states, nested elevation, original-theme
mobile RTL reflow and text enlargement, reduced motion and forced colors:

```sh
EN_DOCS_ORIGIN=http://127.0.0.1:4480 npx playwright test --config apps/docs/tests/theme-refresh.config.ts
node tooling/theme-candidates/originals/verify.mjs
```

Both checks and the catalogue tests are included in `npm run test:theme`. The
focused browser command uses a completed docs build; omit `EN_DOCS_ORIGIN` to
let its config start the built-site server. Screenshots and source-bound receipts
are stored under `artifacts/theme-refresh/browser` by default.


With the matching built docs server running, run `verify.mjs --candidates <directory>
--output <evidence-directory>`. `EN_CANDIDATE_ORIGIN` defaults to the loopback server
on port 4391. Use the installed Playwright browser cache for your environment. The
runner imports each actual candidate file in Light and Dark in Chromium, Firefox
and WebKit; it checks pair receipts, geometry, selected text/focus paint, independent
baseline and exact paired reexport. Computed contrast receipts retain the actual
ancestor paints and identify unmeasured cases. This is focused evidence, not a full
accessibility or reference-system visual equivalence claim.

Historical popup motion for Spectrum2, Fluent, Astryx and shadcn Rhea is described in [the original motion mapping](./inspired/popup-motion-mapping.md). Current exact timings and source disagreements are recorded in the [September 20 refresh report](../../plans/theme-refresh-report.md), with source observations distinguished from shared-surface adaptations. Each pair keeps identical non-color motion inputs in light and dark; the ordinary library defaults remain immediate.

The asset workflow has a separate focused verifier so adding content patterns does
not require rerunning every component scenario:

```sh
node tooling/theme-candidates/verify-assets.mjs --origin http://127.0.0.1:4431 --candidates artifacts/theme-candidates/asset-followups-edd09329014f
```

It reopens all ten pairs through the native file picker and checks actual brand
paint, keyed selection across Grid/List, Preview focus return, local insertion
and baseline isolation. Its receipt distinguishes rendered evidence from motion
token observations; popup motion has its own browser suite.

## Variant companions

All ten canonical definitions now carry a trusted `ThemeCompanionRecipe`. Prepared output retains the standard `<id>.css` token pair and adds `<id>.companion.css`, with independent identity and file digest in the manifest. Load token CSS first and the sidecar second beneath the named explicit theme/appearance boundary. Automatic appearance uses matching light/dark media rules. Showcase's Download CSS combines both files for application use. The build-bound JSON outer envelope includes a regenerated companion; reopen rejects altered companion data. See [the adoption report](../../plans/theme-inspired-adoption.md) for source mappings and limitations.

The Web Awesome-inspired pair uses the Default theme and palette from 3.13.0, with documented contrast adaptations. See [its mapping and verification report](../../plans/web-awesome-theme.md). The native comparison remains an isolated sub-project.

The three process groups register the unchanged shared case bodies from the actual catalogue. The compatibility `catalogue.test.mjs` file still runs the entire catalogue in one process for diagnostic baseline comparisons; do not select it together with the three groups. `test:theme` selects only the groups and caps the whole Node stage at three workers.
