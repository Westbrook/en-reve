# THEME-07 — CSS-authored recipes

**Accepted and published for review.** Typography and surface recipes use the CSS source build as their maintained implementation.

The authoring decision is now to prefer CSS source when the consumer contract is preserved. The original pilot's recommendation to retain TypeScript authoring is superseded by that explicit user preference; its parity results remain useful evidence.

This bounded adoption moves production typography and surface recipes, including inset-radius composition, into `packages/styles/src/css/`. Selectors, declarations, the font mixin and radius function live in CSS. A self-contained package build generates the existing Lit exports and plain stylesheets. Consumers retain the same imports and do not need a transform or an external source checkout.

```css
@mixin --en-font(--weight, --size, --leading, --family) {
  @result {
    font: var(--weight) var(--size) / var(--leading) var(--family);
  }
}

.en-body, .en-prose {
  color: --token(--en-color-text);
  @apply --en-font(
    --token(--en-font-body-weight), --token(--en-font-body-size),
    --token(--en-font-body-line-height), --token(--en-font-body-family)
  );
}
```

The build expands `--token()` using the same default and size-role serializer as the remaining TypeScript styles. Runtime custom properties remain live. Existing typed token derivation APIs and unrelated style families remain unchanged.

The combined typography/surfaces consumer CSS is identical after normalization: **18,752 bytes, 2,704 bytes gzipped** on both sides. These totals include the unchanged layout companion in the surfaces export. Equivalent browser CSS is established; this does not claim that maintainer build times or JavaScript module initialization times are identical.

Verification passed: **52 Node tests, 33 browser scenarios across three engines, six real CLI watch stages, and a strict TypeScript consumer check**. The full workspace build also passed against main `3d233e9`. Checks cover the normal workspace build and customization audit, recipe/compiler failures with source locations, edits/additions/removals/error recovery, typed consumer exports, plain CSS, native Lit imports, SSR, hydration, nested themes, all three sizes and live sibling-isolated overrides. The before/after harness loads the actual generated package exports.

[Local production comparison](http://127.0.0.1:47917/?progress-report) · [Authoring and reproduction guide](./theme-07-css-readme.md?progress-report)

A broad conversion of all style families is outside this pass. The user approved adoption after reviewing the local comparison. The bounded adoption is now published; the optional comparison continues to run locally.
