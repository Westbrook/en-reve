# Web Awesome fidelity review

The first recipe was a useful palette/geometry match, but it was not the best fidelity achievable. This pass compares the **installed Web Awesome 3.13.0 Default light theme** with En Reve at the same 1440 × 1100 viewport, waits for the asynchronous inspired theme to finish applying, and inspects actual component styles and screenshots. It also verifies the paired dark recipe and portable theme delivery. The native fixture, frozen En Reve performance baseline, and raw timing samples are unchanged.

[Inspired showcase](http://127.0.0.1:4493/showcase?theme=web-awesome-inspired&appearance=light&progress-report) · [Native showcase](http://127.0.0.1:4518/?progress-report) · [Original mapping and contrast adaptations](web-awesome-theme.md).

## Corrections in this pass

| Area | Previous inspired rendering | Native reference | Change |
| --- | --- | --- | --- |
| Page canvas | White | Lowered gray surface, `#f1f2f3` in light mode | Use the lowered surface for the application canvas, retaining white cards and inputs; equivalent dark mapping |
| Choice/content typography | General UI weight 500 propagated into switches, checkboxes and card content | Choice/body weight 400, action weight 500 | General UI weight 400; preserve medium action and tab weight through scoped typography; field labels remain 500 |
| Accent badge | Pale blue fill, dark text, 14px / 22.4px text, 6px corners | Loud blue fill, white text, 12px / 12px text, 3px corners | Accent fill/text match the reference; scoped 12px typography and 3px corners. 4.5px/7.5px padding follows the native 12px badge; the decorative border remains separately documented |
| Progress | 8px track, lowered-surface fill | 16px track, neutral Gray 90 fill | 16px and decorative line color, with source values in both appearances |
| Slider track | 4px | 8px | 8px through the existing range-track role; target size is unchanged |
| Avatar | 40px | 48px | 48px through the existing avatar size role |
| Resting tabs | Normal dark text, opaque white background | Quiet neutral text, transparent background | Quiet text, transparent fill and native 1.6 leading; preserve the selected-state treatment |

These are shared catalogue changes, not page-local overrides. The token pair and regenerated trusted companion travel through CSS download, paired JSON export/reopen, API examples, Theme Review and workflow previews. No private shadow selectors or imported arbitrary CSS are used.

The narrow delivery API change allows a code-owned companion to assign **registered, typed public typography roles** to its known targets, adds badge/tab/choice targets and validated badge variants, and corrects the field target spelling to `en-textarea`. Type mismatches, unknown properties/targets, mechanical tokens and arbitrary CSS remain rejected. Existing descendant theme boundaries remain excluded. The overall recipe still uses schema 1; existing recipes retain their behavior.

## Point-by-point showcase comparison

| Card / pattern | What now matches or already matched | Remaining difference and ownership |
| --- | --- | --- |
| Make something / actions | Brand fill, neutral outlined action, 43px medium controls, 6px radius, system font, 500 action weight, subtle press scale | En Reve authors Reset/Actions/All commands as ghost and Reset canvas as an icon. Native fixture uses outlined text buttons. This is a composition choice, not lack of button paint APIs |
| Text fields and notes | White fill, Gray 50 functional edge, 16px regular input text, 16px inline padding | En Reve hides two visible labels and requests two textarea rows; native requests three. Textarea line height also shares input typography in En Reve; see API items below |
| Around the studio | Source blue link role and neutral hover surface | En Reve uses navigation rows and a non-link current breadcrumb; native composes ordinary links and breadcrumb items. Wrapping/row spacing follows each pattern contract |
| Creative brief / tabs | Quiet resting tabs, blue selected text/indicator, transparent surfaces and 25.6px line height | Native tabs have 16px/24px padding; En Reve still shares control spacing. Native indicator motion is not reproduced |
| Review guidance / disclosure | Text, surface and focus palette | Native `wa-details` is a rounded bordered enclosure; En Reve authors an accordion with bottom separators. Changing anatomy globally would affect every accordion |
| Brand artwork | Brand blue, lowered surface, system typography | Artwork composition and custom/native color field affordances differ. These are authored illustration and control choices |
| Creative momentum | Source color roles and regular explanatory text | Native uses button-appearance radio controls; En Reve authors segmented choices. Chart bar layout and content typography are application composition |
| Readiness | Matching 20px checkboxes with 3px corners, regular choice labels, 16px progress | En Reve retains larger click targets. Native's badge defaults to brand while En Reve explicitly chooses a semantic variant; semantic variants are not all coerced to blue |
| Asset preview | White raised card, 12px corners, source small shadow | Artwork dimensions, display text and action variants are authored composition |
| Feedback / rating | Source text and action colors, textarea paint | Native is a compact star slider; En Reve is a radio group with visible No rating and larger targets. Star fill/target surface lack independent family tokens |
| Project and review date | Matching single-line field paint, control radius and normal input font | Native date picker is browser-owned; En Reve supplies a custom calendar. This is a capability difference; the custom calendar must retain its semantic and focus behavior |
| Output / slider and number field | 8px slider track, 43px single-line fields | Slider thumb, filled track and exact-value editor differ. Number stepper layout and button geometry differ. Current tokens couple thumb size to general icon size |
| Access / validation | Input geometry, focus geometry and semantic feedback colors | En Reve retains its form validation, description and target contracts; native error/invalid presentation is not assumed interchangeable |
| Notifications | Matching 35×20px switches and 12px thumbs; regular label weight | Native off-state fill/thumb and En Reve off-state contrast differ. Existing switch anatomy hooks do not separately expose every paint role |
| Team | 48px circular avatars; select field paint | Avatar initials size/paint are coupled to broader typography/surface roles. Native free select lacks En Reve's teammate search capability |
| Chat, share and empty library | Source typography, surface/brand palette, regular supporting content | En Reve uses richer existing patterns/icons; native composes simpler content. Document padding, card order, headings and spacing are application-owned |
| Dialog, menus, toast and drawer | Source surface/border/shadow, option corners, timing tokens and focus geometry | Exact keyframes, toast accent rail, native dialog layout and per-family motion choreography differ; public source timings are not proof of identical motion |

A visual difference is not automatically an API defect. The native fixture's 18px headings, page grid and 24px card content are partly shared benchmark application CSS. En Reve's showcase explicitly reduces card block padding to 16px/18px, uses a different responsive grid breakpoint, and has theme/navigation controls. Those composition differences are recorded rather than disguised as library defaults. Theme-level changes do not rewrite component semantics or erase richer controls to make screenshots agree.

## Focused API follow-ups

| Priority | Gap | Concrete evidence / relevant source | Proposed next step and acceptance |
| --- | --- | --- | --- |
| Addressed | Scoped typography could not travel through the trusted companion | `packages/tokens/src/authoring.ts` accepted only connected override hooks; regular choice text and compact badges need existing semantic typography roles; choice label-text consumes label-strong weight rather than the wrapper UI weight | Added finite, typed typography support plus badge/tab/choice families; verify catalogue roundtrip, nested boundary isolation and actual browser styles |
| 1 | Component typography remains too coupled | `foundations.ts` gives every shadow host the UI role; `controls.ts` shares input line height between single-line and multiline controls | Add explicit body-content/textarea typography roles or documented family recipes. Match regular 400 body/choice, 500 action/labels and 1.6 multiline leading without enlarging single-line fields |
| 1 | Range visual roles are coupled to unrelated tokens | `internal/range.ts`: thumb diameter consumes `size.icon`; track consumes `color.boundary`; no independent progress fill on native range | Add thumb diameter, border/fill and track/fill roles. Preserve native input semantics, keyboard control, focus contour, contrast and coarse-pointer targets in all engines |
| 2 | Badge recipe cannot independently control all visual dimensions | `feedback.ts`: metadata typography, shared decorative border, semantic variants | Scoped typography/variant fill now works. Add badge-specific border/font roles if common; preserve semantic success/warning/danger, rather than applying global blue fill |
| 2 | Tab spacing and indicator motion lack family-level inputs | `selection.ts`: shared control padding and border-based indicator; scoped typography now matches the native line height | Add tab inline/block padding roles; a moving indicator needs an explicit supported geometry/motion contract, not hidden CSS assumptions |
| 2 | Switch state paint and avatar typography are incomplete | `controls.ts` switch paint uses broad surface/boundary/action roles; `feedback.ts` avatar initials use label-strong typography | Add state-specific switch track/thumb paint and avatar initial typography only with useful independent consumer cases; retain focus and boundary contrast |
| 2 | Rating paint is tied to general action text and control geometry | `selection.ts`: star and selectable surface roles are not independent | Expose star fill/empty paint and target surface separately; keep the No rating option and radio semantics |
| 3 | Details/accordion and toast anatomy differs | Accordion separators versus rounded details enclosure; native toast accent rail | Decide whether these are supported variants before adding tokens. Tokens should not promise an anatomy the pattern does not implement |
| 3 | Public CSS hooks and typed source tokens are uneven | Badge/progress/tab hooks are registered, but several lack default source token entries and require typed source declarations before pinning | Consider generating optional source definitions from the contract registry; retain `initial` resets and avoid inventing tokens with no consumer |

The smaller controls and typography improve fidelity without claiming pixel equivalence or whole-system accessibility certification. Previously documented contrast adaptations remain: darker light pressed fills, a sufficiently visible light focus ring and stronger dark functional borders/neutral action ink.

## Evidence and validation

Before/after component captures and computed-style inventories live in `artifacts/web-awesome-fidelity/`. Acquisition uses identical desktop viewport and current native fixture assets; it is visual/functional QA, not a new timing benchmark. The [completed verification receipt](../artifacts/web-awesome-fidelity/verification.json) records actual browser/test outcomes and source hashes. All 15 unique reader cases completed across Chromium, Firefox and WebKit: 14 passed initially, and Firefox’s exhaustive numeric-sort case passed in isolation after the initial ten-minute overall timeout. The unchanged assertions and time budget, initial failure and recheck are retained. Prior theme evidence remains in `artifacts/web-awesome-theme/`; it describes the preceding recipe version.

The main performance report now presents Web Awesome directly in the original metric groups and the first reference summary, with acquisition provenance and sample counts. Historical values remain unchanged. Main-table integration is repeatable via `node showcases/performance/experiments/report-web-awesome.mjs --config reports/web-awesome/config.json --integrate`; `main-integration.json` records the source mapping. Cross-cohort rows are descriptive; only the retained contemporaneous three-system acquisition supplies paired differences.

## Screenshot follow-up: Reset, joined selection, links and action width

The supplied Creative momentum screenshots exposed missing delivery contracts as well as the previously catalogued composition differences. The theme now includes finite, code-owned companion presentation recipes. These use public CSS Parts/native classes, retain descendant theme boundaries and survive the existing paired JSON/CSS export and re-import flow. No page-specific theme-name selectors or computed-style JavaScript are used.

| Requested detail | Delivery | Contract preserved |
| --- | --- | --- |
| Reset outline | `data-en-action="reset"` identifies the optional styling role; the Web Awesome recipe supplies neutral outlined action tokens and 16px label text | Other ghost actions retain their paint; Reset remains a native button |
| Joined segmented control | `presentation: "joined"` gives content-sized, adjoining choices, shared seams, logical outer corners, regular option text and a pale-blue selected surface with blue border | Native radios, fieldset/legend, keyboard navigation, cancellation, focus and coarse-pointer floors remain. It is visually a joined button group, not ARIA toolbar semantics |
| Blue workflow link | Native showcase anchors now opt into `.en-link` and load the standalone link stylesheet | Link color follows the independent `color.link` role |
| Dotted-to-solid underline | `presentation: "dotted-underline"` uses the native source's 70% current-color dotted decoration; hover uses a solid current-color underline | Actual anchors and `en-link::part(control)` are supported; keyboard focus remains visible |
| Full-width card/form action | `data-en-action="standalone"` opts a button into the theme's `presentation: "stretch"` recipe, sizing both host and `control` Part | Header resets, row/toolbar buttons and icon actions are not opted in; the parent still owns available width |

For consuming applications, width is an explicit layout role that a theme may interpret, rather than a global rule for every primary or secondary button:

```html
<en-button data-en-action="standalone">Add to demo team</en-button>
<en-button data-en-action="reset" variant="ghost">Reset</en-button>
```

Consumers can also use their own container CSS to size both `en-button` and `en-button::part(control)` to `100%`; they need not use a theme recipe. The annotations have no behavior or ARIA meaning. This avoids inferring layout from button text, variant or incidental DOM ancestry.

The joined recipe required exposing logical endpoint and state Parts on the existing option labels: `option-start`, `option-end`, `option-joined`, `option-selected`, `option-enabled`, `option-disabled`. No DOM wrappers or runtime layout reads were added. Hidden items do not determine endpoints; one visible item has both outer corners. Part selectors in tests use token matching (`[part~="option"]`).

The live theme changes do not modify the frozen native fixtures or recorded performance comparisons. Chart composition, summary panels and the custom calendar remain separate from these requested refinements. Current follow-up evidence is in `artifacts/web-awesome-details/`; earlier fidelity evidence records the preceding recipe.

Verification of this follow-up: workspace production build passed; 7 authoring and 2 Web Awesome catalogue checks passed; 12 theme cases and 24 default segmented/focus cases passed across Chromium, Firefox and WebKit. Three new cases initially used a raw text assertion that cannot read slotted labels; replacing it with the actual named native-radio assertion passed in all engines. Both runs are retained. Matched-viewport captures of the activity and team cards confirm the requested paint/layout details. See `artifacts/web-awesome-details/verification.json`.
