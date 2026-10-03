# @en-reve/tokens

Private, dependency-free token data and pure TypeScript utilities. Version `0.1.0`, MIT. The light/dark and compact/comfortable/spacious starting values support rendered review; they are not a claim of accessibility conformance.

Build with `npm run build --workspace @en-reve/tokens`; run its Node tests with `npm test --workspace @en-reve/tokens`. The build emits ES2022 modules and declarations, static CSS/default-value data, typed token snapshots, and a manifest. Importing a pure module neither reads the DOM nor installs styles, observers, custom elements, or globals.

## Consume a theme

Load `@en-reve/tokens/default.css` for a comfortable-density root theme that follows the system appearance. It declares `color-scheme: light dark` and supplies both light and dark token values before JavaScript. Missing or `auto` `data-en-appearance` follows the document preference; set that attribute to `light` or `dark` on the document root to force the complete appearance. The CSS includes media-rule fallbacks for browsers without `light-dark()`.

For fixed, independent scopes, load the desired `@en-reve/tokens/themes/light.css` or `dark.css` **after** `default.css` (also `light-compact.css`, `dark-compact.css`, `light-spacious.css`, and `dark-spacious.css`). Each named file redeclares its full graph and matching fixed native color scheme. A nested named scope remains independent of the surrounding appearance; a named scope on the document root takes precedence in this documented stylesheet order, including over an opposite `data-en-appearance` value. Comfortable remains the default; existing theme names are unchanged. CSS assets need an ordinary stylesheet link/import resolved by the application; import maps resolve JavaScript modules, not stylesheet URLs.

```html
<section data-en-theme="dark">
  <!-- An independent full theme; no wrapper custom element is required. -->
</section>
```

Use `var(--en-color-text)`, `var(--en-space-panel)`, and the other names in `manifest.json`. A full theme redeclares shared tokens and resets the finite `styleOverrideNames` registry of optional component properties. It replaces inherited pins. A focused CSS override changes only the properties it declares and preserves other inherited values. Overriding a primitive on a descendant alone does not recompute inherited aliases; put coordinated CSS input changes on the full theme root or regenerate that theme.

Optional component variables are not initialized on hosts. Styles consume `var(--en-button-background, var(--en-color-action, <generated-default>))`. The lightweight `@en-reve/tokens/defaults.js` exports `defaultCSSValues` and `defaultCSSValue(name)` for deterministic light-mode literal fallbacks; this generated module has no compiler, color-math, or DOM imports. It does not query system appearance or install styles. Load `default.css` to opt the document and its native controls into adaptive appearance. `resolveTheme()` and the default JSON authoring snapshots also remain explicitly light/comfortable; use independent explicit modes when authoring a pair. `@en-reve/tokens/overrides.js` is the separate lightweight registry. Mechanical state such as progress values is not reset with a theme. Unknown application-defined properties are not automatically reset.

Field paint follows `--en-input-background` → `--en-control-background` → the semantic surface, with the equivalent order for text color. The compound number field paints its wrapper behind a transparent editor. Card fill follows `--en-card-background` → `--en-surface-background` → the semantic surface. These component tokens leave action and choice surfaces independent. A `component.button.radius` pin can give buttons pill corners while fields retain `radius.control`; without a pin, buttons keep their selected-size radius fallback. An explicit button-radius pin or CSS override applies one radius across sizes. Full child themes reset these optional overrides, while partial themes retain unrelated inherited pins.

`component.rating.star-radius` maps to optional `--en-rating-star-radius` and defaults to `{radius.control}`. It styles only the square star targets and their focus contours; the separate “No rating” action keeps its ordinary shape. Managed choices include zero for square corners, intermediate rounded radii, and `{radius.pill}` / `9999px` for circular targets. Full child themes reset the optional pin; partial themes preserve it unless selected. Astryx- and shadcn-inspired candidates pin circular stars in both appearances without changing other controls.

Pagination geometry has three optional roles: `component.pagination.gap` follows
`{space.actions}`, `component.pagination.status-gap` follows `{space.1}`, and
`component.pagination.page-min-inline-size` follows `{size.control-min}`. Their
CSS names are `--en-pagination-gap`, `--en-pagination-status-gap` and
`--en-pagination-page-min-inline-size`. The managed editor offers spacing-scale
choices and page widths from 2–4rem. Content and interaction-target floors can
increase the rendered width; these are minimums, not clipping dimensions. Full
child themes reset these pins and partial changes leave unrelated roles intact.

