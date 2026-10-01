# @en-reve/styles

Reusable, token-driven styles for library templates and independently composed patterns. This package has no state, custom-element registration, global reset, network work or token-generation runtime. Version `0.1.0` is private and MIT licensed.

## CSS source authoring

Typography and surface styles are authored in `src/css/`, with an explicit `css-authoring.json` manifest. The normal build generates Lit adapters and portable CSS from the same source. Edit the CSS source, not `src/generated/`. `npm run watch -w @en-reve/styles` rebuilds package outputs during development. The [authoring guide](../../tooling/css-authoring/README.md) documents the restricted recipe syntax, validation, watch recovery and consumer checks. Existing public imports and runtime theme overrides are preserved.

## JavaScript and plain CSS

Use explicit `.js` subpaths for modular ESM/import-map consumption:

```ts
import { foundationStyles, inlineHostStyles } from '@en-reve/styles/foundations.js';
import { buttonStyles } from '@en-reve/styles/buttons.js';
import { activityStyles } from '@en-reve/styles/activity.js';

// A Lit component's static styles:
// [foundationStyles, inlineHostStyles, buttonStyles, activityStyles]
```

Button and link leaves share authored fragments with the existing `controlStyles` aggregate. The aggregate retains its rule order and broader native-control contract. Choose a leaf for an isolated action/navigation component; neither leaf imports field, picker, choice, range or form styles. SSR keeps inline static styles before JavaScript; this is source decomposition, not an external stylesheet loader.

Style exports below are Lit `CSSResult` values; `overlayResponsiveQuery` is a generated query string. The build generates one matching plain `.css` file per family from the same source. There are no separate handwritten CSS copies. Import only the required families; no full stylesheet bundle is necessary.

| Entry | Exports | Template/class contract |
| --- | --- | --- |
| `foundations.js` / `.css` | `foundationStyles`, `typographyStyles`; JS-only `sizeStyles`, `blockHostStyles`, `inlineHostStyles`, `iconHostStyles` | `:host` or explicit `.en-foundation`; `.en-body`, `.en-prose`, `.en-heading-small/medium/large`, `.en-metadata`, `.en-data`, `.en-sr-only`, `.en-break`, `.en-truncate`. |
| `typography.js` / `.css` | `typographyStyles` | Public opt-in `.en-body`, `.en-prose`, `.en-heading-small`, `.en-heading-medium`, `.en-heading-large`, `.en-metadata`, `.en-data`; also reexported by foundations for compatibility. |
| `buttons.js` / `.css` | `buttonStyles` | Native `.en-button` actions, text/icon-only modes, variants, disabled/busy paint, focus and preference states. Compose with foundation/host styles and optional activity styles. |
| `links.js` / `.css` | `linkStyles` | Native `.en-link` anchors, focus, disabled and forced-color paint. |
| `controls.js` / `.css` | `controlStyles`, `formStyles`, `selectEnhancementStyles` | `.en-button`, `.en-link`, `.en-input`, `.en-textarea`, `.en-select`, `.en-control`, `.en-input-group`, `.en-checkbox`, `.en-radio`, `.en-switch`, `.en-range`, `.en-range-row`; `.en-field`, `.en-label`, `.en-description`, `.en-error`, `.en-choice`, `.en-choice-content`, `.en-fieldset`, `.en-legend`, `.en-form-stack`, `.en-validation-summary`. |
| `commands.js` / `.css` | `menuStyles`, `menuItemStyles`, `toolbarStyles`, `commandPaletteStyles` | `.en-menu`, `.en-menu-item` with label/prefix/suffix/shortcut content, `.en-toolbar`, `.en-command-palette`, `.en-command-palette-content/input`, `.en-command-list`, `.en-command-option`, `.en-command-label/shortcut/status`. |
| `selection.js` / `.css` | `selectionStyles` | `.en-option`, `.en-listbox`, `.en-tree`, `.en-tree-group`, `.en-choice-group`, `.en-rating`, `.en-rating-item`, `.en-toolbar`, `.en-segmented`, `.en-tabs`, `.en-tab-list`, `.en-tab`, `.en-tab-panel`, `.en-accordion`, `.en-accordion-item`, `.en-accordion-trigger`, `.en-accordion-panel`. |
| `surfaces.js` / `.css` | `surfaceStyles`, `layoutStyles` | `.en-panel`, `.en-card`, `.en-card__header/body/footer`, `.en-inset-surface`, `.en-divider`; `.en-stack`, `.en-cluster`, `.en-grid`, `.en-scroll-region`, `.en-query-region`, `.en-split-view`, `.en-split-pane`, `.en-split-handle`, `.en-split-separator`, `.en-split-grip`. |
| `overlays.js` / `.css` | `overlayStyles`, `overlayResponsiveQuery` | Native `.en-dialog`, `.en-drawer`, `.en-popover`, `.en-tooltip`; `.en-overlay-header/body/footer/close`. |
| `feedback.js` / `.css` | `feedbackStyles`, `mediaStyles`, `swatchStyles`; separately reusable `activityStyles` (already included in `feedbackStyles`) | `.en-alert`, `.en-alert__icon/content/close`, `.en-badge`, `.en-progress`, `.en-progress-track/fill`, `.en-spinner`, `.en-skeleton`; `.en-avatar`, `.en-avatar__image/fallback`, `.en-icon`, `.en-media`; `.en-swatch` and its sample/control/label/reference/status parts. |
| `activity.js` / `.css` | `activityStyles` | Small leaf entry for `.en-spinner` and `.en-skeleton`, without fetching alert/media styles. |
| `navigation.js` / `.css` | `navigationStyles`; JS-only `navigationHostStyles`, `breadcrumbHostStyles` | Public native `.en-section-nav`, optional `.en-section-nav--sticky`, `.en-navigation-link`, `.en-breadcrumbs`, `.en-breadcrumbs__list/item/label/separator`, `.en-skip-link`, and `.en-navigation-target`. |
| `recipes.js` / `.css` | `recipeStyles` | Native `.en-recipe-table`, `.en-recipe-breadcrumbs`, `.en-recipe-description-list`, `.en-recipe-figure`, `.en-recipe-quote`, `.en-recipe-disclosure`. |
| `metadata.js` | `styleFamilies`, `styleOverrideNames`, `styleStateProperties` | Finite family and custom-property registry, no CSS adoption or side effects. |

