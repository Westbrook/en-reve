# Original themes: creative API exercise

Status: authored and checked through the current compiler and managed editor. All six desktop appearances were visually reviewed on the shared showcase. The final browser matrix passes all original-theme mobile, RTL, 200% text and reduced-motion cases in Chromium, Firefox and WebKit; forced colors pass in Chromium/Firefox with the WebKit emulation limitation explicitly skipped. This note supplies the original-theme findings for that report.

## Design intent

| Theme | Appearance | Typography and geometry | Behavior and detail |
| --- | --- | --- | --- |
| **Vellum** | Warm paper, oxblood actions, brown ink; warm charcoal and manuscript pink in dark mode | Serif body, controls and headings; 3rem display, 1.125rem body with 1.75 leading, 55ch prose; small 4px corners, fine rules and icon strokes | Restrained 2px surface travel, quiet layered elevation, editorial inline tokens, inverted warm toast surfaces, gold field accent and fine option focus |
| **Signal** | Porcelain, near-black and fluorescent yellow; independently authored dark olive surfaces | Monospaced text, 2.5rem display, 75ch prose, 2px borders, square controls and surfaces | Hard 6px/10px offset shadows, 60ms control feedback, linear easing and no surface travel; high-visibility yellow selection with dark ink, compact data and color tools |
| **Kinetic** | Coral identity, violet actions and mint collaboration surfaces; midnight violet with lilac actions in dark mode | Rounded local font stack, 3.5rem heavy display, 1.125rem controls, 45ch prose; 5px base rhythm, pill actions and 32px containers | Two-/three-layer colored elevation, 8px surface travel and 0.95 modal entry scale, expressive eased motion, wide toast cards, oversized color-tool handles, layered focus halo |

All six appearances use the same component implementations and portable theme artifacts. No theme-specific markup, selector overrides, remote fonts, images, layout rewrites or new theme APIs were added. Font appearance depends on available local fonts; every stack ends with a generic family.

## Authoring model and coverage

The current public code API already supports arbitrary valid font stacks, display sizes, weights and structured multilayer/inset shadows. The managed editor intentionally offers values seeded from its baseline. Consequently each original uses a trusted, explicit `baseOptions` source document for each appearance, then replays ordinary managed token edits. This is existing `createReviewDraft(baseOptions)` behavior, not an extension to token value types.

Every appearance has **196 managed edits**. Vellum and Signal each use **11 source definitions** and **202 distinct configured token IDs** after accounting for overlap; Kinetic uses **12 source definitions** and **203 distinct configured token IDs**. The source document establishes the font family, seven size metrics, a heading weight, and two shadows; Kinetic also establishes a typography-independent 60px control minimum. Managed edits compose the family across all consumed type roles and author the remaining behavior. This is intentionally broad composition, not a claim that all pins are necessary for every application.

Managed-edit counts per appearance:

| Area | Edits |
| --- | ---: |
| Palette and semantic color | 27 |
| Typography | 31 |
| Rhythm, spacing, radius, borders, size, layout and surface padding | 31 |
| Shared focus | 5 |
| Motion, duration and easing | 12 |
| Button, input and segmented-control refinements | 8 |
| Options and option lists, including focus and states | 27 |
| Calendar and radio state refinements | 3 |
| Toast and toast-region paint/geometry | 13 |
| Inline editor tokens | 10 |
| Color sliders and color pickers | 8 |
| Rating and pagination | 4 |
| Presence, presence group, activity and carousel | 17 |
| **Total** | **196** |

Vellum retains 85 alias edits, Signal 71 and Kinetic 78 in each appearance. Those relationships keep connected roles coherent when the foundation changes. Size variants continue to derive from semantic sizes, and coarse-pointer/content floors remain component-owned. No broad button background, foreground or border pin is applied; primary, secondary, ghost and danger variants retain their intended semantics.

## Verification and corrections

All six recipes replay successfully with the current managed descriptors and produce **zero compiler diagnostics**. The supplementary original-theme audit checks **54 opaque pairs per appearance (324 total)**, including general surfaces, subtle/selected content, status content, filled actions, option states, editor states, inverted toast text/icons, collaboration content, focus contours and boundaries. Ordinary text uses a 4.5:1 threshold; focus, boundaries and non-text status icons use 3:1. All 324 pass.

Run `node tooling/theme-candidates/originals/verify.mjs` after the tokens build. Add `--write-artifact` to refresh `tooling/theme-candidates/originals/contrast-review.json`, which records exact source hashes and individual ratios. This evidence supplements the compiler's six-pair check; it does not certify rendered focus adjacency, translucency, browser layout, forced colors or all accessibility behavior.

The audit caught combinations that six semantic compiler checks would miss. Vellum's muted and success inks were strengthened against its selected paper. Kinetic's muted and status inks were strengthened against lavender selected surfaces. Signal dark keeps the **shared** selected surface dark olive for components that retain light foregrounds, while its **dedicated** selected option and editor-token paint uses bright yellow with explicitly dark foregrounds. Signal's inset option focus was chosen to contrast against both the dark list and the bright state fills.

