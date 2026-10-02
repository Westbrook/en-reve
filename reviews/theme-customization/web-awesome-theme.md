# Web Awesome-inspired theme

The `web-awesome-inspired` paired theme uses **Web Awesome 3.13.0's Default theme, Default palette and blue brand**. It is available through the shared En Reve theme catalogue in Showcase, API examples and Component Patterns. Exported paired JSON can be reopened in Theme Review and applied to the workflow/sticker-sheet previews; the CSS download includes the token pair and variant companion for application use. The reference library is installed only in `showcases/web-awesome`; En Reve's root packages gain no Web Awesome runtime or style dependency.

This is an En Reve interpretation of the reference's default visual system. The separate `Awesome` and `Shoelace` themes and paid themes are not inputs. Existing En Reve component anatomy, accessibility behavior, responsive target floors and lifecycle remain in place. This theme is not used to replace or restyle any native-library benchmark fixture or the frozen En Reve baseline.

## Source and mapping

The authoritative sources are the [official built-in theme instructions](https://webawesome.com/docs/themes/), [design tokens](https://webawesome.com/docs/tokens/), and exact installed `@awesome.me/webawesome@3.13.0` CSS. The checked source archive and hashes are in reference-sources.json (`artifacts/web-awesome-theme/reference-sources.json`). The native showcase uses the same version and default stylesheet.

| Area | Native default source | En Reve treatment |
| --- | --- | --- |
| Light surfaces | White default/raised; Gray 95 lowered; Gray 90 decorative border | Independent light palette, same source values |
| Dark surfaces | Gray 05 default; Gray 10 raised; default mixed with 20% black lowered; Gray 20 border | Independent dark palette, resolved sRGB for the mixed lowered surface |
| Text and links | Gray 10/95 normal, Gray 40/60 quiet; Blue 40/70 links | Semantic text, muted text and action-text roles |
| Brand | Blue 50 (`#0071ec`) accent fill; blue quiet/normal scales | Shared brand/action source with independent text and selected roles |
| Typography | System sans; 16px medium; weights 400/500/600; body line-height 1.6, control/heading 1.2 | Body, UI, input, metadata and heading roles; 20/25/32px heading scale at the default root size |
| Controls | 6px radius, 43px medium height at 16px root, 16px horizontal padding | Corresponding public geometry tokens; content expansion and protected targets retained |
| Choice and switch | 20px choice, 35×20px switch, 12px thumb | Visual sizing tokens; native En Reve interactive target floor retained |
| Panels and cards | 12px radius, 24px content spacing, small shadow | Panel/card tokens and structured shadow values |
| Focus | Blue 60, 3px ring, 1px offset | Same geometry; Blue 50 on light surfaces to exceed 3:1, source Blue 60 in dark mode; no delayed halo |
| Buttons | Brand accent, neutral outlined/plain, danger accent; scale 0.9875 while pressed | Four existing En Reve variants via trusted companion recipe; 75ms press/release, reduced motion honored |
| Options | 3px radius, 16px inline/8px block inset, normal neutral hover fill | Public option tokens; selected-state behavior remains En Reve's |
| Elevation | Offset/blur/spread scales; 12% light shadow, 72% dark shadow | Small card, medium overlay and large dialog structured shadows |
| Motion | 75ms fast, 150ms normal, 300ms slow, CSS ease | Button and surface timing tokens; anchored popup geometry remains stable |
| Toast | Raised surface, neutral border, 6px radius, 16px medium padding, semantic accent | Public toast paint/spacing/shadow tokens; semantic icons carry accent (no matching native accent-rail token) |

The recipe consists of `inspired/web-awesome.light.json`, `inspired/web-awesome.dark.json`, and one canonical definition with authoritative source typography, structured shadows, geometry refinements and bounded variant companion. The initial recipe used existing public token APIs. The fidelity follow-up below adds narrowly scoped, typed companion typography support; no private shadow selector is used.

## Deliberate adaptations

- Native Web Awesome's light accent active state mixes 10% white into Blue 50 and Red 50. With white text, these resolve to approximately **3.81:1** and **3.84:1**. The inspired theme uses the same palette's Blue 40 and Red 40 for those held states, preserving readable text; the native benchmark keeps its upstream behavior. Dark accent active states retain the source's 20% dark-surface mix.
- Functional boundaries use Gray 50 in dark mode instead of source Gray 40, exceeding 3:1 against both default and raised surfaces. Light focus uses Blue 50 instead of Blue 60 (source Blue 60 measures 2.995:1 against white). Decorative borders retain the source colors.
- Dark neutral outlined/plain button ink uses Gray 70 rather than the source's Gray 60. This preserves contrast on raised En Reve contexts and transient hover fills. Ordinary muted text still maps to the source Gray 60.
- Layout density and minimum targets remain En Reve contracts. Source-relative font rounding is represented by typed rem values at the normal 16px root; native `round()` steps under unusual root font sizes are not reproduced exactly.
- Native toast accent rails, exact keyframes and component-specific animation choreography do not have equivalent public En Reve inputs. The theme maps exposed paint, geometry and timing roles, retaining En Reve reduced-motion and anchored-position behavior.
- Source colors mixed in Oklab are resolved into the compiler's supported sRGB color representation. The source values and recipe identities are retained in the evidence.

## Validation

The focused checks cover canonical catalogue inclusion, independent light/dark replay and exact export/reopen/undo; action-state contrast on default and raised surfaces, functional boundaries and focus; actual browser styles, motion and variant companion delivery; mobile RTL layout and shared selector discovery; and Theme Review/workflow import paths. Exact outcomes, source hashes, build identity and browser versions are recorded in verification.json (`artifacts/web-awesome-theme/verification.json`).

The shared API-example and Theme Review preview controllers now install the trusted variant companion alongside theme tokens. Their temporary theme-name boundaries are restored only while still owned by the controller. Known paired presets are reopened against the code-owned catalogue baseline. Other internally generated preview pairs retain the existing validated-envelope behavior (including the density-specific baseline frame); external review-file intake retains its stricter catalogue/default-baseline checks. Imported CSS is regenerated rather than executed. An existing Radix theme and custom paired edit/reset journey are included in the browser checks.

Reproduce with the normal token build and docs build, then `node --test tooling/theme-candidates/catalogue.test.mjs packages/tokens/test/toast-themes.test.mjs`. Against the completed built docs, run the existing `theme-refresh.config.ts` and `theme-adoption.config.ts` suites filtered to `web-awesome-inspired`, and the `theme-review-pair.spec.ts` paired edit/density/reset journey. The full theme-regression runner discovers the new canonical recipe for future checks.

No claim of pixel equivalence, whole-system WCAG conformance, manual assistive-technology review or physical-device coverage is implied by these focused checks.

## Fidelity follow-up

The subsequent [component-by-component fidelity review](web-awesome-theme-fidelity.md) refines the page canvas, general UI weight, badge typography/paint/corners, progress and range geometry, avatar size and resting tabs. It also extends trusted companions with validated public typography roles and badge/tab/choice targets, keeping exports portable. That review supersedes the original claim that no authoring mechanism changed, and distinguishes remaining API gaps from authored showcase/capability differences. Earlier evidence above remains the receipt for the first recipe; current verification is in `artifacts/web-awesome-fidelity/`.