`component.radio.selected-color` maps to optional `--en-radio-selected-color` for the checked radio rim and dot. It defaults to `{color.action}`; a foreground/stroke pin can distinguish an indicator on a neutral surface from a filled-action background. The managed editor accepts opaque colors and compatible aliases. Full child themes reset this optional pin; partial themes preserve it unless selected. Unchecked borders, checkbox/switch/range/rating paint, focus and disabled/system-color states remain independent.

For generated custom single-theme scopes, `emitThemeCSS(theme, {colorScheme: true})` emits the theme's fixed `color-scheme` together with its full declarations. The option defaults to false to preserve existing emitted candidate artifacts. Partial single-theme overrides inherit their boundary's scheme and reject `colorScheme: true`. Paired output always owns its scheme and continues to use the appearance attribute for complete branch switching.

## Pair light and dark appearances

`createThemePair({name, light, dark})` joins independently resolved appearances.
Both branches must use the same density, compiler and token schema. No light pins
are copied or inverted to make a dark appearance.

```ts
import { createThemePair, emitThemePairCSS, resolveTheme } from '@en-reve/tokens';
const pair = createThemePair({
	name: 'studio',
	light: resolveTheme({mode: 'light'}),
	dark: resolveTheme({mode: 'dark'}),
});
const css = emitThemePairCSS(pair);
```

Deliver the generated CSS as a stylesheet. A matching boundary uses
`data-en-theme="studio"` and optional `data-en-appearance="auto|light|dark"`.
Missing appearance means Auto. Each full boundary follows the document preference
or its own explicit appearance; ordinary descendants inherit. Nested full themes
reset inherited optional component pins. `{scope: 'root'}` targets the document root.

The emitter shares identical rules and adds `light-dark()` for differing colors
with no variable references. Ordinary media/attribute rules handle non-color values,
different alias graphs and optional `initial` masks. The output also works without
`light-dark()` support. Aliases stay live at their declaration boundary; joining
opposite alias graphs would create CSS cycles, so those declarations stay separate.

Use the appearance attribute to switch the whole pair: overriding only `color-scheme`
can switch colors while leaving shadows or geometry in another appearance. Partial
paired output requires explicit `tokenIds` and still creates an appearance boundary.
For an overlay that merely inherits appearance, emit the selected branch with the
existing `emitThemeCSS(branch, {kind: 'partial', tokenIds})` API.

`exportThemeReviewPair({name, light: lightDraft, dark: darkDraft}, metadata)` retains
both ordinary draft histories and regenerated combined CSS. `reopenThemeReviewPair`
validates both branches and all artifacts. Pair JSON uses `en-reve/theme-review-pair`
version 1; existing single-draft formats remain supported. These schema versions do
not change package versions.

## Brand and action colors

`color.brand` / `--en-color-brand` is the identity fill used by the wordmark. `color.on-brand` is its paired foreground. Filled controls use `color.action`, `color.on-action`, and the action state colors. `color.action-text` supplies action ink on neutral surfaces (quiet buttons, selected tabs/segments and accent badges); it initially aliases `color.action`. `color.link` initially aliases `color.action-text` and can be pinned separately. Dark themes can use brighter ink without lightening filled buttons.

Both families start from `palette.accent`. The existing `palette.action` path aliases that seed, so an action palette override still affects only the action family. Brand and action semantic roles can also be pinned independently:

```ts
const theme = resolveTheme({
  name: 'studio',
  pins: {
    'palette.accent': colorFromHex('#0f766e'),
    'color.action': colorFromHex('#2457d6'),
  },
});
const css = emitThemeCSS(theme);
```

This theme has a teal brand and blue action controls. Pin `color.brand` to change identity alone; remove the pin to reconnect it to the shared seed. `color.on-brand` is derived against the effective brand fill, independently of action hover/pressed colors. Each foreground can also be pinned and is included in the theme's contrast diagnostics.

Use the resolver and emit a complete theme when changing a coordinated color system. CSS aliases remain live at their declaration boundary, but computed foreground and state recipes are emitted as resolved colors; a raw CSS seed override alone does not recalculate those recipes. A scoped full theme restores its own graph, while a partial override preserves unrelated inherited values.

`on-brand` means foreground on a brand-colored fill. It does not mean brand-colored text on a neutral surface; that use needs its own rendered contrast review. The sticker sheet deliberately uses the exact same brand color for its wordmark name and tile background. No generic `color.primary` role is introduced.

## Density, size, and grouped actions

Density changes packing and the baseline minimum control dimension. It does not change typography. At the default `.25rem` rhythm, the presets use:

