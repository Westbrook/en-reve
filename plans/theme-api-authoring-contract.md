# Theme authoring contract

This contract implements the eleven release recommendations from [the theme refresh report](theme-refresh-report.md). It describes the current local API; it does not declare a package release or certify all applications accessible.

## Supported layers

| Layer | Authoring and delivery | Meaning |
| --- | --- | --- |
| Typed source | `resolveTheme({source,pins})`; trusted per-appearance `baseOptions` in the repository catalogue | Full typed stacks, exact dimensions, layered/inset shadows and aliases. Source is production input, not a replay of editor choices. |
| Managed choices | `createReviewDraft(baseOptions)`, edit/undo/restore, export/reopen | A bounded interface over that source. Baseline values outside the editor menu remain preserved. |
| Semantic roles | `color.*`, `font.*`, spacing, geometry, focus and motion roles | Coordinated defaults. Density and selected size remain separate; hit targets retain their floors. |
| Family overrides | Optional typed `component.*` aliases and public CSS custom properties | Narrow refinements. Unpinned aliases emit `initial`, preserving contextual fallbacks. A suggested authoring default is not measured paint. |
| Companion recipe | `createThemeCompanion(theme, recipe)` | Versioned, explicitly installed hook assignments and finite component presentations with typed roles. Separate identity and CSS artifact. |
| Scoped CSS / Parts | Code-authored CSS maintained by the application | Additional composition or presentation outside the registered recipes. Public Part reachability must be checked for the actual nesting. |

Light and dark use independent source with matching token IDs/types. Full boundaries reset optional library hooks; partial output changes only the requested roles. Dependency-aware patches preserve pin barriers and deliberate clears. Portal destinations need a real boundary where they render. Theme data never controls names, selection, focus policy, dismissal or modality.

`customizationContracts(theme)` exposes authoring support, point-of-use fallback, selected-size behavior, states, source consumers and reset policy. Theme Review's **Where this rule applies** disclosure presents that information. Source registration is not proof that an outer Part reaches every nested consumer. `resolveTheme({warnUnknownComponentHooks:true})` opts into diagnostics for unknown/unwired `component.*` outputs; application-defined tokens remain legal. This diagnostic preference does not change theme identity.

## Portable source versus review evidence

The eleven canonical recipes in `tooling/theme-candidates/definitions.json` are the retained release corpus. They carry independent trusted branch baselines plus managed edits. Selector loading, candidate preparation and same-build reopen use the same catalogue. A production consumer can resolve these inputs and emit CSS without a review build.

A review JSON download is an exact-build evidence envelope. Reopen verifies its source, authoritative baseline, transcript and regenerated CSS. It cannot choose a new trusted baseline or install CSS supplied by an imported envelope. A changed schema/consumer build requires regenerating review evidence; old downloads are not silently rebased. Keep the source recipe and required font/companion assets alongside the review artifact.

Compatibility notes from [THEME-02](theme-02-cascade-migration.md) and [THEME-06](theme-06-composition.md) remain applicable. New optional roles are additive; default held feedback is a deliberate visual change. The new `fontStyle` token type accepts only `normal`, `italic`, or `oblique`; consumers enumerating token/editor kinds need to handle it. No arbitrary CSS string token type was introduced.

## Companion recipe v1

```ts
const companion = createThemeCompanion(theme, {
  schemaVersion: 1,
  id: 'quiet-actions',
  rules: [{
    target: 'button',
    variant: 'ghost',
    tokens: {'--en-button-pressed-background': 'color.selected'},
  }],
});
// Install companion.css from trusted code after emitted theme CSS.
// Record companion.identity beside the theme sourceHash.
```

The finite target and presentation registries live in [authoring.ts](../packages/tokens/src/authoring.ts) and its [companion modules](../packages/tokens/src/companion/). They cover actions, fields, feedback, selection, collections and surfaces, including source-specific field edges, stateful switches, filled radios, enclosed tabs, materials, sliders and overlay refinements. A target expands only to code-owned public hosts or documented native helper selectors. Recipe data cannot supply selectors, property names outside the accepted maps, or CSS text.

Every rule has a `tokens` map, which may be empty. Its keys must be connected, registered typed override hooks or supported inherited typography inputs. The latter are the `ui`, `input`, `metadata`, `body` and `label-strong` families with the compiler's admitted family, size, weight, line-height, style and tracking inputs. Values name existing same-type resolved tokens; arbitrary semantic outputs, mechanical/configuration hooks and type-confused assignments are rejected.

A registered `presentation` can also accept `roles`. These keys belong to that exact target/presentation pair and their values are typed token IDs:

```ts
const help = createThemeCompanion(theme, {
  schemaVersion: 1,
  id: 'compact-help',
  rules: [{
    target: 'tooltip',
    presentation: 'compact',
    tokens: {},
    roles: {
      background: 'color.text',
      color: 'color.canvas',
      paddingInline: 'space.2',
      paddingBlock: 'space.1',
      radius: 'radius.control',
      fontSize: 'font.metadata.size',
    },
  }],
});
```

`tooltip/compact`, `dialog/sectioned` and `padded-dialog/padded`, for example, have different role sets and layout behavior. A `roles` map requires a registered presentation; the legacy `joined`, `dotted-underline` and `stretch` presentations do not accept role maps. Unknown recipe fields, targets, presentations, role names, missing token IDs and incompatible types fail before emission. Omitted roles omit their optional declarations; selecting a presentation can still establish its fixed structure, such as an enclosed rail or a content-owned inset. Consult the chosen renderer instead of assuming that an empty role map is a visual no-op. Existing token-only recipes remain supported.

Variants are optional only for `button` (`primary`, `secondary`, `ghost`, `danger`) and `badge` (`neutral`, `accent`, `success`, `warning`, `danger`). A rule without `variant` matches all variants of its target. A button variant rule also includes the appropriate omitted-attribute default: `primary` for `en-button` and native `.en-button`, `secondary` for `en-toggle-button`. Native `.en-button--secondary`, `.en-button--quiet` and `.en-button--danger` aliases are excluded from the omitted primary branch. Badge variant rules match their explicit `variant` or `data-variant` attribute; the compiler does not add an omitted-attribute badge branch.

The source recipe carries `schemaVersion`, ID and rules. The compiled artifact adds `kind`, source hash, deterministic CSS and content identity. The compiler is DOM-free. Review-file reopening regenerates companion CSS from the build's trusted catalogue; imported review data does not install a replacement recipe or executable CSS. A registry or consumer change requires new build-bound review evidence.

Reordering role-map keys does not change the compiled identity. Changing a consumed token regenerates the presentation.

### Boundaries and delivery

For a paired theme whose branch name differs from its boundary, pass `{name: pair.name}` as the third argument for each branch. The low-level compiler emits one resolved appearance for matching `data-en-theme` and explicit light/dark `data-en-appearance`. Named container style queries select the nearest full theme boundary. Every full boundary resets the branch's internal activation marker, including repeated same-name boundaries. Matching components or native helpers on the boundary itself receive separate direct rules; descendant rules exclude subjects that are themselves full boundaries.

The repository's [paired delivery helper](../apps/docs/src/theme-review/companion.js) compiles both branches and adds `prefers-color-scheme` rules for explicit `data-en-appearance="auto"` and omitted appearance. This automatic route belongs to paired delivery, not the single-branch `createThemeCompanion` function. Install token CSS first and companion CSS second. A portal moved outside its component tree needs a real theme boundary at its destination; native top-layer surfaces that retain their component ancestry retain that ancestry's theme.

Load public component styles before token CSS and companion CSS. This includes stylesheet links inside the body: a companion at the end of the head still precedes those links. The docs presentation controller keeps its owned candidate stylesheet after application-authored styles without moving application nodes.

Companions reserve `--en-theme-companion` in the `container-name` list of every `[data-en-theme]` boundary. The generated zero-specificity default does not merge with application declarations. If an application sets `container-name` or the `container` shorthand on a full boundary, it must explicitly preserve the reserved identifier alongside its own names:

```css
.app-panel[data-en-theme] {
  container-name: app-panel --en-theme-companion;
}
/* If the application also requires size containment: */
.app-size-panel[data-en-theme] {
  container: app-panel --en-theme-companion / inline-size;
}
```

Reserve this identifier for full theme boundaries. Replacing or omitting it can make a query select an outer boundary, causing missing presentation or loss of nested-theme isolation. The companion itself does not set `container-type` or introduce size containment; application names are not automatically preserved.