The typography and navigation classes documented below are supported helpers for consumer-owned semantic HTML. Other component class bindings are private implementation coordination between matching templates and styles. Consumers customize a delivered component through its documented CSS Parts and `--en-*` properties; these classes, shadow ancestry and element tags are not additional component APIs. Reusing a style family in a new pattern requires supplying the corresponding template/semantic contract. Styles alone do not implement an ARIA widget, form association, accessible name or interaction.

Plain CSS adopts the same scope as its containing stylesheet: in a shadow root it styles only that root; imported in a document, its explicit `.en-*` recipe classes opt in. `foundationStyles` affects only `:host` or an explicitly opted-in `.en-foundation` region. It never sets `html`/`body` styles. Host sizing is deliberately separate: choose `blockHostStyles` for block surfaces or `inlineHostStyles` for inline controls. The combined plain foundations file cannot choose a custom element's display type for it.

## Numeric input typography

Numeric input content uses `font-variant-numeric: tabular-nums` after its font
shorthand. This covers number, date/time and telephone controls, the time-field
text editor, and text fields/textareas with numeric, decimal or telephone
`inputmode` values. Color-channel editors, the color picker's HEX field and
pagination's page-number entry follow the same rule. Ordinary prose inputs keep
their normal typography. Consumers can override the property through the
control's documented CSS Part. Equal-width digits depend on the chosen font
supporting tabular figures; this does not reserve space for additional digits
or equalize letters.

## Native navigation helpers

Import `navigationStyles` from `@en-reve/styles/navigation.js` for a Lit stylesheet, or load `@en-reve/styles/navigation.css` for native document HTML. Neither entry registers elements, observes layout, changes focus/history, or enables animated scrolling. Supply real anchors, a named navigation landmark, and a semantic breadcrumb list; decorative separators should be hidden from assistive technology. The legacy `.en-recipe-breadcrumbs` recipe retains its shared list layout.

`EnNavigation` internally adopts `[foundationStyles, blockHostStyles, navigationStyles, navigationHostStyles]`; consumers do not need to adopt these styles themselves. The JS-only `navigationHostStyles` moves the section navigation's outer `space.6` block margins to its host and clears the inner navigation's margins. The host owns sticky positioning when `[sticky]` is present, using the same measured position, offset and layer inputs below; render the inner native recipe without its sticky modifier. Existing navigation colors, gap, radius and public CSS Parts remain customizable. The plain `navigation.css` generator exports only `navigationStyles`, so host and slot rules never enter the native document stylesheet.

`EnNavigation` accepts native anchors through its ordinary default slot. Linked anchors inherit the shared font and receive size/density-aware padding, target floors, rounded current/hover surfaces and keyboard focus. Their inline formatting preserves authored text spaces and rich descendants; wrapped labels grow naturally. An anchor without `href` remains plain content. Display rules exclude hidden anchors, preserving native `hidden` and `hidden="until-found"` behavior. The internal navigation landmark exposes `base`; anchors and their descendants belong to the application and are customized with ordinary CSS, not `::part(link)` or `::part(label)`. Native destinations, attributes and `aria-current` remain application-owned.