| Density | Control baseline | Panel padding | Content row gap | Action group gap |
| --- | --- | --- | --- | --- |
| Compact | `2rem` | `1rem` | `.5rem` | `.25rem` |
| Comfortable | `2.5rem` | `1.5rem` | `.75rem` | `.375rem` |
| Spacious | `3rem` | `2rem` | `1rem` | `.5rem` |

`space.actions` / `--en-space-actions` is a distinct, tighter gap for related actions and badge groups. It does not replace content spacing or the padding within an individual button/badge. `space.control-block`, `space.badge-inline`, and `space.badge-block` name that internal geometry separately. Every role remains independently overridable.

Optional `component.button.inline-padding` and `component.input.inline-padding`
specialize the shared inline role. `component.segmented-control.frame-inset`
specializes the padding inside the segmented border. Unpinned full themes emit
`initial` for these hooks, retaining the selected size and density fallbacks.
Explicit pins supply one public value across sizes; aliases can follow rhythm.
Managed literal choices use a finite set of base-rhythm steps, while compatible
references remain available. Full child themes clear inherited optional pins;
partial themes preserve unspecified values. See the styles package's family
geometry contract for precedence, shared alignment and specialized-control limits.
`space.2-5` supplies a 2.5× rhythm step (10px at the default 4px rhythm) for finer
padding distinctions. It appears in general spacing and inline-family menus;
the segmented frame's curated literal menu remains limited to steps 0–2.

Component size selects **absolute** `small`, `medium`, or `large` role outputs. The token package exports all three in every color/density theme, so size is not another color/density context or a multiplier applied repeatedly through nested components. `@en-reve/tokens/sizing.js` exports the lightweight `sizingRoles`, `sizingRoleCSS`, `componentSizes`, and scale data without a resolver dependency.

| Size | Geometry scale | Typography scale |
| --- | --- | --- |
| Small | `.875` | `.9375` |
| Medium | `1` | `1` |
| Large | `1.25` | `1.125` |

The geometry inputs are `size.scale-small`, `size.scale-medium`, and `size.scale-large`; typography uses `size.type-scale-small`, `size.type-scale-medium`, and `size.type-scale-large`. UI and input typography never scale below their own base values through this recipe: small changes geometry while retaining the base text size. Their shared defaults are `1rem` for small/medium and `1.125rem` for large, with unitless `1.5` line height. Metadata also never scales below its base value (initially `.8125rem`). These are design defaults, not minimum-font-size accessibility guarantees; every output remains independently pinnable. Medium outputs preserve their semantic bases. The finite role map covers controls, icons, avatars, loading/progress, splitters, switch geometry, component/group spacing, surface radii and padding, overlay widths, and body/UI/input/data/metadata/heading typography. Example output IDs are `size.avatar-large`, `space.panel-small`, and `font.ui.size-large`; their CSS names are `--en-size-avatar-large`, `--en-space-panel-small`, and `--en-font-ui-size-large`.

Comparable controls share `font.ui.family`, `font.ui.size`, and `font.ui.line-height` by default. The input and strong-label roles alias these metrics, so coordinated UI changes flow through their dependency graph; an explicit input or strong-label pin can diverge. Weights remain independent: UI/input start at `400`, strong labels at `600`. Rendered labels inherit the selected UI size and apply the strong weight; the base `font.label-strong.size` alias does not introduce a separate size-selection role. Density and rhythm do not change typography. Resolve and emit a full theme when dependent values must change together; raw descendant CSS overrides do not rebase inherited aliases or derived outputs.

Size selection belongs to the consuming element/styles. An element without a `size` attribute uses medium; it does not need `size="medium"` to receive the appropriate CSS. Explicit `size="inherit"` opts into its parent's selection; explicit small/medium/large selects that absolute size. Recompute selected role values at each host using its selection and the local public tokens, so a full child theme correctly rebases the values. Inheriting an already resolved private role value across a new theme boundary would preserve the old theme's value. All size outputs, including medium, are independently pinnable. A descendant-only base override such as `--en-size-control-min` needs a full graph boundary to rederive its size outputs; a direct component override such as `--en-control-min-size` or a selected size output such as `--en-size-control-medium` applies immediately.

`size.target-min` (`24px`) and `size.target-touch` (`2.75rem`) are unscaled target roles. Interactive styles must apply the target floor separately from visual geometry; the coarse-pointer role is an ergonomic enhancement, not a universal touch detector or an AA requirement. Actual target rectangles and neighboring targets still need rendered review. Managed target choices retain these starting floors; reviewed code customizations can express exceptions. Explicit size changes still require text resizing/zoom/clipping review.

