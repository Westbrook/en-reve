# THEME-07 — Reusable authoring pilot

Status: **Historical pilot complete. The user subsequently chose CSS source authoring; see the [adoption work](theme-07-css-authoring.md).**

The pilot started from main/Production `d71912a` (Site 200, THEME-01–05). It occupies only `tooling/theme-authoring-pilot/` and this guide. THEME-06's component adoption, public hooks, reset contracts, and runtime styling are unaffected.

[Open the local comparison](http://127.0.0.1:47907/?progress-report) · [Reproduction and restricted syntax](./theme-07-pilot-readme.md?progress-report)

## Before and after

The baseline uses reusable TypeScript/Lit functions to compose one clamped inset-radius expression and the existing body, metadata and three heading font shorthands. The experiment authors the same two helpers using a pinned Reve transform. Its strict wrapper rejects unsupported definitions rather than inheriting the semantic differences found in the initial audit.

The existing token-default and size-role helpers still supply both paths. This retains runtime variables, nested theme boundaries, size selection and the typed token validator. The compiler runs only in the isolated pilot, and consumers receive ordinary CSS.

The geometry example is:

```css
@function --pilot-inset-radius(--outer, --inset) {
  result: max(0px, calc(var(--outer) - var(--inset)));
}
```

It expands at build time into the same `max(0px, calc(… - …))` expression as the TypeScript helper. This is an internal, restricted dialect—not a native CSS API.

## Results

| Measure | TypeScript helper | CSS-authored pilot |
| --- | ---: | ---: |
| Ordinary CSS | 2,891 bytes | 2,891 bytes |
| Gzipped CSS | 547 bytes | 547 bytes |
| Warm compile median, 50 samples | 0.070 ms | 1.285 ms |
| Cold process median, 7 samples | 108.3 ms | 126.4 ms |
| Definitions per recipe | 1 | 1 |

These timings describe this small fixture on the development machine, including the measured harness overhead. They are not full-build estimates. Both paths already remove formula duplication; CSS locality is a possible preference, not a demonstrated maintainability gain.

Verification passed:

- **42 Node contract/watch tests**, including an assertion that extracted typography matches actual production style declarations.
- **33 browser scenarios** across Chromium, Firefox and WebKit: 18 appearance/size combinations comparing five delivery paths, plus 15 live local-edit/isolation checks.
- 70 probes per delivery page compare typography, corner radii and rendered dimensions across baseline CSS, compiled CSS, Lit style imports, actual declarative-shadow SSR, and hydrated SSR.
- Three distinct recipe fixtures, all density choices, small/medium/large, light/dark with opposite nested appearances, partial overrides, missing-token fallbacks, and sibling isolation.
- Exact CSS equality, including the existing size-role declarations. No function/mixin transform is required in the consuming browser.
- Manifest-driven watch edits, additions, removals, invalid definitions and recovery match fresh builds. The bounded watcher polls explicit inputs every 100 ms; this does not claim Vite HMR integration.
- Local review controls and dark hydrated comparison inspected in the in-app browser.

The three fixtures are not the complete THEME-08 application themes. Focus/motion, arbitrary selector composition, human authoring studies, and a production package-build integration are outside the pilot.

## Original recommendation (superseded)

**Keep the current TypeScript helpers.** The pilot proves that a constrained function/mixin path can preserve these recipes, but it does not demonstrate enough benefit to adopt it. It produces the same bytes and still needs the current token/size adapters, while adding an external compiler, a restricted-language validator and build/watch maintenance.

The audited engine, its imported configuration and its Lightning CSS version are pinned in the manifest. The optional pilot requires an existing Reve checkout with dependencies installed; normal library builds do not. This is intentionally an evaluation tool, not a new required build dependency or public authoring package.

A later adoption proposal should identify a concrete author workflow and measurable acceptance threshold. THEME-08 can continue using the existing helpers. User review of this finding remains separate from implementation/test completion.