`EnBreadcrumbs` adopts `[foundationStyles, blockHostStyles, navigationStyles, breadcrumbHostStyles]`. Its directly slotted native anchors and plain-label spans inherit the tokenized navigation font, with shared current-state weight and colors. Only anchors with `href` receive link decoration, target floors and keyboard focus; an anchor without `href` is plain content. Ordinary `hidden` content also hides its internal list item. Applications own the original nodes, native attributes and rich descendants; application CSS can customize these light-DOM nodes directly. Only the internal `base`, `list`, `item` and `separator` are CSS Parts, so `::part(link)` and `::part(label)` do not address slotted content. The JS-only companion does not alter the native recipe, section navigation or document styles.

Section links wrap, retain visible focus and allow long labels. `aria-current="page"` or `"location"` identifies the current destination and receives the strong weight. Breadcrumb anchors remain visibly underlined; an unlinked current label uses `.en-breadcrumbs__label`. `.en-skip-link` stays offscreen until focused, then appears above the navigation layer. A `.en-navigation-target` may use `tabindex="-1"` when native fragment focus should land on a noninteractive heading/region.

Sticky behavior is opt-in through `.en-section-nav--sticky`. It remains in normal flow until `--en-navigation-position: sticky` is supplied after measurement. The consuming root owns `--en-navigation-height`, `--en-navigation-offset`, `--en-navigation-position` and `--en-navigation-z-index`; these are mechanical inputs and are never cleared by theme resets. Targets consume `height + offset + space.6` as their block-start scroll margin. With a known static height, an author can supply the values directly; optional behavior can measure/update them. These styles do not read their own measured height, avoiding a measurement feedback loop.

The themed override points are `--en-navigation-background`, `--en-navigation-color`, `--en-navigation-active-background`, `--en-navigation-active-color`, `--en-navigation-border-color`, `--en-navigation-gap` and `--en-navigation-link-radius`. They retain shared semantic fallbacks and participate in full-theme resets. The public classes also allow ordinary CSS customization without adding a custom property for every declaration. Standalone native recipes use token defaults; combine with the foundation's explicit size context when size selection is needed. Typography, density-sensitive inline padding, target floors, forced colors and focus reuse the shared system.

## Public typography helpers

Load only typography when the surrounding application owns its baseline. Copy
the package's exported `typography.css` to an application stylesheet URL:

```html
<link rel="stylesheet" href="/styles/typography.css">
```

Use the same native link approach for `navigation.css` and other plain CSS
families. Stylesheet URLs are application-owned paths; JavaScript import maps
do not resolve `href`. Styles can load before JavaScript or hydration.

For a shadow root, adopt the same rules as a Lit `CSSResult`:

```ts
import { typographyStyles } from '@en-reve/styles/typography.js';
// static styles = [typographyStyles];
```

The standalone entry does not adopt the foundation baseline, change controls or register an element. Existing `typographyStyles` imports from `foundations.js` and the combined `foundations.css` continue to work; choose the leaf or the combined stylesheet to avoid duplicate adoption.

| Class | Purpose |
| --- | --- |
| `.en-body` | Body text on one element, without a prescribed line measure or descendant spacing. |
| `.en-heading-small`, `.en-heading-medium`, `.en-heading-large` | Visual heading scales, independent of HTML heading level. |
| `.en-metadata` | Supporting metadata with the metadata font and muted text token. |
| `.en-data` | Data typography with tabular numerals. |
| `.en-prose` | An opted-in body-text region with a readable maximum measure and paragraph/list rhythm. `--en-prose-max-inline-size` overrides its measure. |

Each explicit role supplies its complete font family, size, weight and line height, removes its own default margin, and permits long words to wrap. These classes work without a page-wide reset. They do not reset surrounding elements, display, padding, list markers, link decoration, descendant emphasis or focus behavior. `.en-prose` additionally spaces its descendant paragraphs, lists, description lists and blockquotes and sets list indentation; use `.en-body` when layout should own all spacing.

Choose semantic elements from the content, then choose their visual role:

```html
<h2 class="en-heading-small">Sharing settings</h2>
<p class="en-body">Invite people who need access to this project.</p>
<p class="en-metadata">Updated moments ago</p>
```

The `h2` remains a level-two heading regardless of its visual size. A `p` with a heading class remains a paragraph; specimen text may demonstrate a scale without adding a document heading. Arrange roles with layout primitives such as `en-stack` or application layout CSS. These public classes do not expose or style component shadow internals.