## Rendered review and responsive refinement

The six desktop appearances are substantially different on identical showcase content. Vellum reads as warm editorial software, Signal as a squared technical instrument, and Kinetic as a rounded creative application. The initial Kinetic configuration exposed cramped navigation and tabs, plus a real number-stepper overflow under 390px RTL with 200% root text: a rem-based control minimum doubled each stepper button to 120px while doubled surface padding left only 168px of interior width.

The bounded correction keeps 18px UI typography, 56px display typography, the 5px rhythm, capsule actions and generous control targets. It expresses the 60px control minimum in pixels through the existing trusted source API, leaving content and target floors to grow controls as needed. Shared surfaces use 20px padding, inputs use 12.5px inline padding, and the shared control-inline role uses 15px; buttons retain their separate 30px inline padding. This exercises the distinction between visual minima, text growth and application composition instead of shrinking the type to hide the problem. The final browser rerun verifies this correction in all three engines. See the main refresh report for source/build identities and complete evidence scope.

The visual review also caught docs consumers painting bright brand color as text on a light surface and as a glyph on the selected surface. Those uses require a text role such as `color.action-text`, or a paired `color.on-brand` foreground when the brand is the fill. The shared docs consumers now use the appropriate semantic foreground roles. The enlarged-text review also exposed two application layout constraints: summary metrics retained two cramped columns on narrow screens, and a scope heading could not break a long word. The shared showcase now stacks those summaries and permits heading reflow; these are responsive composition fixes, not theme-specific templates or new APIs.

## What the exercise says about the first official API

1. **Describe and expose code versus managed capabilities.** Creating a serif family, 800 weight, 3.5rem display, or custom elevation is valid through `ThemeOptions.source`, but unavailable from the stock managed menu. The managed review workflow should explain that distinction and let a theme supply reviewed choice sets. Avoid presenting stock choices as the API's maximum expressive range. Today the exact trusted baseline must accompany review import/export; preserve that provenance rather than accepting arbitrary imported baselines without validation.

2. **Complete the typography grammar.** Add tracking and font-style roles first, followed by feature settings, optical sizing and variable-font axes when their consumer contract is clear. Vellum wants book-like italics, Signal wants carefully spaced technical labels and Kinetic wants tightly set oversized headings. Existing typography tokens and `packages/styles/src/css/recipes.css` only compose family, weight, size and leading.

3. **Separate variant and interaction-state paint.** Existing CSS button state hooks apply across primary, secondary, ghost and danger. A global state override can erase distinctions. Define a documented, variant-aware precedence model and typed roles for commonly needed combinations. Until then, these originals use semantic action states and leave broad family button paint unset.

4. **Connect elevation to more visible families.** Multilayer and inset shadow values already exist in the serializer and should not be proposed as a new token type. The missing leverage is in consumers: cards have no shadow contract, and button focus owns box-shadow. Add surface/card and optional control elevation hooks, composed with focus using the existing `baseShadow` mechanism. Today Signal and Kinetic's most expressive shadows are visible on lists, dialogs and toasts, but cannot extend coherently to every card or action through a portable managed token.

5. **Model expressive paint without losing contrast context.** Public CSS background hooks support richer CSS than the typed solid-color model. A structured gradient or layered-paint value could support Kinetic color treatments and Signal technical patterns while retaining a solid fallback and declared text/contrast context. Do not treat arbitrary CSS strings as a replacement for that contract.

6. **Extend geometry deliberately.** Logical corner radii and optional family-level border width/style could support asymmetric editorial panels and stronger industrial framing without globally thickening every separator. Preserve the existing intrinsic text/content and interaction-target calculations. Scalar radius remains a useful default, but CSS radius hooks already support more than the portable token model can represent.

7. **Broaden evidence, not just token counts.** A passing compile currently checks six ordinary-text pairs. Add opt-in state/context matrices for selected content, muted content, status chips, option focus, inverted toasts and family paint. These originals demonstrate why authored bright selections need foreground context beyond a single global `color.selected` token. Browser evidence should include mobile, long content, keyboard focus, reduced motion and forced colors for materially different geometry and typography.

8. **Keep motion bounded by ownership.** Distinct motion is possible today with easing, surface travel/scale and supplementary focus halo timings. Maintain the existing immediate primary focus contour and reduced-motion behavior. Before expanding motion tokens, define which components own transform/elevation so new effects can compose safely instead of overriding another recipe's behavior.

Implementation evidence: `packages/tokens/src/admin.ts`, `source.ts`, `value.ts`, `theme.ts` and `review-draft.ts`; `packages/styles/src/internal/button-rules.ts`, `focus-core.ts` and `control-size.ts`; `packages/styles/src/css/typography.css` and `surface.css`.
