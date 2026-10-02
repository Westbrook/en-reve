# Fluent 2 website-inspired theme re-audit

Reviewed September 20, 2026. This report supersedes the Fluent-specific visual direction in `theme-refresh-spectrum-fluent.md`. It covers only `fluent.light.json` and `fluent.dark.json`; the other seven themes are unchanged by this correction.

The primary inspiration is the actual [Fluent 2 website](https://fluent2.microsoft.design/), including its editorial typography, rose selection palette, neutral calls to action, spacious tiles and differentiated corners. The former generic blue product theme did not capture that website. Fluent UI React v9 is an implementation of Fluent 2; this revision does not characterize it as Fluent 1.

## Source authority and reproducible evidence

The order of authority is (1) rendered website consumers and their current assets, (2) official Fluent 2 foundations and component guidance for families the website does not demonstrate, and (3) linked implementation source for precise supplemental anatomy. A declared token is not proof that a page consumes it. Website styling, product guidance and our adaptations are distinguished below.

| Evidence | Identity | Local receipt |
| --- | --- | --- |
| Shared website CSS | [accessibility.C8FxN6HQ.css](https://fluent2websitecdn.azureedge.net/cdn/accessibility.C8FxN6HQ.css), SHA-256 `5f485c0050719e807c5f5465787f50cb77388cc1244df040b9a7da2916898b31` | `artifacts/fluent2-refresh/source/site.css`, `manifest.json` |
| Homepage/Arbutus styling | [index.Brk4meEG.css](https://fluent2websitecdn.azureedge.net/cdn/index.Brk4meEG.css), SHA-256 `20b7e769bfe1e91bf4e9b4e40f175ec4852d657676d920ba99c432c220226020` | `artifacts/fluent2-refresh/source/home.css` |
| Actual site sign-in CTA | [LoginButton.DsFTzB3B.js](https://fluent2websitecdn.azureedge.net/cdn/LoginButton.DsFTzB3B.js), SHA-256 `e9aeaf7a5bc0f951d5820cbc45a5a50a204f2f4bb54ac6c8d42d1f4fc2246710` | `artifacts/fluent2-refresh/source/LoginButton.DsFTzB3B.js`, `cta-source.json` |
| Computed typography, selected navigation and opened Search | [Typography page](https://fluent2.microsoft.design/typography), light/dark, 1280 × 720, September 20, 2026 | `artifacts/fluent2-refresh/source/computed-typography-search.json` |
| Supplemental product implementation | `@fluentui/react-theme` 9.2.2 / `@fluentui/tokens` 1.0.0-alpha.24, [commit 2dd2a9a](https://github.com/microsoft/fluentui/tree/2dd2a9a96210919c35b210a1aa8e873ab67dbada/packages/tokens) | Precise supplemental status, focus and control findings retained in prior research; no longer the headline visual identity |

The site also links Web Components reference implementations. Those are a separate secondary source for this Web Components library; a React implementation alone is not sufficient to assert parity across platforms. The [Web Components audit](theme-refresh-fluent2-web-components.md) records direct light/dark inspection of the supplied Combobox Storybook and pinned source from commit `babf26015958505fc6fc0216724f2f61244f829c` (package 3.1.2); the deployed Storybook version is not established. It confirms simultaneous full focus contour and bottom accent, and distinguishes checkmark selection from active-row border treatment. This website has no single package version that describes all its branded styling; dated asset hashes are the reproducible source identity.

## The visual change

| Role | Light | Dark | Mapping |
| --- | --- | --- | --- |
| Page/surface canvas | `#ffffff` | `#1f1f1f` | Website Background9, confirmed on rendered body |
| Raised surface | `#ffffff` | `#292929` | Website Background1 |
| Subtle surface | `#fafafa` | `#1a1a1a` | Website Background14 |
| Everyday editorial text | `#1b1a19` | `#e4e5e6` | Rendered subtitle-paragraph, 16/24 |
| Muted text | `#616161` | `#adadad` | Website Foreground3 |
| Brand accent | `#c43857` | `#c43857` | Arbutus identity; separate from CTA fill |
| Primary action rest / hover / pressed | `#242424` / `#424242` / `#616161` | `#ffffff` / `#d6d6d6` / `#adadad` | Actual site CTA foreground token sequence used as fill |
| Primary action ink | `#ffffff` | `#292929` | Actual CTA Background1 |
| Selected fill / ink | `#fad6dc` / `#a63f50` | `#3d151c` / `#fd9fb0` | Rendered current-page sidebar selection |
| Hover fill / ink | `#ffeff6` / `#af4e63` | `#260b0f` / `#db7488` | Website dropdown/navigation treatment |
| Control boundary | `#af4e63` | `#db7488` | Actual website dropdown Foreground8 |
| Canonical article link | `#1b1a19` | `#e4e5e6` | Explicit article-link rule; underline remains the host component's responsibility |

Some resource anchors appeared lavender in the live dark website. The canonical article stylesheet explicitly colors content links with the editorial foreground; incidental browser-default anchor colors and an unused `--link-color` declaration were not promoted into the theme's brand identity.

The typography now follows the website's measured hierarchy: everyday body 16/24, small heading 24/32, medium heading 32/40, and large heading 68/92, with heading weight 600. The website's introductory paragraphs are 20/28 and its desktop root can reach 18px; those are distinct roles. We retain a 16px host rem basis and map the everyday 16/24 role to body rather than enlarging every component. Compact controls remain 14/20. Metadata is 14/20. Segoe UI uses an explicit fallback stack; `system-ui` represents the platform generic. Font assets are not bundled or downloaded by the recipe.

The code stack is Cascadia Code, Menlo, monospace. The website distinguishes Cascadia code blocks from Menlo inline code, while the current theme has one code family role. Exact heading tracking, separate lead text, responsive root sizing, and separate inline/block code typography remain disclosed differences.

## Component decisions and adaptations

| Family | Implemented with the current API | Source boundary or adaptation |
| --- | --- | --- |
| Buttons | Neutral semantic action colors; 12px radius; 5px × 12px control padding; 8px gap; 14/20 semibold UI; existing compact 32px sizing | Matches the actual site CTA source. No blanket button background/text pins were added: secondary, ghost and danger variants retain their distinctions. Source focus is a 2px outline with 2px offset and CTA transition is 100ms easy-ease. |
| Dropdown/options | 8px popup/control corner; rose boundary and hover/selection; 4px row corner; 12px horizontal and 6px vertical row padding; selected weight 600; opaque popup; exact site popup shadow `0 8px 16px rgba(0,0,0,.14)` | Site list reserves 32px leading space and shifts hover content. Host symmetric row padding supports its check/shortcut anatomy. Site alpha backgrounds plus 5px blur become opaque raised surfaces because backdrop filtering is outside the typed contract. The active row retains an independent contour rather than confusing keyboard active with selected. |
| Cards/surfaces | 22px container corners, 32px panel/section spacing, raised background; ordinary surface text uses `#242424` / white | Uses the recurring relaxed Arbutus tile. Source image corners and some news panels are 12px and 24px respectively, not universal card defaults. Source hover elevation, animated conic border and inset accents need scoped CSS/Parts. |
| Dialog | 6px radius; two-layer consumed Search modal shadow: `0 0 8px` plus `0 32px 64px`, light alpha .12/.14 and dark .24/.28 | Corrected after opening the live Search modal. Generic default inset-highlight shadow declarations were overridden and are not the modal's consumed styling. Host dialog keeps a neutral raised surface rather than Algolia Search's light `#f0f0f0` / dark `#15172a`; this is an explicit generalization. Search backdrop is .4/.5 black; host overlay behavior remains separate. |
| Inputs and focus | Raised input fill; explicit `#242424` / white input ink; rose family accent; preserved field focus anatomy and semantic validation | The website dropdown and search box are different input treatments. The host field behavior uses the linked Web Component’s confirmed full contour plus bottom accent where no ordinary website text field establishes a universal rule. Independent stroke layers, field geometry and exact family timing remain adaptations. Live Search's inset 2px rose form stroke is not assigned as a universal modal shadow or field style. |
| Toast | Neutral raised surface and explicit neutral text, independent semantic icon colors; 4px corner, 12px inset, 16px region gap; structured shadow8 | Product guidance/implementation fallback, not a claim that the docs site displays this exact toast. Timing, announcements, action persistence and stacking limits remain component/application behavior. |
| Editor chips | Source neutral search-key/tag fill `#ebebeb` / `#333333`, muted ink; website rose hover/pressed fills; transparent border; 4px corner | Host editor-token anatomy and its 32px minimum are a reusable-component adaptation, not a replica of the search keyboard key. |
| Tabs and navigation | 3px tab indicator; selected semantic fill/ink available to consuming families | Option selection is not navigation styling. Navigation hover/current currently share hooks, and tabs have state/scope limits. Exact source current-page indicator/layout and neutral-versus-rose tab state treatment cannot be claimed from global color pins alone. |
| Elevation and motion | Exact multi-layer overlay/dialog/toast arrays in per-mode trusted baselines; popup shadow separately scoped; existing 100/200/300ms ladder and popup 200/150ms retained | Only the CTA's 100ms curve is directly established by its source. Other family timings remain deliberate adaptations; the foundation prose does not prescribe those exact numbers. |

The [shapes guidance](https://fluent2.microsoft.design/shapes) describes product defaults of 4px, smaller 2px, and larger 8px/12px corners. It does not supersede the observed website's 12px CTA and 22px tiles. Existing small/medium/large radius pins can already express nonlinear component size scales.

The [color guidance](https://fluent2.microsoft.design/color) supports neutral-first hierarchy and separate brand/shared meanings. The [button guidance](https://fluent2.microsoft.design/components/web/react/core/button/usage) supports maintaining primary, secondary and subtle hierarchy. [Input](https://fluent2.microsoft.design/components/web/react/core/input/usage) and [field guidance](https://fluent2.microsoft.design/components/web/react/core/field/usage) describe labels, helpers and validation that a palette must not erase. [Toast guidance](https://fluent2.microsoft.design/components/web/react/core/toast/usage) covers behavior as well as appearance; those behavioral requirements cannot be implemented by theme tokens.

Two source disagreements deserve preservation. The product typography page's subtitle1 20/26 differs from the React package's 20/28; neither should silently replace the website's measured everyday 16/24. The [elevation article](https://fluent2.microsoft.design/elevation) publishes high-ramp equations that differ from the website's exported and actually consumed shadow64. The live rendered website wins for this inspiration. The [motion guidance](https://fluent2.microsoft.design/motion) is qualitative, so it is not evidence for universal exact durations or easing coordinates.

## Current API use and validation

The candidate edits use semantic roles for identity, action fill, action text, selection and links independently. Component-level fields are used where the source establishes a narrower role. The trusted per-appearance baseline carries full fallback font arrays, exact size/line-height values, transparent paint and layered shadows; these are current API capabilities, not proposals for future work. The managed candidate contains 118 operations and resolves to 129 pins per appearance.

`theme-refresh-fluent2-base.json` is the exact baseline fragment merged into the Fluent definition. `theme-refresh-fluent2-validation.json` records a fresh pass after the live Search correction: both appearances have zero compilation diagnostics, and export → reopen with that exact baseline → export preserves both resolved tokens and the exported bytes. Compiler diagnostics cover the standard text, muted-text, on-brand and action-state contrast pairs. Additional checks cover links on base/subtle/selected surfaces, editor chips at rest/hover/pressed, and neutral toast text plus semantic icons. The smallest additional ordinary-text ratio is 4.6352:1 in light and 5.6301:1 in dark; all additional icons exceed 3:1.

These are token/context checks, not a certification of every rendered component, interaction, native picker, viewport, focus state or assistive-technology flow. The computed source receipt proves the reference measurements, while application rendering remains a separate review. No source CSS, font assets or behavior was injected into components by these recipes.

## Recommendations before the first official API release

1. **Record provenance at the consumed role.** Preserve source URL, asset hash or commit, selector, appearance, viewport, computed value and whether a role is observed, product guidance or adaptation. This modal correction demonstrates why token declarations alone are insufficient. Record conflicts instead of silently combining incompatible sources or platforms.
2. **Support bounded family/state recipes and companion CSS.** Gradient borders, alpha materials with backdrop blur, tracking, responsive type and tile hover effects already fit scoped CSS/Parts better than arbitrary color strings. A documented companion contract should state scope, reset behavior, assets, reduced-motion treatment and roundtrip expectations. Avoid unbounded CSS in typed values and blanket component paints that flatten variants.
3. **Refine typography roles.** Add heading tracking and separate lead/body and inline/block code roles when real consumers justify them. Independent navigation versus control line-height is useful for the site's 14/19 versus 14/20. Font stacks and exact ratios already work; loading fonts remains an explicit application concern.
4. **Separate family state and geometry.** Input-specific ordinary/hover/validation border paint and edge width would express bottom-accent product anatomy without changing every border. Navigation needs separate hover/current treatment and an optional current indicator. Card-specific shadow and hover roles would avoid coupling a tile's elevation and padding to every generic surface.
5. **Add a menu-specific width contract.** [Menu guidance](https://fluent2.microsoft.design/components/web/react/core/menu/usage) caps menus at 300px and wraps long labels. Current scoped overlay CSS can express that maximum, while the typed option-list has no dedicated maximum-width role. Do not shrink global form/dialog layout tokens to force menus into the source width. [Popover guidance](https://fluent2.microsoft.design/components/web/react/core/popover/usage) has a different sizing relationship.
6. **Validate rendered states and contexts.** Cover focus, selected/hover/pressed combinations, all button variants, alpha compositing, overlay stacking, forced colors and reduced motion. Add 200% text enlargement and 320px reflow reviews alongside contrast. Source accessibility intentions do not automatically transfer to an adaptation.
7. **Keep composition and behavior outside theme promises.** Responsive drawers, navigation hierarchy, tab overflow, toast timeouts/announcements and touch-target behavior require component/application review. Family motion hooks are useful only with explicit reduced-motion handling and clear ownership.

Further API details are in [the focused findings](theme-refresh-fluent2-api-findings.md) and [the Web Components audit](theme-refresh-fluent2-web-components.md). The most useful next changes are scoped expressiveness and stronger provenance/verification, not additional global knobs that make unrelated component families converge.
