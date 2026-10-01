# Visual language and review plan

Status: synchronized with discovery, accepted review directions and the current token/style implementation. The reference sheet now has rendered samples, screenshots and focused browser evidence. Implemented defaults are distinguished below from future composition/admin proposals; they are not final user visual acceptance or full accessibility/release approval. [review-session.md](./review-session.md) records current status and next work, and the [token browser evidence](../packages/tokens/test/browser/README.md) identifies verified cases and limits.

The public element prefix is `en-` and package scope is `@en-reve`. The reference sheet displays the `en-reve` wordmark; that reference branding does not constrain a consuming application's visual identity.

## 1. Requirements and design direction

Customization takes priority over a fixed appearance. Public CSS Parts, custom properties and reusable styling capabilities must allow a page theme, a child theme rooted at any element, a component override and focused changes within an application region. Batch changes must preserve individual overrides. Composition and slots are public contracts; delivered internal markup stays private.

Code is authoritative. All authored visual rules are token driven, including typography, geometry, spacing, color, motion and layout thresholds. The planned managed token admin offers coordinated controls and constrained individual editing; current delivery includes pure editor metadata/candidate helpers and limited sheet preview controls, not the complete admin or adoption workflow. Consumers can go further through code. Library-owned themes receive library review; consumers review their changes. See the companion token plan for the schema, dependency graph and override mechanics; the authoritative implemented values live in token source, and this document records their intent plus explicitly proposed future guidance.

The user's references establish the following review priorities:

| Reference and feedback | Requirement for our review |
| --- | --- |
| shadcn/create is close, but text feels condensed | Compare reading and control use at actual application density; improve readable text without assuming a specific font is the cause. |
| Its nested corners do not feel fully concentric | Review adjacent nested silhouettes together with their borders and insets. |
| Astryx's density and radius relationships work well | Preserve deliberate spacing/geometry relationships across compositions. |
| Atlassian supports the desired complex UX | Prove coherent settings, collections, navigation, forms and contextual controls together. |
| Bootstrap is an unwanted visual direction | Do not reproduce its recognizable default appearance as the reference theme. |
| Spectrum supports complexity but the assembled appearance lacks the desired modernity | Judge the complete surface, not just isolated components. The user's subjective assessment is authoritative. |

Recommended starting direction: readable, low-chroma application surfaces; clear typography and spacing hierarchy; a configurable shared accent seed with independent brand and action roles; restrained boundaries and elevation. Colorful creative content should remain distinguishable from application chrome. This is a proposal for a useful default, not an imposed brand or a claim that these references have been copied.

Modernity will be reviewed as overall coherence: consistent control alignment, understandable hierarchy, complete interaction states, deliberate nested geometry and smooth adaptation to available space. It will not be inferred from a particular corner size, gradient or font.

## 2. Initial visual tokens

Semantic paths below describe the intended relationships. Their public CSS spelling follows the token plan, for example `color.canvas` → `--en-color-canvas`. The token compiler must be the source of emitted values, including values that a CSS mechanism cannot read directly at runtime. Do not duplicate literals between a component, a recipe and its documentation.

### Color

These swatches are implemented reference values, **not a claim that all rendered states have passed contrast review**. The pure resolver checks declared text pairs, and focused browser tests verify selected rendered states; complete application and theme acceptance remains open. Official light and dark reference appearances must pass the accessibility and rendered-state review before release. A custom accent generator must resolve explicit foreground/background pairs and indicate invalid combinations; it cannot promise that every arbitrary input creates an accessible theme.

