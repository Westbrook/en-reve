# Spectrum WC Gen2 migration and Spectrum 2 theme review

The live isolated Spectrum Web Components sub-app now uses `@adobe/spectrum-wc` **2.0.0-beta.3**, the npm latest release inspected September 22, 2026. This is a beta with incomplete component coverage, so supported Gen2 controls coexist with pinned Gen1 1.12.2 form/dialog/menu controls. Dependency installation remains isolated under `showcases/spectrum-web-components`; root package manifests and lockfile are unchanged.

## Implementation and limits

`showcases/spectrum-web-components/README.md` documents the exact split and local commands; the [live native showcase](http://127.0.0.1:4516/?progress-report) exposes the migrated implementation. Individual registration imports retain library-native Lit components and allow the bundler to load only imported component modules. Native anchors consume the new link stylesheet. Named tabs, accordion label slots, avatar alternative text, progress values and popover trigger/lifecycle APIs were migrated. No proprietary font asset was introduced; the source font stack uses available local fallbacks.

The Gen2 card is a media preview/title/description component, so existing generic application card containers were retained. Gen1 picker/menu/dialog dependencies legitimately retain some Gen1 buttons and popover infrastructure internally. The mixed build should not be advertised as entirely Gen2 or its weight attributed solely to `@adobe/spectrum-wc`.

The published beta stylesheet includes an incomplete nested `@property` override which Lightning CSS refuses to minify. The isolated Vite configuration uses pinned esbuild 0.28.2 for CSS minification. Vendor sources remain unchanged. This is a build-tool compatibility workaround, not a library performance optimization.

## Inspired-theme refinements

Matched-viewport card captures and actual Gen2 component styles exposed three improvements expressible through existing public theme contracts:

| Detail | Native Gen2 evidence | En Reve refinement |
| --- | --- | --- |
| Reset | Neutral filled pill, 14px bold text | Existing `reset-action` companion role uses the Spectrum secondary-action recipe; other ghost actions retain their semantics |
| Neutral badge | 24px overall height, 7px corners; 12/16px weight-500 label; white text on light `#505050` / dark `#6d6d6d` fill | Scoped badge typography and neutral-variant paint; badge spacing compensates for En Reve's existing 1px border |
| Progress | 6px track, light `#dadada` / dark `#393939` track | Public component size/track-color tokens; label/value composition remains distinct |

The existing primary color mapping remains based on the newer Spectrum design-data/React S2 references, not silently replaced by the beta's older palette. Protected hit targets and functional boundary/focus contrast remain deliberate En Reve adaptations. Gen1 choice/input paint is not treated as proof of future Gen2 defaults. Authored card backgrounds, headings, chart panels and content layout remain composition differences.

Gen2 light/dark measurements in `artifacts/spectrum-wc-migration/gen2-measured.json` inspect Gen2 surfaces only; the comparison page itself remains the requested single light theme. The dark probe does not certify the retained Gen1 controls in dark mode.

## Performance continuity

Historical timing, byte, memory and connected-DOM measurements remain unchanged and describe **Gen1 1.12.2**. This implementation pass performs functional and visual qualification, not a replacement performance campaign. Future campaigns must prepare a new fingerprinted snapshot, qualify it, and identify the implementation as Gen2 + Gen1 coexistence. The startup and BFCache probes recognize Gen2 button tags, and semantic dialog observation recognizes Gen2 popovers.

## Sources and evidence

- [Published package](https://www.npmjs.com/package/@adobe/spectrum-wc): pinned beta.3 tarball and local lockfile are the implementation authority.
- [Adobe migration reference](https://github.com/adobe/spectrum-web-components/blob/main/gen2/packages/ai/skills/gen2-migration/SKILL.md): supported coexistence and theme setup.
- [Component migration guides](https://github.com/adobe/spectrum-web-components/tree/main/gen2/packages/swc/components): official API changes; retrieved copies retained in `artifacts/spectrum-wc-migration/upstream` and checked against installed beta declarations/runtime.
- [Previous Spectrum theme rationale](theme-refresh-spectrum-fluent.md): design-data palette, typography and documented adaptations.

Verification passed in Chromium, Firefox and WebKit: 54 primary showcase checks, 12 supplementary checks, three focused Gen2 API scenarios, and three Spectrum-inspired theme export/re-import tests covering light and dark appearances. Native and docs production builds, theme-catalogue validation and the blocking-time metrics unit check passed. Matched-viewport final screenshots were visually reviewed. Source hashes and detailed evidence paths are recorded in `artifacts/spectrum-wc-migration/verification.json`.

The first supplementary WebKit pass exposed a locator that chose an unrendered authored Gen1 combobox option instead of its visible popup option. The issue reproduced in the frozen Gen1 reference and the migrated implementation; targeting the visible option fixes the test, and all three final supplementary suites pass. No application workaround was added.

Preservation checks confirm that 81 frozen implementation assets and 423 prior performance acquisition files are unchanged. Other theme definitions are unchanged from the pre-migration snapshot. Fresh performance profiling is a separate next campaign, not a completed check in this implementation pass.
