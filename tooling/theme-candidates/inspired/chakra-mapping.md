# Chakra UI-inspired paired theme

This independent En Reve interpretation follows **Chakra UI 3.37.0's default
neutral `colorPalette`** in light and dark appearances. It maps component recipes
through public tokens, CSS Parts and documented native helpers. It adds no Chakra
runtime or font download. The mapping records an authored design interpretation;
it is separate from browser qualification, visual equivalence and user acceptance.

The [complete component crosswalk](./chakra-component-mapping.json) accounts for
all **114 entries** in the official component overview. Each entry identifies an
existing component, an adapted counterpart, an authored composition, a layout or
runtime utility, or a missing counterpart. Its family records pair source defaults
with the exact finite companion targets, token bindings and available public Parts.

## Pinned reference

The inventory comes from the [official component overview](https://chakra-ui.com/docs/components/concepts/overview).
Recipe values are pinned to
[`@chakra-ui/react@3.37.0`](https://github.com/chakra-ui/chakra-ui/releases/tag/%40chakra-ui%2Freact%403.37.0),
commit **`2e7517745cff2fcde0b8012f136cf99611ff262a`**. Mutable documentation examples
inform composition; the immutable recipe and token sources determine numeric
reference values. The crosswalk links each relevant recipe at this commit.

Shared source inputs include [colors](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/tokens/colors.ts),
[semantic colors](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/semantic-tokens/colors.ts),
[fonts](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/tokens/fonts.ts),
[text styles](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/text-styles.ts),
[semantic radii](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/semantic-tokens/radii.ts)
and [layered shadows](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/semantic-tokens/shadows.ts).

## Palette and typography

| Mapped role | Light | Dark |
| --- | --- | --- |
| Canvas / panel | `#ffffff` / `#ffffff` | `#09090b` / `#111111` |
| Muted surface / selected fill | `#f4f4f5` | `#18181b` |
| Emphasized fill | `#e4e4e7` | `#27272a` |
| Main / muted text | `#09090b` / `#52525b` | `#fafafa` / `#a1a1aa` |
| Decorative line | `#e4e4e7` | `#27272a` |
| Functional boundary / focus | `#71717a` | `#a1a1aa` |
| Solid action / action label | `#18181b` / `#ffffff` | `#ffffff` / `#09090b` |
| Action text | `#27272a` | `#e4e4e7` |
| Opaque solid hover / pressed | `#2f2f32` | `#e7e7e7` |
| Tooltip background / text | `#09090b` / `#fafafa` | `#ffffff` / `#09090b` |
| Modal scrim | `rgba(0,0,0,.36)` | `rgba(0,0,0,.36)` |

Neutral selected, outline and ghost treatments follow the default gray palette.
Semantic success, warning, error and information colors remain independent.
Functional boundaries and the light focus color deliberately use stronger gray
values than source decorative borders and gray-400 focus. Input focus uses a
2px inset contour in place of the source's 1px inside ring. Other action focus
retains a 2px contour and 2px offset. Opaque hover colors approximate source
90% solid paint against the canonical panel; their appearance can differ on
other application backgrounds.

Toast success uses green 700 in place of green 600, and light warning uses orange
700 in place of orange 600, to retain ordinary white-text contrast. Dark warning
retains orange 500 with black text. These are authored contrast adaptations;
rendered background composition and actual state coverage require their own
receipts.

The sans stack starts with Inter followed by platform fallbacks; the code stack
starts with SFMono-Regular. Body is **16/24px**, UI/input/data **14/20px**, and
metadata **12/16px**. UI labels use 500; body/input use 400. Public native heading
roles map Chakra `xl`, `2xl` and `4xl` to **20/30px**, **24/32px** and **36/44px**,
with weight 600 and `-0.025em` tracking on the largest role. These are visual roles,
independent of HTML heading level. Local font availability determines glyph metrics.

## Component recipe controls

Measurements below use the source's default size and variant unless stated.
`sm/md/lg` map to En Reve's small/medium/large contexts where the anatomy supports
it. Dimensions describe source geometry, not permission to reduce protected
minimum targets. Comfortable density, explicit size inheritance, coarse-pointer
minimums, text growth and logical RTL dimensions remain authoritative.

| Family | Source mapping and public controls | Retained adaptation or anatomy limit |
| --- | --- | --- |
| Button, close and icon actions | Solid/md; 36/40/44px sizes, inline 14/16/20px, 4px radius, disabled opacity .5. `button/compact` applies variant hooks and typed size roles. | Existing primary/secondary/ghost/danger variants, content growth and target floors remain. Download and clipboard behaviors are application compositions. |
| Link | Plain neutral link, 2px radius, 6px gap, hover underline at 20% current color with 3px offset through `link/plain`. | Native navigation and accessible naming remain; Link Overlay/Skip Nav click and focus behavior is authored by the application. |
| Field and fieldset | 6px label gap; 14/20px medium labels; 12/16px helper/error text; fieldset gap 16px. `form-field/compact` and native field helpers. | Error visibility, announcements and fieldset semantics stay with their owners. |
| Input, textarea and aliases | Outline, transparent fill, 1px boundary; md 40px with 12px inset. Textarea uses 12px inline/8px block. Public input hooks and typed control roles cover search/date/time/color/password aliases. | Native editing/composition/selection and textarea rows/resize remain. Platform date/time/password UI is not a source slot replica. |
| Number Input / Pin Input | Shared input geometry and typed `number-field/subtle` / `otp-field/continuous-pin`. | Number steppers remain horizontal; OTP remains one real input. Current Parts cannot create source stacked steppers or separate pin cells. |
| Checkbox / Radio | Solid/md 20px mark, 10px label gap; checkbox corners 2px; checked solid fill and contrasting mark. | Labels retain minimum target envelopes. Card variants are composed with public card and choice controls. |
| Switch | md 40×20px track, 16px elevated thumb, 2px visual inset; muted unchecked track with white thumb. Checked thumb uses palette contrast: white in light mode, #09090b against the white track in dark mode. Translation is 150ms. A dedicated thumb shadow matches the source's 80% visual scale. | Transparent retained border and adjusted inset preserve native switch geometry, checked state and RTL. |
| Slider / Rating | Slider 8px track/20px thumb geometry; rating neutral state ink and compact star spacing. | Native slider track/fill/outlined-thumb paint differs by engine. Font-star rating retains clear action/targets; no half-star SVG feature is added. |
| Segmented Control | Enclosed muted surface, 4px radius, zero root padding/gap, selected surface shadow; typed item spacing/weight. | No source moving indicator or separator anatomy; selected item semantics and targets remain. |
| Combobox / Listbox / custom Select | md 40px input, 16px indicator, 4px popup radius, compact 14/20px rows; listbox selected muted surface. Typed `combobox/compact`, listbox and option presentations. | En Reve `en-select` is NativeSelect. Custom selection maps to combobox/multiselect with their own filtering/tag models and 40px row targets. |
| Native Select | md 40px; start 12px/end 32px; 18px indicator inset 8px. | Native option popup is platform-owned; source custom Select's 48px large size is distinct from NativeSelect's 44px. |
| Tree View | Subtle/md 14/20px rows, 24px depth indent, 16px icon, muted hover and neutral selected paint. | Virtual row measurement, keyboard state and protected targets stay intact. |
| Dialog | md 32rem, 6px radius, large shadow; header 24/24/16px, body 24/8/24px, footer 24/8/16px; title 18/28px 600. `dialog/sectioned`. | En Reve placement/modality and flow-based close clearance remain; optional source composition is not new slots. |
| Drawer | xs 20rem, end placement, square surface; shared section typography with 24px inline/8px block body. `drawer/sectioned`. | Responsive bottom drawers remain fluid. Source full-distance movement is bounded by En Reve motion. |
| Popover / Hover Card | 20px inset, 14/20px type, 6px radius, large shadow. Popover uses 20rem width; Hover Card intrinsic width caps at 20rem. Public `sectioned` presentations. | Visible title/dismiss controls stay; source arbitrary optional header/footer/preview composition differs. |
| Tooltip | Inverse paint, 10px inline/4px block, 12/16px 500, 4px radius, medium shadow, 20rem maximum. `tooltip/compact`. | Public overlay hooks keep arrow fill coherent; source square and En Reve triangle arrow geometry differ. |
| Menu | Subtle/md, 6px surface inset, 4px radius, large shadow; 14/20px rows with 8px inline/6px block inset, 2px radius; 12px shortcuts at .6 opacity. | Source 8rem minimum is not imposed over the owned viewport cap; rows retain target floors. Context menus/menubars retain their own behavior. |
| Card | Outline/md: panel, 1px decorative line, 6px radius, no shadow; 16/24px body, 24px sections, header gap 6px, footer gap 8px. `card/sectioned`. | Arbitrary slotted header/title/description markup remains consumer-owned. Empty State is a card/text/action composition. |
| Tabs | Line/md: muted rest, neutral selected, 2px indicator; 16px inline/8px block inset, list gap 0, panel inset 16px. Public horizontal and vertical targets. | Minimum targets and authored panel content remain; enclosed/plain variants are not simultaneously applied. |
| Accordion / Collapsible | Outline/md 16/24px 500, 8px trigger block inset, 12px gap; panel 8px start/16px end; 200ms chevron rotation. | Native disclosure and hidden-content lifecycle remain; source expand/fade requires presence coordination. |
| Breadcrumb / Pagination | Breadcrumb plain/md 14/20px, 6px gaps and chevron separators. Pagination inherits button geometry. | Source pagination is button composition, without a standalone recipe. Current-page outline lacks a separate public page-state Part. |
| Calendar / Date Picker | Solid selected days and endpoints, subtle range, today underline, header/weekday typography through public roles. | Date-picker forwarding exposes fewer calendar Parts; locale, date constraints and keyboard semantics remain. |
| Table / Data Table | Line/md 14/20px, 16px inline/12px block cells; small 12/8px, large 16/16px; bottom rules, transparent header. | Native table helpers expose cells; data-table internal directions are not all forwarded. Sorting and virtualization remain. |
| Carousel | Shared measured gap 16px and selected-position paint. | Number/thumbnail controls retain targets and labels; source 10px dots are not substituted. |
| Steps | md 40px circular indices, 2px stroke, 12px gap, labels 500 through number/control/label Parts. | Current/error tiles remain. No public connector or per-state number Parts permit exact completed/current circles. |
| Avatar / Badge / Tag | Avatar md 40px and 16px initials; badge subtle/sm 12/16px, 6px inset, min 20px; tag surface/md with inset border and 4px radius. | Avatar size inheritance and image content remain; removable tag actions retain protected targets. |
| Alert / Toast | Alert subtle/md with 16px inset, 12px gap, 20px icon. Toast panel, extra-large shadow, 16px inset/end 24px, 14/20px title. | Semantic contrast adaptations, explicit border/padding hooks, announcements, timeout and close action remain. |
| Progress / Spinner / Skeleton | Progress md 10px track with 2px corners; spinner 20px/2px/500ms; skeleton 1.2s pulse with .5 midpoint opacity. | Native progress range paint differs by engine. Reduced motion and forced colors remain; no determinate Progress Circle exists. |
| Status / Timeline | Presence status 14/20px, 8px gap, .64em indicator. Activity entries unboxed, 24px gaps, title 500/body 400 and authored metadata 12px. | Identity/status cues remain. Activity feed does not export generated child typography Parts or source timeline marker/connectors. |
| Color Picker / Swatch | 256px panel, 16px inset, 180px plane, 14px channels/thumbs, 28px preview; swatch 2px corners and inset shadow. | Inline picker, gamut/conversion/wheel behavior and interactive swatch target floors remain. Dynamic color is authored content. |
| File Upload | 256px minimum dropzone, 2px dashed boundary, 6px corners; 12px list gaps, 16px file-row inset. | Real hidden file input and removal targets remain; no fabricated preview or file metadata. |
| Tags Input / Rich Text Editor | Shared 14/20px control type, 12px inline/8px block inset; compact 28px tokens with 2px corners. | Token editor data model and rich editing behavior differ; source Tiptap composition is not a theme recipe. |
| Splitter | 1px separator and 8×24px capsule handle with 1px line/small shadow through public Parts. | Hit targets, grid measurement, keyboard and RTL resize behavior remain. |

## Native typography and composition

Documented native typography helpers receive complete role fonts rather than a
page-wide reset. Inline `code.en-code` follows the subtle small badge recipe with
mono 12/16px and 6px inline inset; `kbd.en-keycap` follows the raised medium recipe
with mono 14/20px, 1px border and 2px bottom edge. The exported
`codeBlockTemplate` already supplies a label, preformatted code and optional copy
callback/button. Its shared spacing, radius and surface tokens apply, but its
private preformatted pattern uses fixed `monospace` and inherited size; `font.code`
does not currently customize that pre. There are no public header/toolbar/line
controls for source syntax, focused/diff lines or expanding content.

Native `quote/subtle` and `prose/content` presentations apply the source
blockquote's 20px inline inset, 4px muted start border and 8px gap; prose lists
receive neutral subtle marker ink. `description-list/subtle` maps md 14/20px text,
normal muted labels and 4px within-pair/16px between-pair spacing onto the documented
flat `dt`/`dd` recipe. Source quote icons/captions and arbitrary description groups
remain authored content. The native divider already supplies a 1px semantic line. Mark/Highlight require authored marked
ranges; Stat uses semantic text roles rather than an invented trend component.
Native emphasis and HTML semantics remain untouched. Layout utilities can consume
shared space/layout tokens through `en-stack`, native stack/cluster/grid/scroll
helpers or application CSS. This theme does not install Chakra's layout prop API,
locale providers, portals, rendering loops, QR generation, marquee or floating
window behavior. Chakra's lifecycle `Presence` utility is unrelated to En Reve's
user-status `en-presence` component.

## Authored delivery and motion

[`definitions.json`](../definitions.json) owns the trusted light/dark baselines
and `ThemeCompanionRecipe`; [`chakra.light.json`](./chakra.light.json) and
[`chakra.dark.json`](./chakra.dark.json) own managed edits. Typed source tokens
provide structured shadows, fonts and component roles. A finite target/presentation
pair accepts token IDs through its declared `roles` and registered hook assignments
through `tokens`. Trusted code in `packages/tokens/src/companion/` binds those values
to public Parts or documented native helpers. Imported data supplies no selectors,
CSS declarations or shadow ancestry.

Companion CSS is installed after token CSS. Named container style queries select
the nearest full theme boundary, including repeated theme names; direct rules
include matching components/native helpers on the boundary itself. Automatic
appearance emits matching light/dark media rules. Full themes reset optional
pins, while partial overrides preserve unspecified pins. Public hook expressions
resolve on their consuming host, Part or native helper.

Each full theme boundary reserves `--en-theme-companion` in its `container-name`
list. Consumer `container-name` or `container` declarations must retain that name
alongside their own; omitting it can cause missing presentation or loss of nested
isolation. Companion CSS does not set `container-type` or add size containment.
Delivery requires custom-property container style queries. Hook defaults have
zero specificity and permit ordinary class/inline overrides. Native presentation
rules match the base public helper's class weight; Part selectors retain their
usual pseudo-element weight. Normal specificity and source order govern direct
geometry/paint overrides. See the
[authoring contract](../../../plans/theme-api-authoring-contract.md) for adoption,
portal boundaries and the pinned browser matrix.

Motion inputs match source durations where the existing lifecycle supports them:
dialog **200/100ms**, drawer **500/400ms** with `cubic-bezier(.32,.72,0,1)`, popover,
hover card and menu **150/100ms**, tooltip **150/150ms**. En Reve owns transforms,
positioning and presence: drawer travel remains bounded, anchored surfaces retain
their native fade/elevation, and the backdrop shares modal timing instead of the
source's independent duration. Reduced-motion preference retains authority.

## Evidence boundary

This mapping and its crosswalk describe source defaults and authored public
controls. They are not execution receipts. Catalogue replay, exact paired CSS/JSON
roundtrips, compiler diagnostics and real-browser checks establish separate,
source-bound evidence; the current report records their commands and results.
Rendered review must cover light/dark/auto, nested boundaries, explicit and inherited
sizes, hover/selected/disabled/invalid/focus, RTL, content growth, forced colors and
reduced motion. None of these documents claims pixel equivalence, all-background
contrast or manual assistive-technology acceptance.