| Semantic token | Light reference | Dark reference | Intended use |
| --- | --- | --- | --- |
| `color.canvas` | `#F7F8FA` | `#14171B` | Application background. |
| `color.surface` | `#FFFFFF` | `#1C2127` | Main controls and content surfaces. |
| `color.surface-subtle` | `#EEF1F5` | `#252C34` | Quiet grouped content, not disabled state. |
| `color.surface-raised` | `#FFFFFF` | `#252C34` | Menus, popovers and dialogs. |
| `color.text` | `#1B1F24` | `#F3F5F7` | Main text. |
| `color.text-muted` | `#566171` | `#B7C0CC` | Supporting text that must remain readable. |
| `color.line` | `#D6DCE4` | `#3C4857` | Decorative separators; not sufficient by itself to identify controls. |
| `color.boundary` | `#7B8798` | `#78869A` | Essential control boundaries, subject to rendered contrast checks. |
| `color.brand` | `#2457D6` | `#AAC1FF` | Identity color, independent of action-specific overrides. |
| `color.on-brand` | `#FFFFFF` | `#101B39` | Foreground derived against the effective brand fill. |
| `color.action` | `#2457D6` | `#AAC1FF` | High-emphasis action surface and actionable emphasis where the pair is suitable. |
| `color.on-action` | `#FFFFFF` | `#101B39` | Content on the action surface. |
| `color.selected` | `#E7EEFF` | `#233657` | Selected item surface, paired initially with `color.text`. |
| `color.focus` | `#2457D6` | `#AAC1FF` | Focus indicator; evaluate against surrounding surfaces and add a contrasting separation ring when needed. |
| `color.danger-text` | `#B42318` | `#FFB4AB` | Error/destructive emphasis with text and icon meaning. |
| `color.warning-text` | `#8A4B05` | `#FFD094` | Warning text/icon emphasis. |
| `color.success-text` | `#146C43` | `#8FDCB1` | Success text/icon emphasis. |

`palette.accent` supplies `color.brand` directly and the preserved `palette.action` alias, which supplies `color.action`. Brand/action pins detach only their respective branch. Foregrounds are independent: `on-brand` considers the brand fill, while `on-action` considers normal/hover/pressed action fills. No generic `primary` color is added. The requested wordmark name and tile background use the exact same `color.brand`; `on-brand` colors lettering inside the tile. Brand-colored text on a neutral surface needs its own contrast review, and the generator must not silently change the user's seed to make that different use pass. Coordinated color edits use the resolver and emitted full theme; raw CSS seed overrides cannot recompute resolved foreground/state recipes.

Status text tokens are not status-fill tokens. Add separately reviewed background/foreground pairs when filled status surfaces are needed. Hover, pressed, selected, focus, disabled, invalid and loading each receive semantic state values; do not generate all states by reducing the opacity of the entire component. Disabled appearance must remain understandable, even where a particular contrast requirement has an exception. Status and selection must not depend on hue alone.

Forced-colors presentation uses system colors and preserves meaningful boundaries, focus and selection. It is a user preference with its own checks, not a recolored screenshot of dark mode. Any opting out of user color adjustment requires a specific purpose, such as a content color swatch with adjacent textual identification, and accessibility review.

### Typography

Keep the document root at the user's default font size. Implemented text sizes use `rem`, line heights are unitless and text containers can grow. Density and rhythm do not change font metrics, font width or tracking.

| Role | Size | Line height | Weight | Use |
| --- | --- | --- | --- | --- |
| `font.body` | `1rem` | `1.5` | `400` | Help, messages, form descriptions and documentation prose. |
| `font.ui` | `1rem` | `1.5` | `400` | Shared control, label, navigation and settings metrics. |
| `font.input` | UI alias | UI alias | `400` | Editable/select values; family, size and leading follow UI unless pinned. |
| `font.data` | `0.875rem` | `1.5` | `400` | Dense tabular values where the density review supports it; not a universal application text size. |
| `font.metadata` | `0.8125rem` | `1.5` | `400` | Supplementary timestamps/version details; never the only instruction for an essential task. |
| `font.label-strong` | UI alias | UI alias | `600` | Group/field hierarchy; independent strong weight. |
| `font.heading-small` | `1.125rem` | `1.4` | `600` | Panel and section headings. |
| `font.heading-medium` | `1.5rem` | `1.3` | `600` | Page-local hierarchy. |
| `font.heading-large` | `2rem` | `1.2` | `600` | Documentation/page title; wrap naturally. |

The implemented UI/body family is `system-ui, sans-serif`; code uses `ui-monospace, monospace`. This avoids a mandatory font download and gives the platform's installed language support a first opportunity. No particular commercial or hosted font is required. All font families remain replaceable tokens. Reference appearance will vary across operating systems; visual baselines must identify the actual platform and fonts.

Comparable controls share UI family/size/leading by default; inputs and the base strong-label roles alias them, while weights stay independent. Rendered labels inherit selected UI metrics and apply the strong weight. UI/input size recipes retain at least their own base: small/medium are `1rem`, large is `1.125rem` at default scales. Small therefore reduces geometry while retaining legible base text. These are design defaults, not a WCAG minimum-font-size rule or a verified physical-iOS focus/zoom guarantee. Consumers can pin a semantic role or an individual size output, including an explicit smaller value. Body/data/heading roles remain distinct; metadata also retains its own base floor.