Delivery requires custom-property container style queries, available in [Firefox 151](https://www.firefox.com/en-US/firefox/151.0/releasenotes/) and [Safari 18](https://webkit.org/blog/15865/webkit-features-in-safari-18-0/#style-queries). The pinned matrix uses Chromium 153, Firefox 155 and WebKit 26.6; this does not establish equivalent rendering in older browsers. Full theme token resets still own inherited values at nested boundaries. Neither compiler acceptance nor stylesheet installation establishes browser compatibility or source fidelity. Qualify the actual delivered CSS with the repository's pinned browser matrix, dynamic boundary and appearance changes, application container-name composition, and the Parts, preferences and size contexts in use. The shared emitter's source and synthetic probe provenance are recorded in [the reconciliation manifest](theme-deep-review/shared-emitter-reconciliation.json); those observations do not establish qualification of the integrated registry.

### Public overrides and presentation ownership

Hook assignments use zero-specificity selectors. Direct Part and native-helper presentation rules retain the specificity needed to refine their public surfaces; they are not all zero-specificity defaults. The container query and boundary guards add no selector specificity. Public hooks, an appropriate stronger public selector, or inline declarations are the supported ways to override those declarations. Public hook expressions remain on their consuming host or Part, so values supplied there resolve at that surface.

Zero specificity does not make a local custom-property declaration yield to an inherited ancestor value. An explicit `tokens` assignment intentionally declares its hook on the matched element. A renderer supplying a source default must preserve the documented override path: consume `var(--en-public-hook, source-fallback)` at the surface, or place the default in the semantic theme role the component already consumes. Do not introduce a local public-hook default merely to preserve an inherited author override. Check hooks set on the theme boundary, an intermediate ancestor and the component/native helper itself. Full nested themes still perform their documented optional-hook resets.

For example, the padded dialog's optional typed `maxRadius` caps the selected semantic `radius.dialog` fallback on ordinary dialogs. Its inherited `--en-overlay-radius` override stays outside that cap. Custom dialogs with `presentation="responsive"` retain core geometry at every viewport because their query is configurable and their current compact state is private; native `.en-drawer` surfaces are likewise excluded. Enclosed tabs consume the public control radius and inline-padding overrides before their source defaults. These requirements concern the renderer's actual declarations, not a guarantee inferred from a role's name or its successful compilation.

Trusted presenters may share library-owned size-selection code with the corresponding styles to preserve explicit small/medium/large and `size="inherit"` behavior. Private `--_en-*` implementation flags are not recipe inputs or public customization contracts. Consumers use the documented size attributes, typed roles and public hooks; compiler and styles must remain compatible. Source visual dimensions must preserve content growth, viewport/scroll constraints, focus clearance and the independent fine/coarse pointer target floors.

Presentations must retain component-owned state, native editing, focus, form semantics, registration, dismissal and modality. Author paint belongs behind forced-color guards, or an equivalent explicit system-color branch; motion retains the existing bounded hooks and reduced-motion behavior. A theme's visual mapping does not authorize changing application delays, values or controller policy. Source-inspired mappings, intentional adaptations and actual validation evidence are recorded separately in the [deep review](theme-deep-review/README.md).

Arbitrary Parts rules outside these finite presenters remain separately trusted CSS. Use documented hosts, Parts and native helpers; avoid private classes or shadow ancestry. Maintain source/content hashes, dependency versions, scope, appearance and reached Parts. Grouped Astryx actions can opt out of whole-button movement with `data-press="none"` on each `en-button`; native buttons use the same attribute. Popup semantics (`aria-haspopup`, including closed triggers) use `component.button.popup-pressed-scale` and `popup-pressed-offset`, falling back to ordinary button motion. Shadcn pins these to 1/0; Astryx inherits .98. No selector infers grouping from visual proximity.

## Connected presentation roles

| Need | Roles and consumers | Fallback and boundary |
| --- | --- | --- |
| Button state paint | `component.button.{rest,hover,pressed}-{background,color}` | Now stock typed/managed hooks. Broad pins affect every variant; prefer companion variant scope. |
| Press presentation | `component.button.pressed-scale`, `pressed-offset`, `pressed-shadow`, `shadow`, `press-duration`, `release-duration`, `popup-pressed-scale`, `popup-pressed-offset` | Scale .9–1, vertical offset ±2px and timing 0–200ms are clamped at consumption. The complete button moves, including border, background, label, icons and focus contour. Its layout allocation remains stable; its painted/hit rectangle transforms. Elevation composes with the halo. |
| Field frames | `component.input.radius`, `border-width`, `border-color`, `hover-border-color`, `invalid-border-color`, `invalid-border-width` | Narrow roles precede shared control fallbacks. Text/select/combobox/date/editor frames share radius/border paint; number owns its outer frame. Strong invalid width remains the single-line text/combobox treatment, with padding compensation. |
| Navigation | `component.navigation.{hover,current}-{background,color}`, `pressed-background`, `current-indicator-{width,color}` | Existing `active-*` CSS hooks remain fallbacks. The optional inline-start border is an indicator, not a new interactive slot. Wrapping and disclosure remain behavior. |
| Tabs | `component.tab.{hover,selected}-{background,color}`, `pressed-background`, `indicator-color` | Existing tab background/color remain fallbacks. Selected appearance is distinct from hover and transient down. |
| Surface elevation | `component.surface.shadow`, `component.card.shadow` | Card overrides surface elevation; no shadow by default. Forced colors removes decorative shadows. |
| Type detail | `font.<role>.tracking` in px/rem and `font.<role>.style` | Body, UI, input, data, metadata and heading typography consumers adopt these after font shorthands. Label-strong remains predominantly a weight role; its other metrics are for authored compositions. Tracking does not multiply with selected size. |
| Family motion | `component.{popup,dialog,toast}.{enter,exit}-{duration,ease}` | Falls back to shared enter/exit roles; duration bounded to 500ms. Dialog/drawer backdrop shares dialog timing. Popup coordinates and immediate focus remain stable. Native popup/dialog transitions require browser support for discrete display/overlay transitions; unsupported engines retain immediate behavior. Toast exit can paint while a retained node becomes hidden; removal cannot animate an absent node. |
| Composite anatomy | `component.choice.size`, `component.switch.{inline-size,block-size,thumb-size}` | Refines visual glyph/track geometry independently of global icon size; target floor stays separate. Authors must keep a thumb inside its track. |

Press motion is a bounded source adaptation, not a claim of pixel-equivalent source choreography. Astryx uses .98 whole-button scale; shadcn/Rhea uses 1px whole-button travel. The button surface moves its label, icons, border, background and focus contour together while retaining its layout allocation. Reduced motion removes those transforms, leaving paint feedback. Popup triggers and grouped opt-outs retain paint. A source's reduced-motion policy can differ; we retain the system's protected alternative.

Default primary, secondary, ghost and danger buttons now have distinct held paint. Shared options, number steps, combobox triggers, tabs, segmented choices, accordion triggers, checkbox/radio/switch chrome, ratings, links and navigation have family-appropriate feedback. Calendar and editor-token state treatments remain specialized. Continuous sliders/color planes/splitters communicate adjustment through value, position and focus; they do not shrink on drag. Disabled controls do not gain an active treatment. Native platform pickers remain platform-owned. The browser evidence distinguishes actual held-state coverage from source-only coverage; this is not a claim to have exercised every interaction of every exported element.

## Rendered relationships

`validateRenderedRelationships(samples)` accepts explicit foreground and nearest-to-farthest background layers, appearance, consumer, state and threshold. It composites sRGB alpha in paint order before calculating contrast. `renderedRelationshipRoles` enumerates fields, option combinations, button variants, links, status, toast and adjacent focus surfaces. Test samples, not semantic alias names, establish which consumer was examined.

A missing opaque outer surface, unknown foreground, image, gradient, filter, blend or unsupported composition is **unknown**, never a passing ratio. Ordinary text uses 4.5:1 and focus checks use 3:1 as review thresholds. Disabled-text ratios are recorded separately from normative text requirements. Platform/AT qualification, hit geometry, focus visibility and real devices remain separate evidence. The six existing compiler diagnostics keep their deliberately narrower meaning.

## Consumed-role provenance

`validateRoleProvenance(theme, entries)` records a known token ID, `measured` / `published` / `adaptation` kind, exact source URL and SHA-256, selector, appearance, viewport and note. Measurements require a positive viewport. Conflicting source rows are retained; the API does not overwrite one with the other.

The corpus's `role-provenance.json` records the newly consumed Fluent navigation/heading and Radix typography/button evidence against downloaded immutable source files. Existing detailed source reports remain authoritative for the remaining palette and component mappings. In particular, Fluent's rose website skin is separate from generic product guidance, and the elevation article is not silently substituted for consumed Search CSS. Missing historical measurements are not backfilled as invented observations.

## Font and responsive delivery

The docs font manifest at `apps/docs/public/fonts/theme-references/sources.json` records URLs, hashes, byte counts, versions, license files and weight ranges for Figtree, Geist and Geist Mono. `font-delivery.json` adds CSS family names, `font-display: swap`, local-only families and fallback policy. The corpus verifier checks those files and licenses against their hashes. No Segoe UI, Adobe Clean, Georgia or other proprietary font is redistributed.

A production application must host licensed assets, serve correct MIME/cache/CORS headers, install matching `@font-face` rules, and load fonts before final visual measurements. Compare the same representative strings with the requested stack and explicit fallback using `document.fonts` and measured layout; preserve fallback receipts rather than assuming identical metrics. Reserve space and verify wrapping, truncation, number steps and 200% text before and after loading.

Responsive typography is explicitly authored CSS: use a scoped media query to change **role inputs**, and regenerate coordinated size outputs with theme CSS/patch tooling where necessary. A Spectrum pointer-specific size scale is a separate input from `size.target-touch`; coarse pointers must not reduce target floors. Variable-font axes, fluid expressions, Display-P3 and a generalized responsive-token language remain optional future capabilities.
