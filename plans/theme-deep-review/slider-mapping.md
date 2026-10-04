# Radix and shadcn slider source mapping

Prepared 2026-10-03 for `source-slider/filled`. The mapping script is a proposal until the coordinator applies it and runs validation; authoring it establishes no browser pass or user acceptance. It changes only Radix and shadcn definitions, with independent typed `theme.slider-fidelity` values for each appearance. Existing public slider properties remain authoritative over companion fallbacks.

## Radix Themes surface variant

Source: [Themes slider.css at 1faff10ac26ae17f09944d418c6949b93fc6b566](https://github.com/radix-ui/themes/blob/1faff10ac26ae17f09944d418c6949b93fc6b566/packages/radix-ui-themes/src/components/slider.css), with the selected Indigo/Slate palettes from [Colors dbdb85470547c7d34b9001f48fddb08ded335979](https://github.com/radix-ui/colors/tree/dbdb85470547c7d34b9001f48fddb08ded335979). The installed Themes 3.3.0 source was read; this work did not acquire a new immutable snapshot.

- Track sizes are 6/8/10px. Visible white thumb sizes are 13/16/19px: source layout size is track + 4px, and the painted pseudo-element extends by one quarter of the track on each side. The medium-radius setting makes these controls round.
- Track paint is Slate A3, with a 1px inset Slate A5 rim; the range uses Indigo 9. The interval's selected Part has its own inset rim. The native single gradient preserves the track rim without reproducing a separate inner rim at the moving source segment boundary.
- The resting thumb has a 1px black/20 outer ring. Focus adds source 3px Indigo 3 and 5px Indigo 8 rings; En Rêve retains its immediate solid keyboard contour as an accessibility adaptation. Source has no hover paint replacement, thumb scale, or slider paint transition.
- Disabled track rim changes to Slate A4. The range disappears, and the thumb becomes Slate 1 with a 1px solid Slate 6 ring. Separate fill opacity removes the interval segment; a matching track-colored native fill removes the native gradient division. Overall and thumb opacity remain 1. The source root's light multiply/dark screen blending remains an explicit adaptation.

The source allows the visible thumb to overshoot its layout endpoint. Native range endpoints remain browser-owned and keep the thumb inside the control. Interval geometry, value normalization, transactions, exact editing, focus ownership and protected targets also remain En Rêve contracts.

## shadcn Base / Rhea / Neutral

Source: [Rhea CSS at a87a63b2ca25143d26c8bd0903e4e9bc77b3f824](https://github.com/shadcn-ui/ui/blob/a87a63b2ca25143d26c8bd0903e4e9bc77b3f824/apps/v4/registry/styles/style-rhea.css), slider section lines 2–16. Retained source SHA-256 is `bcb242a7845316f93b0562345dd5c32a46a2988b506a8e8d7df1c836a1637b49`. The existing Neutral recipe supplies the selected appearance's source colors; this mapping does not switch to another shadcn flavor.

- Track is 4px at every size, with input/90 paint. The existing input/50 literal is projected by multiplying its alpha by 1.8: light `#e5e5e5 / .9`, dark white / `.135`. Source primary color fills the accepted portion.
- Thumb is 16px white in both appearances, borderless, with a 1px black/10 outer ring and source `shadow-md`: `0 4px 6px -1px black/10, 0 2px 4px -2px black/10`. The 18px site corner radius produces round track ends and thumb.
- Hover and focus replace the resting black ring with a 4px source ring/30, retaining both elevation layers. The existing source halo literal is copied rather than reusing the stronger shared solid focus color. The native solid keyboard contour remains immediate; paint transition duration is 200ms. Fill and white thumb paint do not change on hover or press.
- The source Base wrapper declares disabled opacity .5 on the Control and again on the Thumb. The prepared mapping preserves this double fade, keeps the filled portion present, and keeps the underlying thumb paint white. Reduced motion and forced colors retain precedence.

The local wrapper's registry provenance is `https://ui.shadcn.com/r/styles/base-rhea/slider.json`, SHA-256 `9c2113da95102d9339c428e138d84db88e73d297eb66b297b260a1084d9e10ab`. It is separate registry evidence, not a new byte verification of the immutable Base wrapper. The retained source tree identifies the [pinned Base wrapper](https://github.com/shadcn-ui/ui/blob/a87a63b2ca25143d26c8bd0903e4e9bc77b3f824/apps/v4/registry/bases/base/ui/slider.tsx) as Git blob `2e55a9a0fc07b66fc86ce1df33c86c2501939088`.

Native fill uses explicit `syncRangePresentation` integration after initialization, input, settled reset and application value/bounds changes. There is no import-time DOM setup or automatic document observer. The custom slider synchronizes its own accepted/tentative state. Browser evidence must cover these paths, rollback, bounds collapse, RTL, vertical direction, disabled paint, forced colors, reduced motion and target preservation before claiming fidelity.
