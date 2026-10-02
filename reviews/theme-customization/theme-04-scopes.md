# THEME-04: explicit scopes and dependency-aware patches

THEME-04 retains full rebasing and exact partial inheritance, repairs paired shadow-host selectors, and adds explicit optional-hook release and a reviewable graph patch. It consumes THEME-01's registry and preserves THEME-02's fallback order and THEME-03's state semantics.

## Three different operations

| Intent | API | Result |
| --- | --- | --- |
| Independent theme | `emitThemeCSS(theme)` or `emitThemePairCSS(pair)` | Redeclare the theme schema and reset installed optional hooks. Literal optional defaults remain literal defaults. Mechanical/configuration and arbitrary application properties are preserved. |
| Exact assignment | `emitThemeCSS(theme, {kind:'partial', tokenIds:[...]})` | Emit exactly the selected IDs, including an alias for a selected unpinned component token. Unselected hooks inherit. This existing behavior is unchanged. |
| Clear optional override | Partial output with `clearOverrides:[CSS names]` | Emit `initial` for registered optional hooks; the component uses its point-of-use fallback. This is different from inheriting or assigning the graph's default alias. |
| Change a concept and its dependents | `createThemePatchPlan(base, options)`, then `emitThemePatchCSS(plan, base, options)` | Preview and emit affected semantic outputs at a new boundary while retaining inherited pins and unpinned optional hooks. |

Omission means inheritance. It does not remove a previous declaration from an installed stylesheet: replace that scope's generated stylesheet when replacing a patch. Clears accept registry entries with `reset: 'theme'`; semantic, mechanical, configuration and unknown CSS names are rejected. Assignment and clearing of the same hook conflict. Compatible property registrations (wildcard, inherited, no initial) preserve this behavior. An application that gives optional hooks typed registration initials has explicitly changed their reset/fallback semantics.

## Runnable spacing example

Run after building `@en-reve/tokens` (from the repository root, use `node --input-type=module`):

```js
import {
  resolveTheme, createThemePatchPlan, emitThemePatchCSS, emitThemeCSS,
} from './packages/tokens/dist/index.js';

const base = resolveTheme();
const plan = createThemePatchPlan(base, {
  changes: { 'rhythm.base': {value:0.5, unit:'rem'} },
});
console.log({
  declarations: plan.outputTokenIds,
  evaluationInputs: plan.evaluationTokenIds,
  preservedPins: plan.preservedPinTokenIds,
  clearedHooks: plan.clearOverrides,
});
console.log(emitThemePatchCSS(plan, base, {selector:'.settings-panel'}));

// Low-level exact selection remains available and does not expand.
console.log(emitThemeCSS(plan.theme, {
  selector:'.exact-panel', kind:'partial', tokenIds:['rhythm.base'],
}));
```

At a 16px root font size, a default medium button has 12px inline padding. The exact descendant rhythm declaration leaves it at 12px because inherited aliases were computed at their ancestor boundary. The graph-aware patch redeclares the affected spacing aliases and sized outputs beside the changed rhythm, yielding 24px. The generated CSS uses the existing token layer and does not override higher-priority application declarations.

The planner reports evaluation inputs separately from emitted outputs: for example, `size.scale-medium` is needed to evaluate a sized spacing output but does not itself need redeclaration. Compile-time recipes, including action hover/pressed and contrast foreground colors, are re-resolved too. Optional unpinned component aliases are not automatically emitted: doing so would install pins and suppress the existing size-aware fallbacks.

## Preserve intentional pins

The required base is the **effective authored theme**, including source overrides and pins. The planner cannot discover arbitrary runtime CSS overrides. Supply those as typed base pins where supported, or retain responsibility for their cascade in application CSS.

Inherited pins are barriers to propagation. An inherited alias pin has already computed at the base boundary, so the evaluation graph preserves its resolved value without redeclaring it locally. Explicitly include that token in `changes` to rebind the alias locally. Dependent outputs behind a preserved pin stay inherited. The original base is immutable; `plan.theme` is an evaluation snapshot, not a replacement for the original authored source or a general live DOM theme manager.