`layout.dialog-collapse` is the `48rem` default responsive-dialog breakpoint. A stylesheet generator can use its resolved value in a media query. Changing a custom property at runtime does not change a CSS media-query threshold.

## Resolve, customize, and review

```ts
import {
  resolveTheme, colorFromHex, restoreDerived, emitThemeCSS,
  createCandidate, assertCandidateBase
} from '@en-reve/tokens/index.js';

const base = resolveTheme();
const pins = {
  'color.action': colorFromHex('#a13698'),
  'rhythm.base': {value: 0.375, unit: 'rem'},
  'space.2': {value: 0.5, unit: 'rem'}
};
const theme = resolveTheme({name: 'violet', pins});
const css = emitThemeCSS(theme); // Full boundary for data-en-theme="violet".
const next = resolveTheme({name: 'violet', pins: restoreDerived(pins, 'space.2')});
const candidate = createCandidate({base, theme: next, title: 'Review violet theme'});
assertCandidateBase(candidate, base); // Throws if the source has changed.
```

These functions return data. The application controls DOM insertion, draft storage, and adoption. Candidate artifacts can be downloaded by an admin interface; no remote submission destination, authentication, or adoption operator is selected by this package. A candidate is `prepared`, not approved or adopted. It records caller-supplied evidence; missing evidence remains missing.

Reopen an artifact with `resolveTheme(JSON.parse(candidate.artifacts['source.json']).options)`. The same compiler code, recipe code, and source inputs reproduce its source hash and CSS. Raw complete source is also included for review; use the recorded options rather than treating every raw source value as a new override.

`resolveTheme({source})` accepts a nested typed source overlay. An explicit overlay value at a recipe output becomes a pin. Pins are installed before dependency evaluation, so downstream recipes read their effective values. `restoreDerived(pins, id)` returns a fresh pin map. Code-level customizations can exceed managed choices; `validateManagedValue(theme, id, value)` applies the constrained UI choices separately. The admin metadata exposes same-type aliases, supported choices, units, and pin operations. It is not an accessibility certificate.

`affectedTokens(theme, ids)` walks active dependencies; `{potential: true}` also includes relationships hidden by pins. Component/sample dependencies and rendered accessibility relationships are supplied by the broader review system; this token graph alone does not establish all affected application behavior.

Validated recipe results use 12 significant digits before downstream evaluation, CSS emission and candidate serialization. Authored literals and pins retain their exact values, including their precision in source identity. The precision policy is itself included in the source hash. This reduces cross-runtime floating-point noise without relaxing artifact integrity checks. Contrast diagnostics classify the raw ratio before rounding the recorded measurement; a displayed `4.5` can therefore still represent a failing value just below the threshold. Values at a floating-point decision boundary still require care; this is not a general guarantee that arbitrary recipes make identical branching decisions in every runtime.

## Local managed review drafts

`createReviewDraft(baseOptions?)` creates a separate, DOM-free editing model over the existing resolver. It does not persist, submit or adopt changes. Each successful complete edit is atomic; validation failures leave the accepted theme and history untouched. Applications keep incomplete native field text, selection, focus and local validation messages separately, and preview the last valid theme in an isolated scope.

```ts
import { createReviewDraft, reopenReviewDraft } from '@en-reve/tokens';

const draft = createReviewDraft();
const editor = draft.editor('space.2');
draft.setToken('space.2', { value: 0.5, unit: 'rem' });
draft.setToken('rhythm.base', { value: 0.375, unit: 'rem' });
// The pinned space.2 remains 0.5 rem until its default rule is restored.
draft.restoreToken('space.2');
const json = draft.exportJSON({ title: 'Review spacious rhythm' });
const reopened = reopenReviewDraft(json, { baseOptions: {} });
```

The model exposes `base`, `theme`, `options`, `canUndo`, `canRedo`, `editor(id)` and `canRestore(id)`. `setToken`, `restoreToken`, `setContext({mode, density})`, `undo`, `redo` and `reset` return whether they changed the accepted state. History retains the latest 100 snapshots. Reset returns to the original supplied base and can itself be undone. The base, accepted options and prepared candidate data are immutable; instances share no mutable draft state.

Managed choices are anchored to the original base in the selected context, so repeatedly choosing a scale multiplier cannot expand its allowed range. Alias choices follow the current graph and a complete resolution rejects cycles. Exact current or base values can be preserved without rounding or normalization, including code-authored values outside managed choices. Choosing the current derived value explicitly can pin it against later coordinated changes. Managed Bézier controls bound all four coordinates to their declared interval; code-authored curves may still overshoot through their Y coordinates.