Use normal tracking initially, no condensed font stretch, no all-uppercase label convention and no light-weight body text. Test any replacement font at the same semantic roles. Numeric alignment uses tabular numerals in comparable data columns rather than making all UI text monospaced. Proposed prose measure is `66ch`; for CJK prose start with a separate `40em` measure and review actual line length. Neither is a hard control width.

The nineteen catalog identities are `pt-BR`, `zh-Hans`, `zh-Hant`, `cs`, `da`, `nl`, `en`, `fi`, `fr`, `de`, `it`, `ja`, `ko`, `nb`, `pl`, `ru`, `es`, `sv`, `tr`. Catalog identity, writing system and regional formatting are separate concerns.

| Text group | Typography strategy and review |
| --- | --- |
| Latin-script catalogs, including Turkish and the Nordic/Central European languages | Preserve diacritics and casing; review long labels and text expansion using real translations. No blanket uppercase transformation or fixed label width. |
| Russian | Verify Cyrillic glyphs, metrics, punctuation and long labels in the actual selected platform fonts. Do not substitute Latin lookalikes. |
| Simplified/Traditional Chinese, Japanese, Korean | Preserve language/script metadata and language-appropriate glyph selection. Keep script-specific family and line-height override points. First test the shared metrics, then review a `1.6` body line-height variant where it improves readability; do not shrink these scripts to fit Latin-sized boxes. |
| Mixed-direction content and RTL layout | Test real Arabic/Hebrew fixture text without claiming additional translated catalogs. Preserve surrounding direction, isolate user-provided fragments as appropriate and use logical alignment/insets. Do not mirror logos, artwork, mathematical signs or every icon indiscriminately. |

Apply language-aware styling through language metadata, including inherited language and local changes. W3C's `:lang()` guidance explains why an exact attribute selector alone is insufficient for inherited language. [W3C: Styling using language attributes](https://www.w3.org/International/questions/qa-css-lang)

No single font stack guarantees every glyph or locale. Verify the nineteen catalogs in supported browser/OS profiles, including font substitution, mixed scripts and native input composition. Start with natural browser line breaking; introduce language-specific line-breaking rules only when a real-language review establishes a need. Essential instructions and editable values wrap or expand rather than silently ellipsizing. Truncated collection labels need a keyboard/touch-accessible path to the complete value.

### Iconography

Use the library's trusted `en-icon` SVG glyphs for its supported standard actions/status rather than improvised Unicode substitutes in reference examples. The current implementation is a small built-in set, not an adopted external icon package. Icon size and stroke consume public tokens, and an application can compose its own icon content through the relevant public slots. No unselected external library or new icon-registration API is implied.

Icons are decorative by default; provide localized accessible text when the image conveys meaning. An icon-only action needs an accessible control name, and a text-labeled action must not announce the same label twice. Preserve directional meaning by pattern; logos and arbitrary artwork do not automatically mirror in RTL.

### Rhythm, density and targets

The implemented base rhythm is `0.25rem`. The initial spacing scale in base units is `0, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16`, giving `0, 0.125, 0.25, 0.375, 0.5, 0.75, 1, 1.5, 2, 3, 4rem`. These are reusable raw steps; components consume purpose-based aliases such as label-to-control, control-to-description and section-gap.

| Relationship at the default rhythm | Compact | Comfortable | Spacious |
| --- | --- | --- | --- |
| Icon to related label | `0.5rem` | `0.5rem` | `0.5rem` |
| Field label to control | `0.375rem` | `0.5rem` | `0.75rem` |
| Control to description/error | `0.375rem` | `0.375rem` | `0.375rem` |
| Adjacent fields | `1rem` | `1.5rem` | `2rem` |
| Content rows | `0.5rem` | `0.75rem` | `1rem` |
| Related actions/badge groups | `0.25rem` | `0.375rem` | `0.5rem` |
| Distinct sections | `1.5rem` | `2rem` | `3rem` |
| Control baseline block size | `2rem` | `2.5rem` | `3rem` |
| Control inline padding | `0.5rem` | `0.75rem` | `1rem` |
| Control block padding | `0.375rem` | `0.375rem` | `0.375rem` |
| Panel padding | `1rem` | `1.5rem` | `2rem` |