Emission requires the same base source identity as planning. A changed base raises `stale-base`; prepare and inspect a new plan. The patch is scoped to one resolved appearance and inherits native color-scheme. If the ancestor's authored theme, pins or appearance changes, regenerate from that effective branch. Existing paired partials continue to own independent Auto/Light/Dark behavior; this change does not redefine them as appearance-inheriting pairs.

## Release an optional hook

```js
const base = resolveTheme({
  pins: {'component.button.radius': {value:29, unit:'px'}},
});
const plan = createThemePatchPlan(base, {
  clearOverrides: ['--en-button-radius'],
});
const css = emitThemePatchCSS(plan, base, {selector:'.local-controls'});
// Emits --en-button-radius: initial; no local base-radius alias.
```

The patch removes matching source-authored and explicit pins from the evaluation graph. A large button now uses the existing large semantic radius (10px in the default theme) rather than the parent's 29px pin. If a custom graph token aliases the optional hook being cleared, the planner rejects the operation with `clear-dependent`; explicitly redirect that token to a semantic input in `changes` first. Clearing an optional CSS hook makes it invalid/unset and cannot promise a valid value to arbitrary graph dependents. CSS-only hooks can also be cleared through their registry names, including the six THEME-03 state hooks. Full boundaries obtain their reset coverage from the installed registry; this implementation does not maintain a second hook list.

## Target a shadow host explicitly

```js
import {createThemePair, emitThemePairCSS} from './packages/tokens/dist/index.js';
const pair = createThemePair({
  name:'panel',
  light:resolveTheme({mode:'light'}),
  dark:resolveTheme({mode:'dark'}),
});
const css = emitThemePairCSS(pair, {target:'shadow-host'});
// Install inside the host's shadow root; appearance is set on the host.
```

Targets are `root`, `element` (named theme or caller selector), and `shadow-host`. Existing `scope` calls remain supported; do not combine `scope` and `target`. A legacy bare `selector: ':host'` now receives the same repair. The dark branch is `:where(:host([data-en-appearance="dark"]))`; Auto conditions likewise live inside `:host(...)`. Light/dark geometry works with and without the optional `light-dark()` enhancement.

Complex code-authored selectors are not parsed or rewritten. For a custom host condition or appearance attribute, supply the entire branch selectors:

```js
emitThemePairCSS(pair, {
  selector: ':host(.panel)',
  appearanceSelectors: {
    auto: ':host(.panel:not([data-mode]))',
    light: ':host(.panel[data-mode="day"])',
    dark: ':host(.panel[data-mode="night"])',
  },
});
```

A document stylesheet does not reach independently themed internal shadow-tree boundaries. Install theme CSS in the tree containing each such boundary. Ordinary inherited themes do not require copying a full stylesheet into every component.

## Overlays and destination ownership

Native `showModal()` and `showPopover()` put surfaces in the top layer without reparenting them: their original theme ancestry is retained. A real portal/reparent inherits the destination DOM scope. Applications should choose a destination in the original theme, install an equivalent managed boundary there, or intentionally adopt the destination theme. No theme-copying service is added to existing native overlays.

## Verification

```sh
npm test -w @en-reve/tokens
npm run build -w @en-reve/styles
node packages/tokens/test/scope-browser/probe.mjs
node packages/tokens/test/paired-browser/verify.mjs
```

The focused browser probe uses the actual built foundation/button styles in Chromium, Firefox and WebKit, with and without compatible registrations. It checks exact versus dependency-aware spacing, inherited alias pins, selected-size fallback after clearing, recalculated color recipes, host Auto/Light/Dark including media fallback, and full versus partial behavior for the installed hook registry. Evidence defaults to `node_modules/.cache/theme-04-scopes/results.json`; set `SCOPE_TEST_OUTPUT_DIR` to retain it elsewhere.