Isolated checks cover document and shadow-root adoption, native semantics, text spacing and automatic forced-color adaptation. One platform limitation remains: in the tested WebKit 26.6 engine, changing the document root font size at runtime can leave `rem` text stale inside a fixed-font shadow host. A plain native `2rem` control reproduces it. The verification report records the failed resize expectation separately; this does not establish a failure of browser zoom. See `../../tooling/typography/README.md` for the reproducible check and evidence scope.

## Tokens and customization

### Family geometry

Comparable text controls share a minimum height derived from size, density, typography,
rhythm and interaction targets. Three optional dimensions specialize their geometry:

| Managed token | CSS custom property | Unset fallback |
| --- | --- | --- |
| `component.button.inline-padding` | `--en-button-inline-padding` | Selected `space.control-inline` |
| `component.input.inline-padding` | `--en-input-inline-padding` | Selected `space.control-inline` |
| `component.segmented-control.frame-inset` | `--en-segmented-control-frame-inset` | Rhythmic `space.1` |

Family `--en-button-inline-padding` and `--en-input-inline-padding` values take
precedence over the shared `--en-control-inline-padding` default. The input role covers text, search, date, textarea, select and the number
editor. Icon buttons, number steppers and native color swatches retain their
specialized padding. Invalid text fields compensate their wider border using the
same effective input padding, keeping text stable while padding is available.

`en-button[icon-only]` uses symmetric block-derived insets and equal-sided geometry,
with the shared text-control envelope and icon/spinner dimensions as minimums.
It retains the button radius and hides its accessible label inside the component.
Text-button inline-padding pins do not widen icon-only buttons. The legacy
stepper and overlay-close icon recipes remain independent.

Frame inset means padding **inside** the border. The border width is added when
deriving option height and concentric inner corners. Tightening the frame preserves
the default aligned height floor. A larger inset grows segmented controls only,
even when authored on a shared theme scope. For an intentionally aligned group,
set `--en-control-min-size` on that group to a shared minimum large enough for
the framed options. Wrapped options and enlarged text can grow beyond the minimum.
See [THEME-02 migration and family membership](../../plans/theme-02-cascade-migration.md)
for the complete precedence contract, specialized targets and migration examples.

Full themes leave unpinned component hooks unset (`initial`), so no-attribute medium
and selected small/large defaults continue to work. An explicit pin supplies the
public value across sizes; it is not multiplied again. Alias pins can still follow
rhythm or density. Full child themes clear inherited optional pins; partial scopes
inherit unspecified values. Managed literal menus offer finite rhythm steps;
compatible aliases and code customization remain available.

These rules style the existing native controls and option labels. Every number
stepper/editor and segmented option keeps its individual target and focus
indicator. They add no shadow markup, event contract or layout measurement.

### Option lists and result rows

Combobox results and the progressively enhanced native select share paint rules while
retaining their own semantics, positioning and focus behavior. Their optional managed
roles are `component.option-list.*` and `component.option.*`, mapped to the corresponding
`--en-option-list-*` and `--en-option-*` properties. These styles do not implement an action menu.

List surfaces expose background, color, border-color, radius, padding, shadow,
gap and max-block-size. List-specific settings take precedence over applicable
`--en-overlay-*` fallbacks, so a compact popup theme does not reduce dialog padding.
The height ceiling remains constrained by available viewport space. Adjacent-row
spacing uses the gap setting without replacing native picker display behavior.

Rows expose radius, inline-padding, block-padding, font-weight and selected-font-weight.
Unset row corners derive from the effective list radius minus its padding and border;
asymmetric CSS padding requires an explicit option radius. Unpinned geometry retains
size-aware fallbacks and target floors. Literal pins apply across sizes; aliases can
follow rhythm. The native select retains its own default inline padding, while the
combobox retains the existing input-padding fallback until a row inset is supplied.

Rest, selected, active, hover, pressed and disabled states each have background/color
hooks. A state-specific property refines the existing broad option background/color.
Combined paint priority is disabled > pressed > hover > active > selected > rest;
unset active/pressed slots fall through. Checkmarks and focus contours remain separate
from fill and weight. Native select maps hover/focus-visible to its highlighted row,
and `:active` to pressed activation; it does not promise the combobox's separate active
candidate state. Forced colors use system paint and keep selection/focus cues.

The managed editor permits opacity for option backgrounds and list background/border,
with finite spacing/radius/weight choices and compatible aliases. Text opacity is not
an additional freeform control. Defaults remain unset at full theme boundaries, so
local size selection and partial inheritance keep working. General code-authored
shadow arrays already compile; the managed shadow editor offers finite source presets.