Comfortable remains the default. The tighter action-group gap is separate from content spacing and from each button/badge's own padding. Control baselines are not promised rendered heights. The shared text-control helper also budgets current line boxes, rhythm-driven padding, borders and the segmented frame's inner target. At a 16px root, medium fine-pointer control minima at `.25rem` rhythm are `38px`/`40px`/`48px`; at `.5rem` rhythm all three are `50px`. Text controls can grow for wrapping and user text changes; native color uses the same calculated height to replace its unrelated intrinsic sizing. See the token plan for the exact shared expression.

The implemented `any-pointer: coarse` path uses the unscaled `2.75rem` target-block role and preserves that inner target inside segmented framing. Comparable medium controls therefore use `54px` at `.25rem` rhythm and `62px` at `.5rem`, rather than allocating frame padding only to the outer surface. Wrapped rows keep their native option block floor. This is an ergonomic block-size choice, not a guarantee of 44×44 targets, a WCAG AA scalar requirement, or detection of every touch user. Coarse-pointer detection never changes density or removes controls.

Missing `size` means medium without an attribute. Explicit `size="inherit"` opts into the parent's selection; small/medium/large choices are absolute and do not compound across nested hosts. Size changes component geometry independently of density and rhythm. Preserve semantic/size-output/component overrides, and use a full local theme boundary when dependent aliases and size variants must rebase together. A descendant primitive override alone does not update inherited derived values.

Target size and target spacing are separate acceptance checks from apparent control size. Compact mode must meet the applicable accessibility policy; do not manufacture overlapping invisible hit areas or use the word “compact” to excuse inaccessible controls. Density is an application-region preference, not an automatic synonym for small viewport or expert user. Type-scale changes must trigger geometry review in every density.

### Corners, boundaries, elevation and motion

Implemented independent corner bases: control `0.5rem`, container `1rem`, dialog `1.25rem`. A pill is an explicit shape choice for appropriate patterns, not the radius assigned to every button.

For closely nested silhouettes intended to read as one object, derive related corners from their actual inset. With uniform circular corners, child outer radius `r = max(0, R - d)`, where `R` is the parent's outer radius and `d` is the distance from the parent's outer border edge to the child's outer border edge, including the relevant border, padding and gap. Example: `R = 1rem`, `d = 0.5rem`, child `r = 0.5rem`. The design can also choose the child radius and derive the enclosing radius as `R = r + d`.

This is the accepted relationship for related nested edges, not a universal rule for all descendants. Independently spaced fields inside a large panel retain their own control geometry. Unequal insets, elliptical corners, clipped content and browser radius clamping need per-corner review; a scalar formula alone cannot prove concentric appearance. A local radius override remains possible and the planned admin must explain which relation it changes. Do not hide arbitrary “optical correction” constants in component CSS.

Select and segmented outer frames now consume the same `--en-control-radius` override with sized `radius.control` fallback. Segmented inner corners subtract frame padding plus border from that same effective outer radius, clamped to zero. At `.25rem` rhythm and a 16px root font, small/medium/large outer radii are `7px`/`8px`/`10px` and inner radii `2px`/`3px`/`5px`. Density does not change the radius itself; rhythm changes its inset relationship. Container and opened-select popup radii stay separate. Public `options`/`option` parts allow deliberate departures; overriding the outer token must not leave a stale inner default.