Restore removes both the explicit pin and any source-overlay token at that path, reconnecting the library's default rule; it preserves unrelated source/group metadata and keeps the original base for comparison. Describe the action as restoring a derived value only when that rule actually derives or aliases another value. Restoring a literal rule returns its default. This is not an arbitrary source-code editor.

`prepare({title, rationale?, evidence?})` returns the existing immutable `prepared` candidate. Later draft edits do not mutate it. `exportJSON` wraps that candidate in a versioned `en-reve/theme-review` envelope containing `baseOptions` and the successful typed edit sequence. Reopening validates the schema and compiler, reconstructs the base, replays managed edits, and compares the full regenerated candidate and artifact strings/hashes, including source, CSS, changes and dependencies. It never executes or inserts CSS from the file. Supply the currently authoritative `baseOptions` to reject a stale proposal base; omitted expected options allow reopening the recorded valid base for local review.

The importer limits input to 8 MiB of UTF-8 JSON and 1000 edits; a draft also limits its active edit sequence to 1000 successful changes. Syntax/schema, capacity, stale-base, compiler, managed-value and artifact-integrity failures remain distinguishable `TokenError` codes. Import creates a new model only after all validation succeeds; the application decides when to replace its current draft. The edit sequence preserves legitimate context changes and exceptional values without weakening managed checks during reopen.

A live preview may pass `{previousDraft}` to `reopenReviewDraft` to reuse a package-created, previously validated state. Reuse requires the identical base and an exact prefix of successful edits. The importer forks that state, validates the new suffix, and still compares the complete regenerated candidate and artifacts. Divergent history, undo or a different base falls back to complete replay. Failures never mutate the previous model; replace a preview cache only after the new validation and rendering both succeed. Ordinary file opening can omit this optimization and independently replay the complete file.

This envelope is review data, not an offline application archive or an authenticated approval receipt. A review application can wrap it with its actual build/assets, case coverage and evidence identity and require that same build when reopening. Evidence remains caller-supplied; a downloaded or reopened candidate is neither submitted nor adopted, and missing browser/manual evidence does not become a pass.

## Supported DTCG subset

The data uses the DTCG 2025.10 representation. This implementation supports nested groups, inherited types, whole-token `{path.to.token}` aliases, descriptions, token extensions, and deprecation metadata. Types are `color`, `dimension`, `number`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, and `shadow` (including arrays). Color values currently use sRGB only; dimension units are `px` and `rem`. The CSS adapter maps the numeric character measure to `ch` without inventing a DTCG dimension unit.

It is **not a complete DTCG Format/Color/Resolver implementation**. JSON Pointer references, `$extends`, `$root`, property-level/composite references, external references, arbitrary resolver documents, other color spaces, and other composite types are not implemented. Unsupported fields/types are rejected rather than guessed or fetched. Group metadata is accepted for grouping; `tokenDocument(flattenTokens(...))` preserves token metadata but does not round-trip group metadata. Keep the original source for editing.

Recipes are versioned code, separate from the portable format. `tokens.json` and `themes/*.tokens.json` are resolved typed snapshots readable without those recipes. `source.tokens.json` and `sourceTokens` expose the authored inputs; a DTCG-only tool will not execute their external derivations. Do not edit generated files as the source of truth.

`deriveAccent` uses opaque Oklab interpolation and a pinned binary-search/local-MINDE mapping to sRGB. It reports the strongest declared foreground candidate for the three action backgrounds. This is a limited contrast calculation, not automatic theme accessibility. `contrastRatio` composites a transparent foreground over a known opaque background; an unknown/translucent background needs additional context. `deriveInsetRadius` handles nonnegative same-unit scalar geometry; mixed units require CSS/rendered context. Native functions/mixins and arbitrary style queries are not required for baseline output.

## Verification scope

Node tests cover graph/pin/context behavior, all six theme snapshots, size-system dependencies and granular restoration, malformed input, transitive impacts, color/contrast vectors, deterministic hashing, managed-versus-code choices, candidate reopening/stale bases, and portable snapshot imports. [Browser fixtures](test/browser/README.md) verify actual CSS inheritance, shadow scopes, rendering, and interactions against the sticker sheet. Their evidence identifies the exact engines and tested behaviors; it does not certify the complete browser/AT matrix.

### Focus recipes

