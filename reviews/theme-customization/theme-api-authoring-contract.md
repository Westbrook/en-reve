# Theme authoring contract

This contract implements the eleven release recommendations from [the theme refresh report](theme-refresh-report.md). It describes the current local API; it does not declare a package release or certify all applications accessible.

## Supported layers

| Layer | Authoring and delivery | Meaning |
| --- | --- | --- |
| Typed source | `resolveTheme({source,pins})`; trusted per-appearance `baseOptions` in the repository catalogue | Full typed stacks, exact dimensions, layered/inset shadows and aliases. Source is production input, not a replay of editor choices. |
| Managed choices | `createReviewDraft(baseOptions)`, edit/undo/restore, export/reopen | A bounded interface over that source. Baseline values outside the editor menu remain preserved. |
| Semantic roles | `color.*`, `font.*`, spacing, geometry, focus and motion roles | Coordinated defaults. Density and selected size remain separate; hit targets retain their floors. |
| Family overrides | Optional typed `component.*` aliases and public CSS custom properties | Narrow refinements. Unpinned aliases emit `initial`, preserving contextual fallbacks. A suggested authoring default is not measured paint. |
| Companion recipe | `createThemeCompanion(theme, recipe)` | Versioned, bounded, explicitly installed variant rules. Separate identity and CSS artifact. |
| Scoped CSS / Parts | Code-authored CSS maintained by the application | Gradients, advanced materials, asymmetry, responsive typography and conditional component-specific anatomy. Public Part reachability must be checked for the actual nesting. |

Light and dark use independent source with matching token IDs/types. Full boundaries reset optional library hooks; partial output changes only the requested roles. Dependency-aware patches preserve pin barriers and deliberate clears. Portal destinations need a real boundary where they render. Theme data never controls names, selection, focus policy, dismissal or modality.

`customizationContracts(theme)` exposes authoring support, point-of-use fallback, selected-size behavior, states, source consumers and reset policy. Theme Review's **Where this rule applies** disclosure presents that information. Source registration is not proof that an outer Part reaches every nested consumer. `resolveTheme({warnUnknownComponentHooks:true})` opts into diagnostics for unknown/unwired `component.*` outputs; application-defined tokens remain legal. This diagnostic preference does not change theme identity.

## Portable source versus review evidence

The eleven canonical pairs in `tooling/theme-candidates/definitions.json` are the retained release corpus. They carry independent trusted branch baselines plus managed edits. Selector loading, candidate preparation and same-build reopen use the same catalogue. A production consumer can resolve these inputs and emit CSS without a review build.

A review JSON download is an exact-build evidence envelope. Reopen verifies its source, authoritative baseline, transcript and regenerated CSS. It cannot choose a new trusted baseline or install CSS supplied by an imported envelope. A changed schema/consumer build requires regenerating review evidence; old downloads are not silently rebased. Keep the source recipe and required font/companion assets alongside the review artifact.

Compatibility notes from [THEME-02](/reviews/theme-customization/theme-02-cascade-migration.md?progress-report) and [THEME-06](/reviews/theme-customization/theme-06-composition.md?progress-report) remain applicable. New optional roles are additive; default held feedback is a deliberate visual change. The new `fontStyle` token type accepts only `normal`, `italic`, or `oblique`; consumers enumerating token/editor kinds need to handle it. No arbitrary CSS string token type was introduced.

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

The grammar admits a finite set of component hosts and documented native helpers. The `tokens` map assigns **registered typed override hooks**, or the supported inherited typography roles, from same-type resolved tokens. Button and badge variants retain their declared finite sets. Primary buttons require explicit `variant="primary"` / `data-variant="primary"` on their host/native target.

A code-owned `presentation` can additionally expose typed `roles` for its documented Parts. For example, `tooltip` with `compact` accepts spacing, typography, paint and elevation roles:

```ts
const tooltipCompanion = createThemeCompanion(theme, {
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

Role values are token IDs, never CSS values. Each target/presentation pair declares its own role names and token types; `tooltip/compact` differs from the sectioned card, dialog, drawer and popover recipes. Omitted optional roles leave those declarations to the component. The presentation itself can still establish its documented structure, such as removing the surface inset and placing padding on the content Part. Existing token-only rules remain valid. Unknown fields, targets, presentations, role names, missing token IDs and mismatched types fail before emission; arbitrary selectors, property maps and CSS text are rejected. Configuration and mechanical hooks remain outside the `tokens` assignment grammar.

Recipes carry `schemaVersion`, ID and rules; compiled artifacts add the source hash, deterministic CSS and a content identity. Reordering role-map keys does not change that identity. Changing a consumed token regenerates the presentation. Review-file reopening always regenerates the companion from the build's trusted catalogue and rejects replaced recipe or CSS data.

For a paired theme whose branch name differs from the boundary, pass `{name: pair.name}` as the third argument for each branch. Named container style queries select the nearest full `[data-en-theme]` boundary. Each boundary resets a private marker for the theme name and appearance; matching boundaries activate it. Direct rules also include matching components and native helpers on the boundary itself. Different and repeated same-name nested themes remain independent. Public declarations stay on the consuming host, Part or native helper, so their public custom-property expressions resolve locally. The repository's paired compiler adds `data-en-appearance="auto"` rules under matching `prefers-color-scheme` media queries; stronger private marker activation survives the repeated resets in those copies. The lower-level `createThemeCompanion` emits one resolved branch. Place a companion at each real portal boundary; native top-layer surfaces that remain in their component tree keep that tree's theme.

Load public component styles before token CSS and companion CSS. This ordering includes stylesheet links inside the body: inserting a companion at the end of the head still places it before those links. The docs presentation controller keeps its owned candidate stylesheet after the application's authored styles without moving application nodes.

Companion CSS reserves `--en-theme-companion` in the `container-name` list of every full theme boundary. Applications that declare `container-name` or the `container` shorthand on those boundaries must preserve the reserved name alongside their own names:

```css
.panel[data-en-theme] {
  container-name: app-panel --en-theme-companion;
}
/* A consumer that already needs size queries can compose the shorthand. */
.sized-panel[data-en-theme] {
  container: app-panel --en-theme-companion / inline-size;
}
```

Omitting the reserved name can make queries select an outer boundary, causing missing presentation or loss of nested-theme isolation. Reserve the name for full theme boundaries. The companion itself does not set `container-type` or add size containment. Container names form a space-separated list; see the [container naming specification](https://drafts.csswg.org/css-conditional-5/#container-name).

Delivery requires custom-property container style queries, available in [Firefox 151](https://www.firefox.com/en-US/firefox/151.0/releasenotes/) and [Safari 18](https://webkit.org/blog/15865/webkit-features-in-safari-18-0/#style-queries). The repository's pinned rendered matrix uses Chromium 153, Firefox 155 and WebKit 26.6; this requirement is not a promise of equivalent rendering in older browsers. Hook assignments have zero selector specificity, so ordinary consumer classes and inline declarations can override those defaults. Native presentations match the documented helper's class weight; Part selectors retain their usual pseudo-element weight. Normal cascade specificity and source order govern overrides. Use public hooks, an appropriate public selector or inline declarations to override direct geometry and paint.

Install companion CSS after token CSS. Author paint in the new Part presentations is guarded by `forced-colors: none`, leaving component system-color rules in control. Motion roles use the existing bounded family hooks and reduced-motion behavior. Geometry uses logical dimensions and preserves content growth, scroll/viewport constraints and independent action target floors. Presentations do not change component state, focus, input identity, dismissal or modality. Rendered verification is still required for the actual Parts, nesting, preference modes and size contexts in use.

Parts rules outside those finite presentations remain separately trusted CSS, not strings in this JSON grammar. Use documented host variants and public Parts only; avoid private `.en-*` classes inside a shadow root. Maintain that CSS with a source/content hash, dependency version, scope, appearance and a list of reached Parts. For example, grouped Astryx actions can opt out of whole-button movement with `data-press="none"` on each `en-button`; native buttons use the same attribute. Popup semantics (`aria-haspopup`, including closed triggers) use `component.button.popup-pressed-scale` and `popup-pressed-offset`, falling back to ordinary button motion. Shadcn pins these to 1/0 to preserve its source exception; Astryx inherits .98. No selector infers grouping from visual proximity.

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

Press motion is an accessibility/geometry adaptation, **not pixel-equivalent full-button shrink**. Astryx now uses .98 content scale; shadcn/Rhea uses 1px content travel. Reduced motion removes both, leaving paint feedback. Icons assigned through slots may need an authored Part treatment; the label slot is the guaranteed motion consumer. Popup triggers and grouped opt-outs retain paint. A source's reduced-motion policy can differ; we retain the system's protected alternative.

Default primary, secondary, ghost and danger buttons now have distinct held paint. Shared options, number steps, combobox triggers, tabs, segmented choices, accordion triggers, checkbox/radio/switch chrome, ratings, links and navigation have family-appropriate feedback. Calendar and editor-token state treatments remain specialized. Continuous sliders/color planes/splitters communicate adjustment through value, position and focus; they do not shrink on drag. Disabled controls do not gain an active treatment. Native platform pickers remain platform-owned. The browser evidence distinguishes actual held-state coverage from source-only coverage; this is not a claim to have exercised every interaction of all 77 elements.

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