Native picker internals remain browser-controlled when `base-select` is unsupported
or `--en-select-appearance: auto` is supplied. CSS hooks cannot guarantee identical
OS menus. The unrelated legacy `.en-option` recipe is not this delivered picker
contract; future menu/listbox components must adapt these shared rules deliberately.

Authored visual values use semantic tokens from `@en-reve/tokens`. A declaration consumes its public token with the literal default from the lightweight `@en-reve/tokens/defaults.js` map as fallback. This provides a usable initial appearance without installing a document-wide stylesheet. No stylesheet initializes a semantic/default component property on `:host`, which would shadow an inherited application override.

Optional properties fall back to semantic roles at their point of use. `styleOverrideNames` reexports the canonical finite registry from `@en-reve/tokens/overrides.js`, which the token package also uses to reset optional overrides at a full theme boundary. A partial override inherits unspecified properties; a full theme rebase replaces inherited theme pins. The reset does not clear arbitrary consumer-defined properties.

Examples: `--en-button-background`, `--en-control-min-size`, `--en-surface-radius`, `--en-overlay-max-inline-size`, `--en-stack-gap`, `--en-avatar-size`, `--en-progress-color`. Exact names come from the registry, and components document the properties applicable to their public surfaces. An explicit background pin also pins hover/pressed background; consumers wanting distinct state styling can use the component's documented parts and state selectors.

Structural constants such as zero margins, `100%` containment, one full spinner revolution, grid fractions, and the one-pixel screen-reader clipping box are mechanisms rather than visual theme values. Native system colors in forced-colors mode preserve the user's palette. Those constants are not copied token defaults. The only `!important` declarations enforce hidden content and forced-color states across variants; no token defaults use it.

## Size, density and composed geometry

Every visual component defaults to medium without needing a `size` attribute. Explicit `size="small|medium|large"` selects absolute public role variants; `size="inherit"` opts into the ancestor's requested size. Choice descriptors (`en-select-option` and `en-segmented-item`) have no independent size API; their parent sizes the painted choices. An explicitly opted-in native `.en-foundation` region uses `data-size` with the same modes. Nested sizes never multiply. An icon inside a small/large button opts into that context with `size="inherit"`; `iconHostStyles` independently preserves inherited action/status color.

Private selection flags are separate from resolved role values. Each family declares only the finite roles it consumes, recomputing those values from the local theme at each host. This permits an inherited size to cross a full theme rebase without carrying stale dimensions, and avoids repeating a universal role block in every server-rendered shadow root.

Density (`compact`, `comfortable`, `spacious`) remains independent of size. Typography has its own scale; metadata does not shrink below its medium default. Control target floors remain unscaled. Direct component overrides such as `--en-control-min-size` apply across sizes, subject to target floors. Public derived outputs such as `--en-size-control-medium` remain individually pinnable. Changing a base token in a descendant does not automatically recompute inherited derived outputs: resolve and emit a full theme boundary when its dependants must change together.

Action collections use `--en-space-actions` while content rows retain `--en-space-rows`. Button label/icon spacing has its own `--en-space-icon-label`. Prefix/suffix slot boxes use `display: contents`, so missing icons introduce no phantom flex gap. Card/overlay footers, toolbars, choice groups and clusters consume action spacing without making prose and panel content globally dense.

The number-field contract is `.en-number-group` containing `.en-number-decrement`, `.en-number-input` and `.en-number-increment`. One outside boundary encloses the group; inset focus remains visible without clipping, and logical corners work in RTL. Only this custom stepper's number input suppresses native inner spinner controls. Native color inputs use `.en-color-control` with the `.en-input` class.

`--en-radio-selected-color` optionally customizes the checked native radio rim and dot, with `--en-color-action` as the ordinary fallback. It is also exposed as managed `component.radio.selected-color`. Apply it on a radio host or shared theme scope; a full child theme resets it while a partial theme retains unrelated inherited pins. It changes neither unchecked radio borders nor checkbox/switch/range/rating paint. Disabled and forced-color styles keep precedence; the focus contour uses its separate focus role. Consumers should compare the indicator with its actual adjacent interior/surrounding surface, not the foreground of a filled button.

A `.en-range-row` is horizontal by default. Set `data-orientation="vertical"` to stack its native range and optional output or number editor. Only the range uses `writing-mode: vertical-lr` and `direction: rtl`, placing the minimum at the bottom and maximum at the top in both LTR and RTL pages. Labels and number editing retain the surrounding text direction. The template must supply the matching `aria-orientation` on its native range.

The vertical range's length defaults to `--en-size-range-length` (`12rem`) and accepts a scoped `--en-slider-length` override. This length remains independent of density and visual size; native thumb and cross-axis target dimensions retain their shared sizing and coarse-pointer floors. The length cannot shrink below those target floors. `--en-slider-length` participates in full-theme resets. Horizontal ranges continue to fill the available row; their containing layout controls the available length. The editor stays below the vertical range and fits the available inline space without changing its normal text layout.