`focus.width`, `focus.offset` and `color.focus` define the immediate primary contour. The derived `focus.inset-offset` follows the negative width and can be pinned independently. `focus.halo-width` and `color.focus-halo` add a supplementary, unblurred outer halo; its default width is zero.

`focus.scroll-margin-block` and `focus.scroll-margin-inline` map to `--en-focus-scroll-margin-block` and `--en-focus-scroll-margin-inline`. Both follow `{space.4}` (1rem at the default rhythm), with independent pins available for each logical axis. Shared control styles apply this breathing room to the focusable element inside its shadow root, retaining at least the outer focus contour/halo extent. It changes the preferred scroll area, not the control's size or layout spacing. The managed editor offers 0, 0.25, 0.5, 0.75, 1, 1.5 and 2rem, plus compatible aliases; a zero choice removes the extra breathing room while retaining focus decoration clearance.

Applications own `scroll-padding-block-start` and other scroll padding on their scroll containers to account for sticky headers and navigation. Control scroll margins supplement that padding; they do not know the size of application obstructions. Native focus scrolling varies between browsers and can stop at a scroll boundary or leave an already-visible control in place, so these tokens do not guarantee a fixed viewport gap. They do not force scrolling or override `focus({preventScroll: true})`. Review keyboard navigation in the actual page and nested scrolling containers after customization.

Optional `component.button`, `component.input`, `component.option` and `component.overlay` focus roles expose `focus-width`, `focus-color`, `focus-offset`, `focus-halo-width` and `focus-halo-color`. Their CSS properties use the same paths without `component.` (for example `--en-input-focus-halo-width`). Full themes clear unpinned family properties; stylesheet context supplies the fallback. Signed family offsets are literal: negative is inset, positive is outside. Number subcontrols and combobox triggers preserve their inset default and let the complete field own supplementary decoration.

`component.input.focus-accent-width` / `focus-accent-color` control a supplementary bottom accent. `duration.focus-enter`, `duration.focus-exit`, `ease.focus-enter` and `ease.focus-exit` affect supplemental halos and this accent only; they never delay the primary contour. Both durations default to zero. Reduced motion and forced colors remove supplemental focus transitions.

Managed controls offer 1–4px primary widths, 0–4px halo/accent widths, finite signed family offsets, opaque primary colors and alpha-capable halo colors. Focus durations use 10ms steps within the existing 0–500ms managed interval. These are constrained authoring choices, not a guarantee for arbitrary backgrounds, aliases or consumer CSS. Code and CSS Parts remain escape hatches. `size.choice-mark-stroke`, `size.tab-indicator` and `size.quote-border` are independent of focus customization.

## Public customization contracts and `@property`

`customizationContracts(theme)` returns the public CSS contract for semantic tokens, optional component/family hooks, inherited layout configuration and mechanical inputs. `getCustomizationContract(theme, cssName)` selects one entry. The records carry syntax, inheritance, fallback references, reset policy, family/concepts, state and size semantics, consumer sources, managed-authoring linkage and registration policy. `customization.json` exports the default contracts without executing the resolver. Managed editor descriptors include their `cssName`; a CSS-only hook does not automatically become a managed token.

Full-theme reset declarations derive from the registry. Newly covered visual hooks include validation-summary padding/radius and later chat, calendar, color and editor surfaces. A full theme now clears these inherited component overrides so local semantic fallbacks take effect. Applications intentionally inheriting overrides should use a partial theme or reapply a local override. Viewport sizes, data-table minimum width, editor maximum height and mechanical progress/scroll/split inputs are explicitly preserved. The registry records the exact category for each hook; it does not reset every discovered `--en-*` name. Theme source and reset extensions reject reserved configuration/mechanical names.

THEME-02 applies the companion fallback order: component/family refinements, shared group defaults, then semantic defaults. See the [membership and migration guide](../../plans/theme-02-cascade-migration.md) for affected controls, surfaces, explicit geometry opt-ins and the compatibility change.

```js
import {
  resolveTheme, customizationContracts, getCustomizationContract,
  createPropertyRegistrationPlan, emitPropertyRegistrations,
} from '@en-reve/tokens';

const theme = resolveTheme();
const radius = getCustomizationContract(theme, '--en-validation-summary-radius');
console.log(radius.reset, radius.fallback, radius.registration);

// Same contract inventory drives reset generation and authoring metadata.
const managed = customizationContracts(theme).filter(entry => entry.managed.supported);
```

### Compatible registration is included in the default CSS

