# THEME-07: bounded authoring pilot

Historical experiment, not a public authoring API. The user subsequently chose CSS source authoring; see [the adopted tooling](./theme-07-css-readme.md?progress-report). Baseline: `d71912ac47f20ec8e5c3186f26ff0bd948e3e82b`, production Site 200 (THEME-01–05). THEME-06 component adoption proceeds independently.

## Run

Use Node 26.10.0 Current (or Node 24.21.0 LTS) with type stripping, the root workspace's locked dependencies, and its built tokens/styles:

```sh
npm ci
npm run build -w @en-reve/tokens
npm run build -w @en-reve/styles
export REVE_CSS_FUNCTIONS_SOURCE=/absolute/path/to/reve-core/tools/css/src/css-functions.ts
node --test tooling/theme-authoring-pilot/*.test.mjs
node tooling/theme-authoring-pilot/verify.mjs
node tooling/theme-authoring-pilot/verify.mjs --serve
```

The external Reve checkout must have its own dependencies installed. `manifest.json` pins the audited source digest, imported build-config digest, and upstream Lightning CSS version. A mismatch fails **before importing the engine**. Obtain the audited version rather than changing the digest to accept unreviewed source. No external source is copied or downloaded by this pilot. The normal library build does not need that checkout or environment variable. The private package manifest declares the pilot's direct dependencies; the root lock already contains the installed versions used here.

Verification writes `node_modules/.cache/theme-07-pilot/results.json`, identical before/after CSS, a Lit style module, consumer call sites, and actual Lit SSR output. `--serve` opens a localhost-only review at `http://127.0.0.1:47907/?progress-report`; it uses the existing report return link. Run verification first to populate evidence. Serving does not rerun or claim verification.

## Supported dialect: en-reve-authoring-pilot/v1

The wrapper validates a deliberately smaller language than the audited Reve implementation. It does not implement native CSS function semantics.

- Explicit, ordered definition files in `manifest.json`; no project-wide directory harvesting.
- Top-level unconditional `@function --name(--parameter, …) { result: …; }`.
- Top-level `@mixin --name(--parameter, …) { @result { ordinary declarations } }`.
- Unique names across both definition kinds. Untyped, unique, required parameters; exact argument counts.
- Definitions may use `var()` of a declared parameter, `calc()`, `max()`, `min()`, and `clamp()`. Runtime variables and fallback stacks are passed explicitly by the consumer.
- Consumers are flat style rules with declarations or `@apply --name(…)`. Built-in CSS functions and quoted strings remain values. Helper calls cannot be nested inside other helper calls.
- No types, defaults, return annotations, local custom properties, implicit caller environments, helper composition, conditional/layered/scoped definitions, nested output, `!important`, escapes, or value comments. CSS-wide keyword arguments are rejected. These are explicit limitations, not native-equivalent behavior.
- Parameter annotations do not replace token validation. Arguments are not type-checked by this transform. Existing typed token validation and size-role generation remain unchanged.

Expansion runs before a separate Lightning CSS lowering pass. Output inspection rejects leftover authoring rules or custom calls. Errors retain consumer or definition file/line information; arity errors also identify the definition.

## What is compared

`fixtures/baseline.ts` extracts the actual font shorthand and token/size fallbacks used by `packages/styles/src/typography.ts`. A test checks that extraction against the built production stylesheet. It uses one reusable TypeScript helper for typography and one for clamped radius subtraction, so the comparison does not manufacture a benefit by leaving the baseline duplicated.

`fixtures/recipes.css` authors those same recipes as one function and one mixin. Call sites still obtain their default and size-aware token references from the existing helper. `sizedStyles()` runs unchanged on both outputs. Both paths define each formula once. The geometric recipe follows `deriveInsetRadius()`'s clamp; it does not replace that typed evaluator or its dimension validation.

The browser harness compares 70 computed-style probes per page across five delivery paths: baseline CSS, compiled plain CSS, a native imported Lit style module, actual declarative-shadow SSR, and hydrated SSR. Three fixtures differ in font family/size, corner shape, spacing and density. Light/dark, small/medium/large, partial overrides, opposite-appearance nested full themes, unset-token fallbacks, and live local edits are checked in Chromium, Firefox and WebKit. Known expected values are asserted in addition to before/after parity.

These are recipe stress fixtures, **not completed THEME-08 application themes**, and do not claim whole-library or accessibility certification. Focus, motion, arbitrary selectors and theme algorithm replacement are excluded.

## Build and watch evidence

`watch.mjs` re-reads the complete explicit input manifest for every rebuild. Its bounded watcher polls only the manifest and listed CSS contents every 100 ms. This avoids filesystem event startup/order differences observed during the pilot. Tests exercise edits, new files, removals, duplicate definitions, invalid content and recovery, comparing successful watch results to fresh builds. Failures are explicit; a previous valid output is never reported as the result of a failed build.

This is not Vite HMR, a bundler plugin, or package build integration. That additional maintenance cost remains part of any adoption decision.

`benchmark.mjs` runs in fresh processes for cold comparisons. Warm samples include validation/expansion/lowering on the CSS path and equivalent CSS serialization on the TypeScript path. The result records medians, sample counts and generated/gzipped bytes. Tiny-fixture timings are observational and should not be extrapolated to a complete build. Human readability and maintainability have not been measured by a user study.

## Original decision (superseded)

Retain the existing TypeScript helpers. The constrained pilot establishes output parity and useful error checks, but no output-size reduction or reduction in formula duplication over the fair TypeScript comparator. It introduces an upstream compiler prerequisite, dialect restrictions, validation maintenance and slower warm compilation. A production migration or public helper package is not justified by this evidence.

A future pilot should begin with a demonstrated CSS-author workflow that the existing helpers cannot serve comfortably and a concrete acceptance threshold. THEME-08 does not depend on adopting this transform.
