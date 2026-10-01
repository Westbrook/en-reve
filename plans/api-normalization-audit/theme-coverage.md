# Theme customization coverage audit

**Historical audit, reconciled September 19, 2026.** Original evidence below describes the audited revision. Each finding now has a current disposition; use the [follow-up plan](#theme-decisions-follow-up-implementation-september-19-2026) for remaining work.

Source audit, 2026-09-18. This extends [styles.md](styles.md), especially CSS-01 through CSS-10; those findings remain applicable and are not counted again as new defects. Evidence uses repository-relative `source:line` references. Supporting name inventory: [theme-coverage.json](theme-coverage.json). No themes, runtime code, generated package assets, or tests were changed. Source inventory scripts ran without builds or browser execution.

The foundation can already vary palette, semantic color, typography, rhythm, density, absolute size roles, radius, focus, and selected motion/elevation. It does **not yet establish that three substantially different visual languages can be expressed consistently through the same supported system/family/concept/scoped contracts**. The immediate work is to clarify those contracts, fix demonstrably disconnected hooks, and reconcile the inventories. Adding an override for every numeric literal would not solve that problem.

## COVER-01. Built-in managed roles cover only part of the public CSS customization API

**Current disposition — Implemented with explicit boundary:** Managed choices and CSS-only hooks remain distinct supported authoring surfaces. See [THEME-05](#THEME-05). The following is retained original evidence.

**Classification: concrete capability difference; high-priority design decision, not 82 broken hooks.**

Read-only evaluation of the current source and registry yields:

| Inventory | Unique names |
| --- | ---: |
| Built-in source tokens, default light/comfortable source | 428 |
| Built-in `component.*` tokens | 126 |
| Finite full-theme reset hooks | 208 |
| Reset hooks backed by built-in component tokens | 126 |
| Reset hooks without a built-in typed token | 82 |
| Lexically annotated `@cssprop` names in element source | 250 |
| Annotated names absent from tokens, reset registry, and explicit state registry | 31 |

All 126 current component-token names are present in the reset registry. Counts concern **names**, not component consumers or rendered coverage. The annotation scan is a regex inventory, not a generated CEM or inheritance/forwarding audit. Mechanical state names were excluded using `packages/styles/src/metadata.ts:4-5`. An externally supplied source overlay can add a compatible typed role; “without a token” here means without a **built-in** role.

| Representative contract | Registered hooks | Built-in component roles | CSS-only registered hooks |
| --- | ---: | ---: | ---: |
| Shared control | 6 | 0 | 6 |
| Shared surface | 5 | 0 | 5 |
| Table | 14 | 0 | 14 |
| Navigation | 8 | 0 | 8 |
| Overlay, including focus | 12 | 5 | 7 |
| Button, including focus | 10 | 9 | 1 |
| Input, including focus | 10 | 10 | 0 |
| Option and option-list | 32 | 30 | 2 |
| Toast and toast-region | 28 | 25 | 3 |

The source declares only selected component families (`packages/tokens/src/source.ts:109-193`); the reset registry separately includes control/surface/table/navigation and other hooks (`packages/tokens/src/overrides.ts:19-52`). `managedEditors` enumerates `theme.tokens`, and `editorDescriptor` rejects unknown token IDs (`packages/tokens/src/admin.ts:24-29,81-87`). The CSS emitter clears registered hooks even when no token exists for them (`packages/tokens/src/css.ts:17-19`). Therefore resettable does not mean manageable, serializable as a built-in token pin, or present in the dependency graph.

Examples with meaningful theme impact are all five `--en-surface-*` hooks, all six shared `--en-control-*` hooks, fourteen `--en-table-*` hooks, and seven non-focus overlay hooks. A theme can style these using ordinary CSS but cannot expect the default managed editor to offer equivalent typed controls. Conversely, existing semantic roles already change their default paint; this is not an inability to theme those components at all.

**Proposed decision:** Give every supported hook an explicit contract record: semantic role or family override, type, owning family/concept, consumers, fallback/precedence, reset policy, size behavior, and whether managed authoring is supported. Promote cross-cutting paint and geometry first. Preserve a documented CSS-only category for CSS grammar such as `--en-select-appearance`, compound dimensions, and layout alignment when the token type system does not express them. Do not add arbitrary string tokens solely to reach 100% coverage.

**Migration:** Adding optional component aliases should keep unpinned full-theme emission as `initial`; indiscriminately emitting their resolved defaults would erase contextual fallbacks and selected-size behavior (`packages/tokens/src/css.ts:14-15`; `packages/styles/README.md:147-151`). New managed menus also need deliberate literal/alias choices, rather than automatic menus inferred only from a CSS property name.

## COVER-02. Reset/annotation reconciliation needs to include element-local styles and newer layout hooks

**Current disposition — Implemented:** Source-backed registry/reset checking is active; remaining per-component metadata and Parts checks belong to API-10. See [THEME-01](#THEME-01). The following is retained original evidence.

**Classification: expanded evidence for CSS-01; concrete full-boundary gap.**

The 31 annotated names missing from both token and reset inventories include the chat, calendar, plane/wheel, and editor maximum-size hooks already identified in CSS-01, plus these **11 additional names**:

| Additional hooks | Declared/consumed evidence |
| --- | --- |
| `--en-activity-viewport-size` | `packages/elements/src/activity-feed.ts:50`; `packages/styles/src/collaboration.ts:28` |
| `--en-carousel-viewport-size` | `packages/elements/src/carousel.ts:44`; `packages/styles/src/carousel.ts:13` |
| `--en-tree-viewport-size` | `packages/elements/src/tree/element.ts:35`; `packages/styles/src/tree.ts:94` |
| `--en-data-table-viewport-size`, `--en-data-table-min-inline-size` | `packages/elements/src/data-table/element.ts:31-33,48-50` |
| `--en-pagination-align` | `packages/elements/src/pagination/element.ts:35`; `packages/styles/src/pagination.ts:15,53` |
| `--en-progress-steps-gap` | `packages/elements/src/progress-steps/element.ts:32`; `packages/styles/src/form-navigation.ts:6,18` |
| `--en-validation-summary-padding`, `--en-validation-summary-radius` | `packages/elements/src/validation-summary/element.ts:25-26`; `packages/styles/src/form-navigation.ts:28` |
| `--en-editor-toolbar-background`, `--en-editor-toolbar-gap` | `packages/elements/src/editor-toolbar.ts:15-16,23-25`; gap wiring is separately broken in COVER-03 |

A virtual viewport's authored fallback size is a public layout choice, distinct from a measured row height, scroll offset, or data position. That does not automatically settle whether it should reset at a full theme boundary: it means the choice must be explicit. Existing `styleStateProperties` contains actual progress/split/navigation state names; it does not classify these viewport fallbacks (`packages/styles/src/metadata.ts:4-5`). Full resets therefore leave these inherited values in place today.

The metadata generator counts CSS annotations, but its coverage gate verifies catalog/tag/class matching, and its recorded limits explicitly exclude CSS usage verification (`tooling/metadata/generate-elements.ts:85-93,139-154`). A correct generated manifest consequently does not prove that a hook is consumed, reset, typed, or forwarded. `styleFamilies` is likewise a manually maintained list (`packages/styles/src/metadata.ts:7`); its omissions noted in CSS-01 should be fixed by an inventory rule, not one more hand-maintained list.

**Proposed decision:** Reconcile **all** production styling sources, including CSS inside element modules. Classify the 31 names as managed, CSS-only/resettable, or deliberately inheritance-preserving layout configuration. Require an explicit exception for the last category. Keep mechanical inputs outside theme reset. This extends CSS-01's scope; it is not a second independent reset defect.

**Migration:** Resetting existing layout hooks can change nested layout. The release explanation must point consumers who want inheritance to partial scopes or a documented configuration category. An additive lint/inventory check should detect raw `var()` hook additions as well as typed `override()` calls; the helper's type constraint currently protects only names passed to it (`packages/styles/src/internal/values.ts:22-24`).

## COVER-03. Editor-toolbar has a disconnected public gap and an unmatched error token

**Current disposition — Fixed:** Toolbar gap has a reader and semantic danger text replaces the unmatched error token. See [THEME-06](#THEME-06). The following is retained original evidence.

**Classification: new concrete source defects; medium priority.**

`--en-editor-toolbar-gap` is documented as space between controls, but is assigned to `--en-toolbar-gap` on the nested toolbar (`packages/elements/src/editor-toolbar.ts:16,25`). The actual toolbar gap is `space.actions`, with no `--en-toolbar-gap` fallback (`packages/styles/src/commands.ts:142-147`; the legacy selection recipe also directly uses `space.actions` at `packages/styles/src/selection.ts:40`). Searching production styles and elements finds no reader of `--en-toolbar-gap`. The public toolbar-specific gap therefore cannot reach the layout it claims to control.

The toolbar's validation error also uses `color:var(--en-color-danger)` without a fallback (`packages/elements/src/editor-toolbar.ts:28`). The semantic token is `color.danger-text` (`packages/tokens/src/source.ts:13-24`), used by ordinary field errors (`packages/styles/src/controls.ts:351`). With standard theme output the toolbar declaration becomes invalid and inherits the surrounding text color instead of following the danger role. A consumer could supply the unmatched name manually, but that is not the built-in contract.

**Proposed decision:** Route toolbar gap through a real shared toolbar geometry hook or style the nested `base` part with the documented editor-specific value; then register/classify the public hook. Use the established danger text role with a token fallback. A future targeted check should show that changing only `--en-editor-toolbar-gap` changes computed gap, and that danger-text customization changes the toolbar rejection text.

**Related but not automatically the same defect:** Rich-editor selected-node outline reads `--en-color-focus-ring` and falls back to action color (`packages/styles/src/rich-text-editor.ts:10`), while the current theme defines `color.focus` (`packages/tokens/src/source.ts:13-24,64`). Decide whether node selection is conceptually selection paint or keyboard focus before renaming that hook; node selection should not be silently equated with focus. Wheel's unmatched label weight is already CSS-06.

## COVER-04. Typography roles exist, but semantic adoption is uneven

**Current disposition — Implemented with documented membership:** Data, input, body, heading and suggestion typography are adopted; compact annotations retain deliberate treatments. See [THEME-06](#THEME-06). The following is retained original evidence.

**Classification: source-verified theme reach gap; medium-priority role decision.**

The system supplies separate body/UI/data/metadata/heading font family, size, line-height, and weight roles, plus input and strong-label defaults (`packages/tokens/src/source.ts:73-87`). Foundations apply UI typography (`packages/styles/src/foundations.ts:22-28`); opt-in native typography applies the full body/data/metadata/heading roles (`packages/styles/src/typography.ts:11-35`). This is a sound starting point for distinctly styled themes.

The following differences constrain a theme author who changes one semantic typography role expecting matching concepts to follow:

- Native table content uses `font.ui.family` alongside data size and data line-height, and does not set data weight (`packages/styles/src/table.ts:42-49`). The `.en-data` recipe uses data family **and** data weight (`packages/styles/src/typography.ts:33-35`). A theme with a separate data font will visibly diverge. This may be intentional UI-table policy; it needs a stated mapping rather than a promise that “data typography” uniformly owns tables.
- Rich-editor headings use browser/default heading sizing and hardcoded `1.25` line-height; paragraphs and lists use fixed em rhythm (`packages/styles/src/rich-text-editor.ts:4-8`). It does not consume the heading/body role set used by the public typography recipes. Styling the editor part can establish a base font, but its internal `h1/h2/h3` have no separate parts, so a consumer cannot reproduce all independent heading roles through ordinary external `::part(editor)` declarations. Review the document model's supported blocks before deciding whether these should map to shared prose roles or explicit editor-content roles.
- Presence status/time and editor suggestion descriptions use `.875em` (`packages/styles/src/collaboration.ts:16,38`; `packages/styles/src/token-editor.ts:49`). Calendar weekday/range-status similarly use `.875em`, with weights `500`/`600` (`packages/styles/src/calendar.ts:9,12,35`); toast-history headings use `600` (`packages/styles/src/toast.ts:33`). These are cosmetic defaults outside the corresponding metadata/label role choices. Relative `em` is not inherently wrong; the missing decision is whether these are independent compact annotations or members of the shared metadata concept.

**Proposed decision:** Publish a concept-to-consumer typography matrix. Decide data-table and editor-document mappings first, then replace only literals belonging to an agreed shared role. Preserve role independence and consumer-owned/slotted typography. Rich/token editor host size/foundation adoption remains CSS-02, and label/input-family reach remains CSS-03.

**Scoped constraint to document:** A raw descendant assignment to a base semantic token does not recompute inherited aliases and derived size outputs. The supported rebase is a resolved full-theme boundary; direct family pins or selected-size output overrides have different semantics (`packages/tokens/README.md:138-140`). This is an explicit CSS/token-graph boundary, not evidence that nested themes generally fail.

## COVER-05. State and surface concepts need membership rules before adding more tokens

**Current disposition — Implemented with deliberate exceptions:** Button state refinements and THEME-06 single-date option paint are connected; calendar ranges retain specialized behavior. See [THEME-03](#THEME-03). The following is retained original evidence.

**Classification: design normalization opportunity; medium priority.**

Current component families expose different useful subsets:

| Concept | Existing reach | Consequence for a highly distinct theme |
| --- | --- | --- |
| Selectable option paint | Shared rest/selected/active/hover/pressed/disabled plus weights (`packages/styles/src/internal/option-paint.ts:33-64`) | Strong contract; editors/calendar have the adoption gaps already in CSS-04/CSS-07. |
| Disabled control | Shared muted/surface-subtle/boundary colors (`packages/styles/src/internal/control-shared.ts:28-33`) | No independent semantic disabled paint set; changing muted text also changes metadata elsewhere. Color controls use `.55` opacity and calendar `.45` instead (`packages/styles/src/color-slider.ts:37`; `color-wheel.ts:17`; `color-picker.ts:36`; `calendar.ts:40`). |
| Semantic notifications | Toast has general plus per-variant background/color/border/icon (`packages/styles/src/toast.ts:6-13`) | Alerts have three broad hooks and semantic border/icon defaults; badges have broad fill/text with semantic text variants (`packages/styles/src/feedback.ts:9-25`). An inverted warning fill/text pair requires scoped CSS or Parts on alert/badge, unlike the managed toast variant roles. |
| Shared container surface | Panel/card consume `--en-surface-*` (`packages/styles/src/surfaces.ts:7-19`) | Chat, collaboration, carousel, and table use their own family hooks directly over semantic defaults (`chat.ts:5`; `collaboration.ts:9,36`; `carousel.ts:43`; `table.ts:17-20`). A “surface family” pin does not cover all visible containers. |

No defect is claimed merely because a date cell, disabled color preview, badge, and alert differ. A disabled preview may need its color sample to remain recognizable; a success badge may deliberately remain neutral. The issue is discoverability and the ability to style an agreed **concept** independently without repeating selectors across every component.

**Proposed decision:** Define membership for “surface”, “action”, “field”, “selection”, “metadata”, “status”, and “disabled”. Then decide whether each concept uses a semantic role, a cross-family override, scoped component hooks, or documented Parts. Keep neutral defaults. Add status background/on-status pairs or disabled roles only if the planned themes need independent treatment. Do not reinterpret current `--en-surface-*` as universal without migration.

**Precedence constraint:** Shared control padding already wins over input/button padding, while option-list hooks refine overlay hooks (`packages/styles/README.md:128-132`; `packages/styles/src/commands.ts:8-13`). Broad button fill intentionally pins hover/pressed (`packages/styles/src/internal/button-rules.ts:18,29-30`). These existing contracts should be listed explicitly; changing them to make a new universal hierarchy requires a compatibility decision.

## COVER-06. Geometry, elevation, and decorative styling need a selective escape-hatch policy

**Current disposition — Documented boundary:** Public Parts handle card elevation and instance geometry. Input-only geometry and family elevation remain optional new capabilities. See [THEME-05](#THEME-05). The following is retained original evidence.

**Classification: theme breadth decision, with source evidence; medium priority.**

System radius, border width, rhythm, sized geometry, and two semantic elevations already exist (`packages/tokens/src/source.ts:37-72,100`). Overlays consume overlay/dialog shadows (`packages/styles/src/overlays.ts:26,31,71`), options expose a list-shadow override (`packages/styles/src/token-editor.ts:43`), and toast exposes a shadow override (`packages/styles/src/toast.ts:6`). The token compiler supports multi-layer and inset shadows; one-layer defaults are not a compiler limitation (`packages/tokens/src/value.ts:34-37,52`).

Panel/card, chat, collaboration, carousel slide, and table surfaces have no comparable family shadow hook (`packages/styles/src/surfaces.ts:7-19`; `chat.ts:5`; `collaboration.ts:9,36`; `carousel.ts:43`; `table.ts:15-20`). Their parts can support bespoke shadow/border/background styling, subject to the composite forwarding gaps in CSS-08/CSS-09. A theme wanting raised cards but flat overlays can therefore use Parts, but the same change cannot currently be expressed uniformly as a managed family elevation choice. Background gradients, border style, texture, skewed shapes, and per-corner radii are likewise outside the current typed color/dimension roles; some can be expressed through raw CSS properties/Parts.

Prioritize these **cosmetic candidates**, without treating this as an exhaustive literal count:

- Carousel picker decoration fixes `3px` indicator thickness, `2px` indicator radius, `.4rem/.15rem` inset, `.3rem` thumbnail padding, and `1.4` number line-height (`packages/styles/src/carousel.ts:29-34`). Main radius and gap already have hooks; the indicator/thumbnail vocabulary does not. Picker/thumbnail parts exist (`packages/elements/src/carousel.ts:675-677`), so decide whether Parts are the intended boundary or repeated theme needs justify named roles.
- Calendar day border is `1px`, range endpoints `2px`; these ignore the generic border-width role (`packages/styles/src/calendar.ts:27,33`). Preserve an independent visible state indicator if system border width changes; a range indicator should not automatically alias the ordinary border.
- Plane/preview borders and color-thumb dual outlines are literal (`packages/styles/src/color-picker.ts:11,31-32`; `packages/styles/src/color-wheel.ts:12`). Their dark/light dual contour has a functional reason over arbitrary color data. A brand theme must not blindly replace that with a single palette color. Semantic size/radius fallback issues remain CSS-06.

Do **not** count reset zeros, `min-inline-size:0`, `100%`, grid fractions, local stacking order, visually-hidden `1px`, one-turn rotation, circular hue geometry, slider translation, or black/white masks as missing theme tokens. These encode containment, mechanics, shape semantics, or data visualization. Fixed breakpoints also require a generated query or component configuration: custom properties cannot directly change a media/container threshold. The source already documents this for content thresholds and dialog responsive queries (`packages/styles/src/content.ts:7-10`; `packages/styles/src/overlays.ts:8-9`); color-plane and progress-steps have fixed `34rem` and `30rem` container thresholds (`packages/styles/src/color-picker.ts:37`; `packages/styles/src/form-navigation.ts:15`). Their future review should focus on changed text/geometry fitting, not tokenizing them indiscriminately.

**Proposed decision:** Define the promised theme envelope. A “token-complete” theme can reasonably cover palette, semantic typography, space, radius, border width, state paint, focus, and supported elevation/motion. An art-directed theme requiring textures, unique shapes, or document-specific typography needs a maintained stylesheet/Parts layer. Record every such exception in the future theme package. Avoid claiming that arbitrary visual systems require no component-specific CSS.

## COVER-07. Managed menus, typed compiler, and raw CSS have different expressive limits

**Current disposition — Documented boundary:** Code fonts/shadows and CSS escapes remain supported; typed Display-P3 requires a separate coordinated extension. See [THEME-05](#THEME-05). The following is retained original evidence.

**Classification: documented capability boundaries; explicit decision before theme production.**

| Dimension | Managed default authoring | Typed/code capability | Relevant limitation |
| --- | --- | --- | --- |
| Fonts | Choices are font-family values already present in the theme (`packages/tokens/src/admin.ts:73`) | Nonempty family strings/lists and weights 1–1000 (`packages/tokens/src/value.ts:31-32,51`) | Default source seeds only system/sans stacks plus monospace (`packages/tokens/src/source.ts:73-87`). A new serif/display stack needs a code-authored baseline/source extension or a broader approved menu. Font asset loading remains application/theme-package work. |
| Shadows | Choices are shadow values already present (`packages/tokens/src/admin.ts:77`) | Structured one/many layers with inset support (`packages/tokens/src/value.ts:34-37,52`) | New shadow recipes need code/baseline seeding; current defaults do not prove a one-layer restriction. |
| Color | Opaque by default, with a finite alpha-enabled set (`packages/tokens/src/admin.ts:7-21,31,88`) | Typed colors support sRGB and alpha only (`packages/tokens/src/types.ts:2`; `value.ts:25-27,44`) | Display-P3 literals supported by the color picker are **not** preserved by the theme compiler's color model (`packages/elements/src/color-picker/element.ts:15,200-217`). Wide-gamut themes need a declared sRGB baseline/fallback or a scoped compiler extension with emission/derivation/review work. |
| Geometry | Curated choices and aliases (`packages/tokens/src/admin.ts:32-70`) | Typed dimensions are `px` or `rem` (`packages/tokens/src/types.ts:3`; `value.ts:24,28`) | CSS expressions, `clamp()`, viewport/container units, multi-value radius, and keyword values remain raw CSS/Parts unless represented by an explicit supported adapter. |
| Motion | Finite durations/easing/scales (`packages/tokens/src/admin.ts:34,72,75-76`) | Source provides enter/exit, focus motion, offset/scale (`packages/tokens/src/source.ts:88-99`) | The primitives deliberately limit certain motions: focus contour remains immediate, anchored surfaces retain stable coordinates, drawers remain unscaled. These are interaction constraints, not missing arbitrary keyframe tokens. |

Custom code can broaden font/shadow values without changing the token type system. It cannot submit a Display-P3 color to `validateValue` and expect it to survive as P3. Raw CSS color hooks may accept wider CSS syntax, but that bypasses typed candidate validation and derived color calculations. Keep those claims separate.

**Proposed decision:** Specify whether the future three themes must be authored entirely in the managed UI, may seed typed baselines in code, or may include maintained raw CSS/Parts. This determines whether font/shadow menu work is required. If no theme needs wide gamut or arbitrary CSS values, record the limitation and retain the simpler compiler; do not enlarge its scope speculatively.

## COVER-08. Future theme acceptance should test transferability, not just screenshots

**Current disposition — Implemented and accepted:** Three divergent themes and transfer/scope fixtures are delivered; native-platform validation remains separately tracked. See [THEME-08](#THEME-08). The following is retained original evidence.

**Classification: proposed verification scope; no themes or fixes requested/implemented here.**

Use the same specimen and scenarios for three intentionally different theme packages. Choose their actual aesthetics later; the important axes are independent typography, compact versus expansive geometry, flat versus raised surfaces, sharp versus rounded containers, and different state/status treatments. Merely swapping accent colors and light/dark mode would not exercise the identified contracts.

The eventual review should establish:

1. **System:** full theme output controls representative typography, space, radius, border, focus, elevation, and motion; aliases and sized outputs rebase correctly.
2. **Family:** one input/option/surface/action override reaches the documented members and leaves nonmembers predictable. State-specific hooks retain the declared precedence.
3. **Concept:** agreed metadata, selected, disabled, status, and surface roles have a traceable consumer matrix. Special range/color-data semantics stay intentional.
4. **Scope:** root theme, nested full theme, nested partial scope, size small/medium/large/inherit, and host/Part overrides have explicit expected results. The 31 unclassified hooks need a policy before those expectations can be complete.
5. **Composition:** nested buttons, pagination, errors, editor controls, and table paint are reachable through the declared Parts/forwarding contract; CSS-08/CSS-09 remain dependencies.
6. **Usability:** long/localized content, RTL, text resizing, keyboard focus, coarse/mixed pointer targets, reduced motion, forced colors, and responsive fit still work under the theme's actual geometry. Existing CSS-05 and breakpoint limits should inform the cases.

Source-level inventory checks can establish that a name is registered/typed/documented; only targeted rendered checks can establish that it reaches the intended surface and preserves layout/state distinctions. Counts here are not an accessibility or theme-completeness score.

## Inventory reproduction

The supporting JSON was produced from current TypeScript sources with Node 24.16.0 and `--experimental-transform-types`, resolving local token `.js` imports to their `.ts` sources in memory. No stale `dist` snapshot was used. This minimal read-only command reproduces the principal counts; it does not write or build anything:

```sh
node --experimental-transform-types --input-type=module <<'NODE'
import fs from 'node:fs';
import path from 'node:path';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next) {
  if (s.startsWith('.') && s.endsWith('.js') && c.parentURL?.includes('/packages/tokens/src/')) s=s.slice(0,-3)+'.ts';
  return next(s,c);
}});
const {sourceTokens}=await import('./packages/tokens/src/source.ts');
const {flattenTokens}=await import('./packages/tokens/src/graph.ts');
const {cssName}=await import('./packages/tokens/src/value.ts');
const {styleOverrideNames}=await import('./packages/tokens/src/overrides.ts');
const ids=Object.keys(flattenTokens(sourceTokens));
const tokens=new Set(ids.map(cssName)), registry=new Set(styleOverrideNames);
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>
  e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith('.ts')?[path.join(d,e.name)]:[]);
const annotated=new Set(walk('packages/elements/src').flatMap(p=>
  [...fs.readFileSync(p,'utf8').matchAll(/@cssprop\s+(--en-[a-z0-9]+(?:-[a-z0-9]+)*)/g)].map(m=>m[1])));
const metadata=fs.readFileSync('packages/styles/src/metadata.ts','utf8');
const stateLine=metadata.split('\n').find(l=>l.includes('export const styleStateProperties'));
const state=new Set(stateLine.match(/--en-[a-z0-9]+(?:-[a-z0-9]+)*/g));
console.log({tokens:ids.length, componentTokens:ids.filter(i=>i.startsWith('component.')).length,
  resetNames:registry.size, resetNamesWithoutBuiltInToken:[...registry].filter(n=>!tokens.has(n)).length,
  annotatedNames:annotated.size,
  annotatedWithoutTokenResetOrState:[...annotated].filter(n=>!tokens.has(n)&&!registry.has(n)&&!state.has(n)).length});
NODE
```
