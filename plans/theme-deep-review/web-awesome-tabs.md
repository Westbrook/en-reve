# Web Awesome 3.13 default tabs: source correction

The dated review baseline is October 3, 2026, En Reve `11edea37a68413869bae98fc729e13f5f0e3216c`. The canonical source remains installed `@awesome.me/webawesome` **3.13.0**, Default theme, Default palette and blue brand. The [current official Tab Group docs](https://webawesome.com/docs/components/tab-group/) explain public placement and scroll behavior; exact values below come from the pinned distributed source, not the moving website version.

| Feature | Pinned source | Dated baseline gap | Implementation |
| --- | --- | --- | --- |
| Active border | Group styles line 7 and 100–103: brand-fill-loud = blue50 `#0071ec` in both appearances | Both public component pin and companion fallback use action-text (`#0053c0` / `#6eb3ff`) | Separate exact source indicator token in both appearances; preserve the public `--en-tab-indicator-color` override |
| Enabled active label | Tab styles `[active]:not([disabled])` uses brand-on-quiet: blue40 `#0053c0` in light, blue60 `#3e96ff` in dark | Selected companion fallback and component pin use action-text, leaving dark ink at `#6eb3ff` | Independent typed selected-color token drives both the selectedColor role and component.tab.selected-color pin; `--en-tab-selected-color` remains authoritative |
| Rail and gap | Lines 8–12, 22–25 and 84–88: neutral-fill-normal, `.125rem` track, no gap | Generic 1px neutral-line rail and `space.1` gap | Zero gap, source `.125rem` track, light `#e4e5e9` / dark `#2f323f`, on custom `tab-list` Part and native `.en-tab-list` |
| Active overlap | Lines 100–103: negative source track width | Fixed `-1px` companion overlap | Track-width-relative negative overlap on both logical axes |
| Panel inset | Lines 105–106 and 193–194: `--wa-space-xl` = `2rem`; horizontal block both sides, vertical inline both sides | Generic 16px block padding; existing finite panel presenter supports only the start inset | Optional end/inline roles supply bilateral 2rem/zero cross-axis padding; custom and documented immediate native composition |
| Indicator mechanism | Render function lines 261–322 contains no indicator element; active state is assigned to tabs | Earlier audit claimed a separately moving indicator adaptation | Correct the rationale: the pinned visible indicator is the active tab border; dormant `.indicator` CSS does not establish animation |

`web-awesome-tabs-update.py` adds only this theme's typed tab source values, optional recipes, the indicator/selected-color pins, and reference record. For serial definition updates, apply its idempotent `update(definition)` **after** the older `web-awesome-update.py`, whose generic tab rule otherwise replaces the refinement. The final definition pins are the effective inputs for `component.tab.indicator-color` and `component.tab.selected-color`. Global action-text is unchanged. The old WA-only hover-color pin is removed because source hover retains currentColor; the finite renderer then keeps ordinary/selected ink while explicit public hover overrides remain available.

Enabled selected label ink is an exact default-source mapping in both appearances, separate from the indicator. `dist/chunks/chunk.R2GHHEHL.js` selects `--wa-color-brand-on-quiet` for `[active]:not([disabled])`; Default theme selects brand40/brand60, and the blue brand resolves those to `#0053c0`/`#3e96ff`. The existing selected-disabled contract and authored hover overrides are preserved.

The finite renderer uses documented `en-tabs::part(tab-list)`, `en-tab::part(base)` and `en-tab-panel::part(base)` surfaces. Native vertical panels are immediate `.en-tabs[data-orientation="vertical"] > .en-tab-panel` children, with the list's ordinary vertical orientation attribute. Every CSS rule remains behind `ctx.style`; source paint stays inside `forced-colors: none`, leaving system colors authoritative. Logical edges preserve RTL. Local tab paint and control inline-padding hooks still take precedence; full child themes are isolated by the common emitter.

The rail and matching active border/negative overlap also retain the source `.5px` minimum and half-CSS-pixel rounding of the `.125rem` input, including fractional root font sizes. Existing 1em/1.5em tab content insets remain represented by rem roles at the source default 16px size. Source placement variants, side-by-side vertical group layout, overflow scroll controls, source focus details and native consumer-owned interactions remain explicit adaptations. This focused correction adds no icons, copied artwork, separate indicator element or motion engine.

The accompanying source-backed regression checks cover both appearances, native/custom surfaces, rail/active border/gap/panel geometry, independent selected-label ink including source-stable hover, RTL, local indicator/selected-color/inline-padding override precedence and nested full-theme isolation. Qualification evidence is recorded in [verification-20261003.json](verification-20261003.json); consult its candidate-specific receipts for commands, results and limits. Historical Union09 evidence applies only to its recorded candidate.

Pinned local files are under `/Users/westbrook/Documents/repos/design-system/showcases/web-awesome/node_modules/@awesome.me/webawesome`:

| File | SHA256 |
| --- | --- |
| `package.json` | `4988077fedd0d45484e916648b4b645fb70c2531647016a5f9952ffacd8a7a5f` |
| `dist/chunks/chunk.NMA53WZH.js` | `6b257c2f7c18d0d752c7d61545f4b42d6bd36567b3ea0ad67719a216da5b13d6` |
| `dist/chunks/chunk.3H27LNYN.js` | `f7074c17a2c2eb1d86af09ebab84ff1157507c920177486b148430b224aa1d48` |
| `dist/chunks/chunk.R2GHHEHL.js` | `6b716699a2c917c2e838e04b36edd9fe996ef746cc1dca9d04dc1ba9ee36318a` |
| `dist/styles/themes/default.css` | `e19fff39b8c90f37d39e76535313e6da23f02cf2ca3b0e67407e17022fa6da50` |
| `dist/styles/color/palettes/default.css` | `7fd5825d4872d2085ecce86776d3d5383c606882d5667f6f3105f04b15ccd69e` |
| `dist/styles/color/variants/neutral.css` | `c73db6e0ac8b017f001ff32388f9c88bf404c3096a491db208951dee5bfc20aa` |
| `dist/styles/color/variants/brand.css` | `a2829831037fadd78d69a39307a3a0245a12e26b7919481e08cf2e0fee1a2d92` |