`@en-reve/tokens/default.css` includes document-level registrations for the public contract before its theme declarations. Consumers generating their own theme CSS can load `@en-reve/tokens/properties.css` once, or call `emitPropertyRegistrations(theme)`. `emitThemeCSS` and `emitThemePairCSS` continue to emit scoped values without redeclaring a global registration policy for every theme boundary.

The default registration uses `syntax: "*"`, `inherits: true` and **no `initial-value`**. This preserves inherited CSS token streams, relative values, optional overrides and `var()` fallback chains. It does not add browser type validation or typed interpolation. The intended value grammar remains available in each registry record independently of the browser registration grammar.

```css
@property --en-validation-summary-radius {
  syntax: "*";
  inherits: true;
}
```

### Typed registration and application configuration

Typed registration is an explicit behavior choice. `{ mode: 'typed' }` types built-in semantic colors, numbers, weights, durations and absolute dimensions where a stable canonical initial value is available. Optional component overrides, relative defaults, compound values, layout configuration and mechanical inputs retain compatible registration unless explicitly configured. Initials come from the canonical built-in theme, never from whichever light/dark theme or local pin happened to emit the stylesheet last.

```js
// Inspect the whole plan, including reasons for compatible entries and exclusions.
const plan = createPropertyRegistrationPlan(theme, { mode: 'typed' });

// Or opt into individual typed contracts, with explicit global defaults.
const css = emitPropertyRegistrations(theme, {
  names: ['--en-validation-summary-radius'],
  definitions: {
    '--en-validation-summary-radius': false, // omit from THIS output
    '--app-progress': { syntax: '<number>', inherits: true, initialValue: '0' },
    '--app-accent': { syntax: '<color>', inherits: true, initialValue: '#5577cc' },
  },
});
// Add css to one document-level stylesheet, after any baseline registration sheet.
```

`names` selects library contracts by CSS name; omit it for all, or pass `[]` for only explicit definitions. Unknown names require a definition. `definitions` can override a library registration or introduce an application-owned name. `false` omits a name from this output; it cannot unregister a property loaded by another sheet. Plans are immutable and ordered by name.

The emitter supports `*`, `<color>`, `<number>`, `<integer>`, `<length>`, `<length-percentage>`, `<percentage>`, `<angle>` and `<time>`. Typed definitions require `inherits` and `initialValue`. For deterministic static defaults it accepts concrete numbers, percentages, absolute lengths, times, angles, hex/numeric color functions and a small set of named colors; use hex instead of other color keywords. Context-dependent expressions, relative font units and declaration fragments are rejected. This is a deliberate authoring subset, not a claim to parse all browser-supported registration syntax. More complex native registrations can be authored as ordinary CSS with their own browser validation.

Typed properties change `initial`, invalid-value handling and computation. For example, a typed length may resolve `em` at the declaring element rather than the consuming element; a typed color can resolve `light-dark()` before a descendant changes its `color-scheme`. A concrete registered initial also takes the place of an absent property's `var()` fallback. Use the compatible policy wherever these contextual behaviors are part of the API. No theme selector scopes a registration: load one coordinated policy per document and test third-party integration. JavaScript registration can take precedence over CSS registration; the library does not call `CSS.registerProperty()` or attempt to unregister application properties.

Registrations are emitted into document stylesheets. The browser tests cover inheritance into shadow components; putting `@property` only inside a component shadow stylesheet is not a supported installation path in the tested engines. Browsers that ignore registration retain the unregistered fallback behavior. Typed animation therefore requires a deliberate fallback and respects the application's reduced-motion policy.

### Keeping the contract synchronized

`npm run customization` checks production styles (including element-local CSS), declared CSS properties, generated CEM, reset coverage and managed-editor linkage, then writes `tooling/customization/evidence/coverage.json` and `.md`. `npm run check:customization` checks that retained evidence is current. Unknown public consumers/annotations and stale exceptions fail the check. Existing disconnected or unmatched hooks remain named, justified findings rather than silently becoming supported API. Source references and component Parts associations describe lexical evidence; they do not prove cascade behavior or imply that every Part consumes every hook.

Run `npm run test:tokens` and `npm run test:properties:browser` for registration configuration, reset/inheritance, typed-value and animation checks. The browser fixture compares compatible output with unregistered behavior across Chromium, Firefox and WebKit, including shadow inheritance and theme appearance. The live `/theme-customization.html` review demonstrates the actual validation-summary boundary fix alongside isolated compatible/typed examples.

## Typed code, managed choices, and CSS

