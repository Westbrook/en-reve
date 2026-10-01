# Spectrum WC showcase

This isolated app uses **`@adobe/spectrum-wc` 2.0.0-beta.3**, pinned to the npm `latest` release inspected on September 22, 2026. It follows Adobe's supported Gen1/Gen2 coexistence model because that release does not yet ship the entire form/dialog catalogue. It is not a pure Gen2 benchmark.

| Delivery | Components used |
| --- | --- |
| Gen2, individual `@adobe/spectrum-wc/components/.../swc-*.js` registrations | Button, action button, avatar, badge, accordion/item, tabs/tab/panel, progress bar, standalone help popovers |
| Gen2 native CSS | Native `<a>` with `link.css`; `swc.css` light/medium theme and tokens |
| Retained Gen1 1.12.2 | Field label, textfield/textarea, checkbox, switch, picker, menu/menu item, combobox, radio/group, slider, number field, color field, dialog/overlay, menu popover and overlay-trigger, Spectrum Two theme |
| Application/native HTML | Sixteen section containers, grid, authored artwork/chart, native date input, dialog-as-drawer fallback |

The Gen2 card is a media/title/description pattern, not a generic padded section container. The existing application-owned card wrappers remain. Menu popovers retain Gen1's menu composition; the standalone descriptive popovers use Gen2's native popover lifecycle and automatic `for` trigger wiring. The checkbox/picker internal imports may also register Gen1 dependencies; pruning direct dependencies does not imply those transitive components disappeared.

Gen2 uses `tab-id`/`accessible-label`, accordion label slots, avatar `alt`, progress `value` and label slots. The shared showcase content and business actions are unchanged. Typography uses the shipped Adobe Clean font stack and locally available fallbacks; no proprietary font is downloaded or bundled.

```sh
npm ci --workspaces=false
npm run build
npm run preview
```

Open [the local showcase](http://127.0.0.1:4516/?progress-report).

## Build and comparison provenance

The beta's `swc.css` contains an incomplete nested `@property --swc-prompt-field-brand-color` declaration. Lightning CSS rejects it. This sub-project uses pinned esbuild 0.28.2 for CSS minification, preserving Adobe's supplied stylesheet and leaving JavaScript minification to Vite. No vendor patches, root dependency changes or CSS imitation of missing components are used.

`dist/build-metadata.json` records installed dependency versions and the lockfile digest; the isolation plugin rejects bundles resolved outside this sub-project and the dependency-free shared fixtures. Performance startup/BFCache probes recognize `swc-button`; dialog observation also recognizes `swc-popover`.

**Existing performance tables still describe the frozen 1.12.2 Gen1 implementation.** This migration changes the current build only. A future measured campaign must prepare and qualify a fresh snapshot and label it Gen2 + Gen1 coexistence; historical values must not be relabeled as beta.3 results.

See [the migration and theme review](../../plans/spectrum-wc-gen2-migration.md) for source references and verification evidence.