CSS defines inner border/content radii relative to border thickness and padding and can clamp overlapping radii. Those rules support the relationship above but do not automatically coordinate two independent elements. [W3C: CSS Backgrounds and Borders, corner shaping](https://www.w3.org/TR/css-backgrounds-3/#corner-shaping)

Implemented boundary width is `1px`; the shared focus treatment starts from a `2px` solid indicator with `2px` separation where appropriate. These values are starting inputs, not evidence that focus is visible, sufficiently contrasted or unobscured. Verify clipped and nested regions as well as every supported surface color.

Use spacing, alignment and surface tone before adding a card or shadow. Default ordinary panels have no shadow. Raised overlays may start with `0 4px 16px` at a tokenized shadow color/opacity, and dialogs with `0 12px 40px`; these elevations require visible boundaries when shadows cannot carry the distinction. Do not add a new elevation per component.

Implemented duration inputs are immediate `0ms`, fast `120ms`, regular `180ms`, slow `240ms`, with the shared easing `cubic-bezier(0.2, 0, 0, 1)`. Motion should explain a state change or spatial relationship. Do not use `transition: all`, animate large layout surfaces by default or require animation to discover state. Reduced-motion presentation removes decorative movement and preserves immediate, understandable state changes; progress remains perceivable through text/state even when animation is suppressed. Performance and accessibility plans own the detailed tests.

## 3. Composition rules

1. Give each work region one clear main purpose and a legible heading. The reference sticker sheet omits eyebrow headings per user review; do not restore them as its default decoration. This does not prohibit an application from authoring its own contextual content. Establish hierarchy with shared alignment and spacing before surrounding every group with a rounded container.
2. Put descriptions, errors and action effects beside the object they concern. Reserve high visual emphasis for the next meaningful action within the current task scope; multiple unrelated primary buttons should not compete inside one form step.
3. Keep common and nuanced controls in the same understandable task groups. Disclosure can manage detail, but must not hide a non-default value or require users to declare themselves beginners or experts.
4. Maintain visual vocabulary across patterns: label placement, state meaning, action order, focus treatment and reset scope should transfer from a field to a settings row to a contextual chat control.
5. Keep application chrome neutral enough that a creative asset's color is not confused with selection, status or collaboration presence. Presence cues also need identity text/shape; do not make color the identity.
6. Responsive changes preserve current task, selection, input, draft edits, scroll/focus context and recognizable labels. Reflow cannot silently reset a component or turn a visible action into an unlabeled icon.
7. Allow width to be owned by the composition. A reusable component must function in a narrow sidebar, a dialog, a full-page form and nested shadow scopes without reading global app layout assumptions.
8. Prefer intrinsic layout and explicit container-based adaptations. Proposed sample thresholds below are tokens for these samples, not hard-coded global breakpoints all components must obey.

## 4. Responsive sample specifications

Common review sizes: `320`, `390`, `768`, `1024`, `1440` and `1920` CSS pixels wide, with portrait/landscape cases and relevant low-height states. Also test the actual device profiles in the performance/accessibility plans, browser zoom, text resizing and embedded/nested region widths. A 1440px viewport can contain a 320px settings panel, so viewport-only screenshots are insufficient.

Proposed sample bands use available inline size: compact below `48rem`; intermediate from `48rem` to below `80rem`; wide from `80rem`. Change a threshold if content evidence demands it. Wide screens do not stretch prose and form controls indefinitely. Vertical content reflows at a 320 CSS-pixel equivalent; justified exceptions such as a meaningful two-dimensional data table stay localized, with surrounding controls and individual text content still usable. [W3C: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

### Documentation

- Wide: a `15rem` pattern/navigation rail, an article limited to `48rem`, and a `12rem` in-page outline. API examples may use the article's full region; ordinary prose uses the typography measure. Header/search/version controls wrap without covering content.
- Intermediate: navigation rail and article; move the local outline into a labeled, in-flow “On this page” disclosure near the title. Compact: a clearly labeled navigation trigger and the same in-flow outline. Preserve current page/section identification and focus return when navigation closes.
- A pattern page shows a working example, purpose and use guidance first, then developer API/composition guidance, design/customization effects and evidence/version information. Use local headings/links so four audiences can reach their content; no mandatory persona-selection screen.
- Show normal, focused, invalid, loading and long-content examples in context. Code blocks have an explicit wrap option and localized overflow when necessary. Documentation consumes the current proposed tokens so theme defects appear in real prose/navigation as well as specimens.

### Sticker sheet and version comparison

- Inventory coverage includes every shipped component and the named compositions needed to expose relationships. Each has stable identifiers/anchors and labeled state/locale/theme/size context. A default-only grid is insufficient.
- Wide: a grid of specimen regions with proposed `18rem` minimum and `28rem` preferred width; complex patterns get their own wider region. Compact: one column without shrinking text or controls to fit. Review isolated 320px regions on wide screens too.
- Closed overlays appear in the overview; interactive fixtures explicitly open and exercise them. Focus, invalid state, selection, empty/loading and long labels receive deliberate fixtures. Do not force all mutually exclusive states or every overlay into one artificial screenshot.
- Old/new regions share the same fixture, dimensions, locale and theme inputs, with persistent version labels outside the themed region. Where two columns no longer fit, stack them or provide a clearly labeled comparison switch preserving the active scenario; do not halve readable size. Scoped registration/isolation follows the platform plan.
- Coverage must remain discoverable if samples are grouped or loaded on demand. Filters cannot silently remove changed patterns from the review. Capture an explicit manifest of rendered fixtures so a “complete” sticker sheet cannot omit unvisited lazy sections.

### Token administration and theme review

This remains a planned full UI/workflow. Pure managed descriptors, candidate preparation and limited preview settings exist; all-token editing, undo/history, review-bundle navigation and adoption integration are not thereby complete.

- Wide: token/group navigation about `16rem`, an editor about `24rem`, and a flexible live preview; use the wide layout only when all three regions fit. Intermediate: navigation plus editor, with preview beside or below according to available width. Compact: explicit “Edit” and “Preview” views with the same selected token, draft and preview scenario preserved.
- Place Preview beside the edit/draft status. Keep a concise “Changes affect…” summary in Edit so understanding a derived change does not require repeatedly switching views. Return from Preview to the same token and position.
- The primary editor offers coordinated controls for the shared accent seed, independent brand/action roles, rhythm, type scale, density and corner relationships, with affected values visible. Individual controls expose inherited/derived/local values in clear language, typed options and a way to restore the chosen scope. Code remains the escape hatch beyond managed options.
- A preview can contain page-root styling, a child theme, an individual component override and a focused region override simultaneously. Show the selected scope outside that scope's themed subtree so extreme edits cannot erase the controls needed to recover.
- Review has component sticker-sheet, full documentation and three journey views. “Save draft,” “Review changes” and any eventual adoption action remain visually distinct. The submission/adoption workflow belongs to the governance plan; an attractive preview must never imply approval or publication.

### Multi-step SSO sign-in

- Proposed form maximum width `28rem`; body-width form at compact sizes with `1rem` outer padding. Wide layouts may include a short explanatory region but the sign-in task remains in one stable reading column. Do not require a decorative split hero.
- Keep heading, current step, relevant fields/provider actions, recovery feedback and next action in order. Provider buttons show recognizable text; button order and labels remain stable through loading. Progress and Back remain available when the scenario supports them.
- Errors appear beside affected fields and in the journey's agreed summary. Loading reserves enough room for its explanation without shifting the next action unexpectedly. Step changes must preserve input and orientation as specified by the UX/accessibility plans.
- Low-height/mobile-keyboard states use page flow rather than vertically centering a card beyond the viewport or pinning a footer over fields. Long provider names, translated labels and 200% text remain operable.

### Design-tool settings

- Sample the same settings in a `20rem` sidebar and a page region up to `52rem`. Use named task groups with clear labels, current values, descriptions where needed and a scoped reset action.
- At sufficient region width, related label/value columns may align; below their content threshold, place labels above controls without changing reading or focus order. A slider pairs with an accessible exact-value route where precision is part of the task.
- Advanced disclosure preserves discoverability and exposes non-default/current effects. Visual grouping follows settings purpose rather than one card per field. Nested subgroups have deliberate insets; previewing a change does not steal focus.
- Small screens can show a labeled route to the affected preview and return to the same setting. Reset names its scope/effect before the action. The settings interface should support quick familiar changes and careful nuanced work using the same language.

### Chat-triggered controls

- Proposed conversation reading width `48rem`; wider layouts may show context alongside rather than stretching messages. Compact layouts keep the conversation and a discoverable route to the same context.
- Place a contextual control near its originating message with a visible statement of what it changes and why it is available. Use the same field/button/settings geometry as elsewhere. Do not design a visually unrelated “AI widget” family.
- Fixture states include current, proposed/in-progress, completed, failed and stale/unavailable actions where relevant. These are review scenarios, not a new chat service or synchronization obligation. Controls express updated availability without silently moving focus or overwriting an active draft.
- Composer labels, attachment/action controls and Send remain identifiable as the composer grows. When a software keyboard, zoom or short viewport reduces space, the composer and conversation remain scrollable/reachable without covering essential content. New messages do not force readers away from earlier content they are using.

## 5. Review criteria and evidence

Review requirements are outcomes, not screenshot aesthetics alone. The accessibility plan defines the full WCAG 2.2 AA and browser/AT acceptance matrix; this document adds focused visual questions.

| Review checkpoint | Required evidence or question |
| --- | --- |
| Typography and content | Can reviewers read and act without cramped text, clipped glyphs or ambiguous hierarchy? Check nineteen catalogs, long real labels, mixed scripts, font fallback and input composition. |
| Adaptability | Check 200% text, actual 400% browser zoom from a 1280 CSS-pixel-wide viewport, corresponding reflow cases and applicable text-spacing overrides. Content/function must remain available, with no overlap hiding controls. |
| Geometry | Compare close nested edges at all four corners with actual padding/borders, compact/comfortable/spacious density, all size selections, varied rhythm, larger type, square corners and local overrides. Record intentional exceptions. |
| Cohesion | In login/settings/chat, do repeated controls look and behave like the same system? Is the next action clear without every region competing for attention? |
| State and preferences | Review focus, hover, pressed, selected, invalid, disabled, loading and completion; light/dark, forced colors and reduced motion. Color alone cannot establish meaning. |
| Customization | Demonstrate a page theme, child theme, per-component override and regional override together, including restoration and derived-value changes. Verify a token change reaches its intended consumers only. |
| Responsive continuity | Resize while editing a setting, filling a form, drafting a chat message and editing a token. Preserve state and a discoverable path to the affected content. |
| Version comparison | Labels identify old/new versions and all fixture inputs. Expected/actual/diff evidence refers to a particular candidate and baseline. A changed baseline requires review. |

WCAG text-spacing guidance requires surviving user adjustments; it does not prescribe those adjustment values as the authored default. Test line-height `1.5`, paragraph spacing `2em`, letter spacing `0.12em` and word spacing `0.16em` where applicable to the language/script, without losing content or function. [W3C: Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)

Start customization review with three deliberately different fixtures: square corners with compact spacing; larger type with generous spacing; and a changed accent containing a nested dark region and a local component override. These are proof scenarios, not newly approved official named themes. Expand combinations where token dependencies or failures warrant it.

Each review captures the candidate revision, baseline, browser/OS, fonts/assets, viewport and region dimensions, scale/zoom, theme/resolved tokens, locale/direction, fixture state and interaction method. Keep screenshots alongside behavioral and accessibility evidence. Token or typography changes invalidate affected transitive consumers; screenshot caching must use the full rendering dependency key from the validation plan. No pixel threshold can decide whether a meaningful new defect is acceptable.

Focused human prompts: What were you trying to do? What did you expect? What actually happened? Where did you hesitate, lose your place, misread a relationship or need a workaround? A reviewer need not diagnose a CSS or WCAG rule. Keep visual taste feedback separate from confirmed usability failures while recording both.

## 6. Primary-source basis and limits

- [shadcn theming](https://ui.shadcn.com/docs/theming) documents semantic color pairs, configurable defaults and a radius scale. It informs customizability; its current values are not copied here.
- [Astryx themes](https://astryx.atmeta.com/themes) presents themed complete application surfaces. The user supplies the positive assessment of density/radii. The token specialist additionally retrieved Astryx's [theme documentation](https://astryx.atmeta.com/docs/theme) concerning related radius values; direct retrieval of that deeper page failed in this visual-research session.
- [Atlassian design system](https://atlassian.design/design-system) is the user's positive complexity reference; the architecture specialist reviewed its composition guidance. [Spectrum](https://spectrum.adobe.com/) and [Bootstrap](https://getbootstrap.com/) remain reference context for the user's stated preferences, not templates for this default.
- W3C sources cited next to the relevant rules inform language-aware styling, corner geometry, reflow and text adaptation. They do not establish that the proposed implementation or palette passes those requirements.

Browser UI access was unavailable during the original reference-site research; shadcn/create returned only a document shell. This limits independent aesthetic claims about those references, not the later local implementation evidence. The local sheet and token fixtures now have focused browser checks, including typography/geometry alignment; review their recorded environment and scope. User visual acceptance, the full rolling browser/OS/AT matrix and full journeys remain separate work. The open WebKit fixed-host `rem` and Firefox slotted-touch findings remain tracked in accessibility/platform review; focused passes do not close them. Native CSS functions/mixins and arbitrary query equivalence still require explicit platform evidence; baseline delivery does not assume native-only syntax or substitute Sass silently.

Peer review: Jina's token perspective agreed that source code owns implemented defaults while these plans document visual intent and derivations; typography remains independent of density and geometric dependencies stay explicit. The rhythm scale is shared with that plan. Golden's UX perspective required state-preserving responsive views, recognizable actions, visible effects of token changes, accessible advanced settings and clear reset scope. Brad's architecture perspective agreed that composed journeys establish cohesion and semantic recipes need no artificial custom element. Léonie's accessibility perspective confirmed the distinction between proposed metrics and acceptance evidence, and requested the explicit actual-zoom fixture above.