The compiler's accepted values and the editor's finite choices are different
contracts. Typed authoring supports custom font stacks, weights 1–1000, structured
multi-layer/inset shadows, numeric px/rem dimensions, and sRGB/alpha colors. The
managed editor offers curated values, compatible aliases, and fonts/shadows seeded
in its baseline. A valid typed value outside a menu can be supplied in
`createReviewDraft(baseOptions)` and preserved exactly through export/reopen.
Managed edits remain validated; an unrestricted CSS-string field is not added.
Applications remain responsible for font loading.

Twelve existing optional hooks now have built-in managed tokens: `component.control`
`radius`, `inline-padding`, `min-size`, `background`, `color`, and `border-color`;
`component.button.border-color`; and `component.surface` `radius`, `padding`,
`background`, `color`, and `border-color`. Unpinned full themes still emit `initial`
for these aliases. The resolved token value is an authoring default, not a promise
of the rendered contextual value. Explicit pins opt into the existing fallback
contract; restoring the token resumes it. Size and target floors are unchanged.

CSS and Parts remain supported for gradients, responsive expressions, compound
radii and other consumer-supported syntax. Those styles are maintained separately
and are not serialized into a typed review draft. Display-P3 is not supported by
the typed color schema: raw CSS on compatible hooks bypasses typed validation and
derivation, and depends on browser support and document registration policy.

See `plans/theme-05-authoring.md` and the documentation's `theme-authoring.html`
for the capability matrix, full examples and a runnable export/reopen workflow.
### Explicit scopes and dependency-aware patches

`target: 'shadow-host'` emits host-aware appearance selectors. Exact partial `tokenIds` keep their current behavior; `clearOverrides` explicitly releases registered optional hooks. `createThemePatchPlan(base, {changes, clearOverrides})` previews dependency-aware output while preserving inherited pins; `emitThemePatchCSS(plan, base, options)` emits it after a base-identity check. See the [scope and migration guide](../../plans/theme-04-scopes.md) for runnable examples, appearance ownership, registration requirements and portal boundaries.

## Release authoring contract

See the [complete authoring and delivery contract](../../plans/theme-api-authoring-contract.md) for typed/managed layers, portable companion recipes, pressed presentation, family refinements, consumed-role provenance, rendered alpha validation and licensed font delivery. `fontStyle` is a bounded normal/italic/oblique token type. Opt into unknown library-hook diagnostics with `resolveTheme({warnUnknownComponentHooks:true})`.

`createThemeCompanion(theme, recipe)` supports finite component presentations over
documented public Parts as well as the existing typed hook assignments. A rule's
optional `roles` map supplies token IDs to the chosen presentation's declared
role names and types:

```ts
const companion = createThemeCompanion(theme, {
  schemaVersion: 1,
  id: 'compact-help',
  rules: [{
    target: 'tooltip', presentation: 'compact', tokens: {},
    roles: {paddingInline: 'space.2', paddingBlock: 'space.1', radius: 'radius.control'},
  }],
});
```

Unknown roles, incompatible token types, arbitrary selectors and CSS strings are
rejected. Omitted roles preserve component declarations; the selected presentation
may still establish its documented Part layout. Load the library's component
styles first, then theme CSS and the regenerated companion. Stylesheet order is
document order: a base stylesheet linked in the body can follow a companion in
the head. Named container style queries select the nearest full theme
boundary, including repeated same-name themes. Matching components and native
helpers on the boundary itself receive direct rules. Public hook expressions stay
on their consuming host or Part, so local overrides resolve there.

Companions reserve `--en-theme-companion` in the `container-name` list of every
`[data-en-theme]` boundary. Application declarations of `container-name` or the
`container` shorthand must retain that name, for example
`container-name: app-panel --en-theme-companion`. Omitting it can select an outer
boundary, causing missing presentation or loss of nested-theme isolation. Reserve
this name for full theme boundaries. Companion CSS does not set `container-type`
or add size containment. See the [authoring contract](../../plans/theme-api-authoring-contract.md)
for composition and cascade details.

Delivery requires custom-property container style queries, available in
[Firefox 151](https://www.firefox.com/en-US/firefox/151.0/releasenotes/) and
[Safari 18](https://webkit.org/blog/15865/webkit-features-in-safari-18-0/#style-queries).
The repository's pinned browser matrix is Chromium 153, Firefox 155 and WebKit 26.6.
Its author paint leaves forced colors to the component. The lower-level compiler emits one
light or dark branch; the repository's paired companion delivery adds automatic
appearance media rules. The eleven catalogue pairs retain independent trusted
branch sources and exact review-file roundtrips. See the contract above for
presentation scope, size/target limits and required rendered verification.