`selectEnhancementStyles` enhances the native picker only when `appearance: base-select` and `::picker(select)` are supported. Set `--en-select-appearance: auto` to retain the OS picker. As [Chrome's primary documentation](https://developer.chrome.com/blog/a-customizable-select) explains, the customized picker remains inside the browser pane and does not invoke native mobile picker UI. Unsupported engines keep the native select. Option semantics, keyboard interaction and form values stay native.

`overlayResponsiveQuery` derives the default collapse query from the token snapshot. CSS custom properties cannot alter a media query at runtime; an element's explicit `responsiveQuery` is the route to another breakpoint.

Comparable single-line text controls share a minimum block size derived from their UI/input line boxes, block padding, borders, density/override minimum and a complete target inside the segmented frame. Increasing rhythm therefore grows text fields, selects, color fields, number groups, text buttons and single-row segmented controls together. Text surfaces keep automatic height so wrapped labels and multiline content can grow; native color alone receives the corresponding explicit block size because it has no text line box. Icon buttons, checks, badges and other purpose-specific surfaces retain their own geometry.

The frame-and-target budget applies on coarse pointers too: each native segmented option retains its touch block-size floor, including wrapped rows. With the default 16px root and comfortable medium theme, the comparable single-line minimum is 40px at the default rhythm and 50px at a 0.5rem rhythm; coarse-pointer minima are 54px and 62px respectively. This extra coarse height preserves the inner option target rather than counting empty frame padding as a blanket target for every option. It does not claim every target is 44px wide. Existing control minimum/radius/inline-padding overrides and CSS Parts remain available; no new token is introduced.

## State and adapter contracts

- Buttons use `data-variant="primary|secondary|ghost|danger"`; size belongs to the shared host API below. Internal aliases `.en-button--secondary`, `.en-button--quiet`, `.en-button--danger`, `.en-icon-button` support composed controls. Native `disabled` or `aria-disabled="true"` changes appearance; the element must still implement the correct disabled behavior. A loading button can include an `aria-hidden` `.en-spinner` and import `activityStyles` without all feedback styles.
- Text fields deliberately do not treat every untouched native `:invalid` as a displayed error. Styles respond to explicit `aria-invalid="true"`, wrapper `data-invalid`, and the native `:user-invalid` state. Labels, descriptions, errors, input composition and validation timing remain the element's responsibility.
- Checkbox/radio/range controls retain native input behavior. Checkbox and radio paint uses tokenized native-input geometry so their real focus contours are rectangular/circular; checked, indeterminate and disabled states remain distinct. Where the engine exposes a native range thumb, its focus contour follows the circular thumb; other engines retain native range focus. The switch paints a native checkbox with `role="switch"` as a tokenized track/thumb; its checked thumb uses logical insets for RTL. A `.en-choice` must be a correctly associated label or label/control composition so its larger box represents a real clickable target.
- Native radio compositions can import `radioStyles` from `@en-reve/styles/radio.js` and apply `.en-radio` to their input. This smaller stylesheet shares the element's paint, circular focus contour, sizing and forced-color states without loading unrelated controls. Keep an associated label and native group name. Static pages can load the exported `radio.css` with a stylesheet link.
- Selection uses `aria-selected`, `aria-checked`, `aria-disabled`, `data-selected` and `data-active`. Host-based tabs are supported through `:host([role="tab"][aria-selected="true"])`; the visual span inside still receives `.en-tab`. Rating retains its native radios and uses their actual checked/focus state. A selected appearance does not establish focus ownership.
- Stack supports `data-direction="vertical|horizontal"`, `data-gap="small|medium|large"`, `data-wrap`, `data-align="start|center|end|stretch"` and `data-justify="start|center|end|between"`. Direct slot wrappers use `display: contents` so assigned nodes participate in the composition. Focus and DOM order remain unchanged.
- A split view receives two `.en-split-pane` children and a `.en-split-handle` between them. Set `--en-split-ratio` to a numeric fraction, such as `0.5`; pane math subtracts the tokenized separator track before dividing. The separator contains a real `.en-split-grip` span for its public grip part. `data-orientation="vertical"` stacks panes; a vertical split needs a defined available block size for fractional sizing. The element owns value bounds, keyboard/pointer resizing and ARIA orientation/value updates.
- A custom progress fill receives `--en-progress-value` as a percentage. Native `<progress class="en-progress">` is also supported. `--en-progress-value` and `--en-split-ratio` are state inputs and never part of theme resets.
- Alert/badge use `data-variant`; avatar uses the shared host size; skeleton uses `data-shape="text|circle|rectangle"`. An alert must not become an intrusive live region merely because it has alert styling. Skeletons do not replace meaningful loading status. Spinner motion stops under reduced-motion preferences; its host retains perceivable busy status.
- Swatch uses a native copy button with a decorative color sample, a visible label and a selectable CSS reference outside the button. Its persistent polite status region reports clipboard results. `--en-swatch-size` overrides the sample height; the default comes from the shared size scale. Only the actual color fill preserves authored color in forced-colors mode; borders, labels and focus use the system palette. Combine `swatchStyles` with foundations and controls when reusing the native pattern.
- Native dialogs and popovers keep their closed state. Popover/tooltip surfaces use fixed positioning; the element supplies coordinates or an anchor mechanism. Their computed row gap gives the tokenized anchor gap. Drawer placement uses logical `start|end` and physical `left|right|top|bottom` labels through `data-placement`. Focus management, Escape/outside dismissal, modality and viewport collision handling remain behavioral contracts. These styles introduce no global z-index and move no DOM.
- An `.en-inset-surface` can consume `--en-inset-outer-radius`, `--en-inset-distance` and an explicit `--en-inset-child-radius` pin. Its default relationship is `max(0, outer - inset)` for the relevant visible edges. The composition must supply the actual geometric relationship; it is not inferred from arbitrary ancestors.

## Accessibility, performance and verification

Logical properties preserve layout direction; text controls use content-driven minimum sizes rather than fixed heights. Coarse-pointer conditions enlarge relevant control targets without replacing keyboard behavior. Focus uses the real `:focus-visible` state and remains customizable through the component's public part. Forced colors use system colors with native adjustment enabled. The segmented label text span alone suppresses a second forced-color adjustment to avoid Chromium's unreadable text backplate; it still inherits the parent's system foreground over the parent's system surface. Reduced motion suppresses spinner/transition movement without removing state. A `.en-truncate` recipe requires another accessible route to the complete value.

Native semantic recipes require real semantics: table headings/caption, named navigation and lists for breadcrumbs, `figure`/`figcaption`, `dl`/`dt`/`dd`, and `details`/`summary`. The recipe does not add those relationships through CSS. Preserve the list role when using a list-style reset in browser/AT combinations that need explicit semantics.

Build with `npm run build --workspace @en-reve/styles` after the token package. The build type-checks TypeScript and generates plain CSS from the exported CSSResults. Browser fixtures, complete application journeys, rendered contrast/forced-color/zoom checks and visual review belong to the shared verification suite. There are no tests matching CSS strings in this package, and a successful build is not accessibility or visual acceptance evidence.

## Command surfaces

`commands.js` exports independent menu surface, menu-item, toolbar and command-palette fragments. Menu/items compose with foundations and block-host styles. The palette composes with existing dialog/control/overlay styles; the toolbar only groups its consumer-owned buttons. `commands.css` contains the same opt-in native recipe classes. These styles do not establish menu semantics, roving focus, query behavior, modal state or command execution.

Menus and palette results consume the existing `--en-option-list-*` surface/spacing roles and `--en-option-*` row state/geometry roles. Menu popup paint keeps the documented legacy overlay fallbacks. The palette shell uses overlay hooks; its borderless result region has no second popup shadow. Unpinned row radii subtract actual inset and border from their containing result surface; explicit row pins stay independent. Actions have no persistent selected paint: menu native focus and palette `data-active` consume the active hooks, while the adapter owns any ARIA candidate state. Explicit state pins preserve the existing disabled > pressed > hover > active > selected > rest cascade; focus remains visible independently.

Rows retain selected-size control minima and unscaled target floors, with the existing coarse-pointer block-size enhancement. Long labels and optional content can grow and wrap. Empty named menu slots produce no spacing; rich label descendants remain in ordinary inline flow. Toolbars use `--en-space-actions`, support horizontal/vertical orientation and wrap without replacing labels or inventing an overflow menu. Every host still defaults to medium; authored menu-item/button children explicitly use `size="inherit"` when they should follow their parent.

Native popup coordinates and the palette visual-viewport measurements use private `--_en-menu-*` / `--_en-command-viewport-*` inputs. They are mechanical state and are not reset by themes. The menu remains hidden until its controller establishes native-open state and placement; the palette stays a native dialog. Result scrolling preserves inset row focus, and the palette retains an outer scrolling fallback at exceptionally short heights so query/close content remains reachable. There is no animated scrolling or new motion, including under reduced motion. Forced colors override themed surfaces and states with system colors.

### Focus anatomy and field accents

Shared focus styles retain an immediate solid outline and add an optional outer halo. Override the global `--en-focus-width`, `--en-focus-offset`, `--en-color-focus`, `--en-focus-halo-width` and `--en-color-focus-halo`, or the supported button/input/option/overlay family properties. Family `focus-offset` values are signed; an explicit value overrides the local inset/outset fallback. Option popups reserve at least the effective outer row-focus extent, and owned overlay scrollports account for the shared family extent. A descendant-only CSS override may require matching clearance on its owning scrollport because ancestor CSS cannot inspect descendant values.

Focusable controls also receive resting `scroll-margin-block` and `scroll-margin-inline` rules, including native inputs inside Shadow DOM and directly slotted navigation links. Theme tokens `--en-focus-scroll-margin-block` and `--en-focus-scroll-margin-inline` default to the `space.4` rhythm (1rem at the default rhythm). Each axis reserves at least the effective focus contour/halo extent. Set these properties on a page root, theme scope, or individual element; an explicit CSS Part rule remains available for application-specific geometry.

These margins do not change layout or add smooth scrolling. Browsers use them when bringing targets into view; they cannot create space beyond a scroll boundary or guarantee a reposition for an already-visible focus target. Keep sticky-header/footer clearance on the owning scroll container with `scroll-padding-block`, and preserve `focus({preventScroll: true})` when applications intentionally manage focus without scrolling.

The library supplies a noninteractive `focus-frame` Part around each painted field. Its optional bottom accent uses `--en-input-focus-accent-width` / `--en-input-focus-accent-color` and the `--en-duration-focus-enter/exit` and `--en-ease-focus-enter/exit` tokens. Only the supplementary halo and this decoration transition; the solid contour never does. Native input identity, events, focus, value and form behavior remain unchanged. Number fields decorate their complete frame while native center/step controls keep distinct inset focus; the internal combobox trigger also keeps an inset contour. CSS Parts and scoped properties remain available for different visual recipes.

Forced colors remove halos and preserve a system-color solid contour. Reduced motion removes halo and accent transitions. This capability does not implement menu/dialog entry or exit animation: native presence, interruption, dismissal and focus-return motion require a separate behavioral review.


## Layout and content recipes

`contentStyles` from `@en-reve/styles/content.js` and the generated
`@en-reve/styles/content.css` provide the same opt-in native list/grid, file card,
metadata and empty-state classes. This family includes the existing shared surface
styles; it does not register components or provide selection behavior. Use an
explicit CSS link for a native document and a CSSResult import for a Lit style array.
It supports native content as well as direct `en-card` children through its public
`base` Part. Class and token contracts, including the existing grid/surface override
hooks, are documented in the [content recipe guide](../primitives/docs/content.md).

## Hover and input capability

Decorative `:hover` rules use `@media (hover: hover)`, including forced-color
variants. Pressed, selected, current-page, expanded and keyboard-focus states
remain independent of hover capability. Coarse-pointer target enlargement still
uses `any-pointer: coarse`; target size is a separate concern.

On a hybrid device CSS follows the browser's reported primary hover capability,
not the pointer responsible for a particular event. It updates when that report
changes. Tooltips and submenu hover navigation separately inspect pointer events
to ignore touch while supporting an actual mouse. These functional interactions
are not disabled merely because a device also has a touchscreen.

## Shared interaction target floors

The shared control minimum (`--en-control-min-size`, with the size-selected
`--en-size-control-min` fallback) applies to form and option rows, disclosures,
ratings, uploads, suggestions, and range controls in both orientations. Compact
controls retain their family defaults while honoring an explicitly authored
shared minimum. On `any-pointer: coarse` devices, the effective target also
includes `--en-size-target-touch`. The ordinary `--en-size-target-min` always
remains a floor, even if the touch token is smaller. A fine primary pointer does
not suppress targets needed by a coarse secondary pointer.

Swatches, token actions, tree drag handles, carousel picker buttons and split
separators use the same floors. Their visual contents—icons, range tracks/thumbs,
color-wheel/plane thumbs and the splitter grip—keep independent geometry.
Checkbox/radio/switch targets belong to their associated label; enlarging a
label does not enlarge the indicator. Segmented controls and number fields
retain their documented outer-frame sizing and inner pointer-target budgets.

Calendar cells preserve their target floor in single and range selection. If
seven targets exceed the available width, the calendar scrolls horizontally
inside its bounded surface. Range bands use the same cell geometry. Bounded
carousel pickers similarly scroll rather than overlapping enlarged targets.
Themes that already set a larger shared minimum can therefore enlarge controls
that previously ignored it. No new public token or registration is required.

Implementation and verification: [API-07 target-floor follow-up](../../plans/api-07-target-floors.md).
