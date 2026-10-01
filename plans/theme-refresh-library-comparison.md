# Five libraries: component coverage and proposed additions

September 20, 2026. Companion to the [theme refresh](theme-refresh-report.md), [Radix theme mapping](theme-refresh-radix.md) and [pressed-state audit](theme-refresh-pressed-states.md).

Our library already exposes **77 public custom elements**, plus native HTML styles, templates and controllers. The largest gaps are specific interaction contracts and reusable compositions, not basic controls. This comparison covers **Radix Themes, Spectrum 2, Fluent 2, Astryx and shadcn/ui**. Holotable remains a product-design reference; it is not counted as an external component library.

The new Radix theme is implemented. Every component/API addition below is a **proposal**, not a newly shipped capability or an agreed release requirement.

## A fair comparison

An existing equivalent supports the same main task; it does not promise every external prop, visual variant or keyboard policy. A partial capability has an identifiable missing behavior or presentation. A recipe uses existing controls and semantic HTML. A new custom element is justified when it owns repeated interaction, state, form participation or focus behavior—not merely because another framework exports a wrapper.

The reference families are deliberately distinct:

| Reference | Compared source | Important boundary |
| --- | --- | --- |
| Radix | [Themes playground](https://www.radix-ui.com/themes/playground) and linked Themes docs; adjacent [Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) explicitly labeled | Themes is styled; Primitives additionally supplies toggle groups, toolbars, menubars and navigation menus. The homepage's marketing typography is not the default product typography. |
| Spectrum | Current [React Spectrum S2](https://react-spectrum.adobe.com/getting-started) catalogue | Spectrum Web Components is secondary evidence, with a different catalogue and generation. Do not attribute every Web Component export to S2. |
| Fluent | [Fluent 2 React v9 guidance](https://fluent2.microsoft.design/components/web/react) plus the linked [Web Components Storybook](https://storybooks.fluentui.dev/web-components/) | React and modern WC have different inventories. The WC split-button story composes Menu and actions; it is not a separate SplitButton export. The exact deployed WC package version is unestablished. |
| Astryx | [Official component catalogue](https://astryx.atmeta.com/components) and pinned public source | Branded documentation styling and Neutral previews differ. Source exposes some families beyond the most prominent catalogue entries. |
| shadcn/ui | [Current component catalogue](https://ui.shadcn.com/docs/components) and pinned Base implementation used by Rhea | Base UI, React Aria and Radix-backed alternatives are not identical implementations. Registry compositions, charts and workflow patterns are not all independent primitives. |

Detailed inventories, source links and local implementation evidence are in [Radix coverage](theme-refresh-library-gaps-radix.md), [Spectrum/Fluent coverage](theme-refresh-library-gaps-spectrum-fluent.md), and [Astryx/shadcn coverage](theme-refresh-library-gaps-astryx-shadcn.md). These include source hashes and version boundaries. This is a source/contract audit; the rendered verification for the new theme is a narrower, separately recorded sample.

## What is already covered

Buttons and icon actions, fields, labels/help/errors, native selects, single comboboxes, checkbox/radio/switch, tabs, accordions, ordinary navigation, dialogs, drawers, popovers, tooltips, tables, trees, avatar/presence, alerts/toasts, skeletons, progress and carousels already have counterparts. We also have meaningful breadth beyond a basic component kit:

- Menus already support checkable/radio commands, nested submenus, typeahead, safe pointer transit and touch replacement panels.
- Date picking already supports ranges; date/time fields and locale-aware presentation already exist.
- File selection/drop, color controls, split panes, table/tree virtualization and avatar overflow are delivered capabilities.
- Toolbars already manage direct-button roving focus. Mixed controls have a deliberate ordinary-Tab fallback.
- Native description lists, blockquotes, empty states, file/content cards, disclosures, grids and scrolling recipes count as coverage.

These are equivalences at the task level. A static card is not automatically a selectable collection; a spinner is not a determinate circular progress indicator; a token editor is not a multivalue form picker; a styled checkbox menu is not a multiselect combobox.

## Cross-library gaps worth pursuing

The reference column names where this audit established the pattern. It is not an exhaustive claim that the other libraries lack it. Priorities here synthesize cross-library value and sequencing, superseding the companion reports' source-specific ordering where they differ. They are proposals, not a requirement to ship everything before theme v1.

| Priority | Gap and reference evidence | Current boundary | Proposed delivery |
| --- | --- | --- | --- |
| P1 | **Persistent toggles and groups** — Radix Primitives, S2, Fluent, Astryx, shadcn | `en-button` does not forward `aria-pressed`; segments represent a single radio choice. | Add an explicit button toggle contract or `en-toggle-button`, then optional single/multiple group ownership. Define accepted versus tentative value, empty selection, mixed state and toolbar participation. Keep persistent pressed state separate from transient `:active`. |
| P1 | **Removable tags and multivalue pickers** — S2, Fluent React, Astryx, shadcn | Badge is noninteractive; combobox/select are single-valued; token editor owns a document. | Build removal/focus-recovery semantics and a tag/group model, then a multiselect picker with stable keys, independent query, repeated form values, validation, reset and disabled/read-only policies. Keep remote data application-owned. |
| P1 | **Selection cards and checkbox groups** — Radix Themes, S2, Fluent React, Astryx | Choices and card surfaces exist; no standard whole-card choice presentation or aggregate checkbox owner. | Start with native checkbox/radio card recipes and correct labels. Add a group owner only for aggregate values/validation. Treat a selectable card collection as a separate keyboard/action contract; do not turn every card into a focusable widget. |
| P1 | **Context-menu invocation** — Radix, Fluent WC, Astryx, shadcn | The menu engine exists, but not context-target identity and point/keyboard anchoring. | Add an invocation/positioning controller that reuses `en-menu`; consider a facade only if useful. Specify ContextMenu/Shift+F10, pointer/long-press, fallback action access, dismissal and focus return. |
| P1 | **Confirmation-dialog semantics** — Radix, Astryx, shadcn; related S2/Fluent patterns | Confirmation can be laid out in `en-dialog`, but the private surface has no alert-dialog mode/description contract. | Extend the existing modal with actual surface semantics, description association and intentional initial focus. Keep cancel/confirm/pending/error content composable and destructive work application-owned. |
| P1 | **Field adornments and label help** — Radix slots, Astryx/shadcn Input Group, S2 ContextualHelp, Fluent InfoLabel | Fields own correct labels/descriptions, but lack a general shared chrome/adornment contract; interactive content does not belong inside their label slot. | Add prefix/suffix and adjacent help-action composition with coherent focus/invalid styling, separate action targets and explicit naming. Joined input/button/select groups should reuse existing field owners. |
| P2 | **Range slider** — Radix, S2, shadcn | Current slider owns one number and one thumb. | Add ordered endpoints, distinct thumb names, collision/step policy, keyboard/RTL behavior, form/reset and exact-value alternatives. Two unrelated sliders are not interval parity. |
| P2 | **Supplemental hover previews** — Radix, Astryx, shadcn | Tooltip is described noninteractive help; click-open popover is a nonmodal dialog. | Define a link-preview pattern using existing positioning/transit infrastructure. Radix's screen-reader-ignored supplemental preview is a different contract from an interactive hover dialog. Essential content must remain reachable without hover. |
| P2 | **Selectable lists/cards and overflow** — S2, Fluent React, Astryx | Tree/table selection and count-based presence overflow exist; generic finite collection and width-driven action overflow do not. | Reuse keyed focus/selection primitives. Specify actions, selection and embedded controls before choosing list/grid semantics; preserve focused items when overflowing. Add bulk-action bar recipes before another toolbar element. |
| P2 | **Static callout, meter and circular progress** — Radix Callout, S2 Meter/ProgressCircle | `en-alert` always announces as status; progress bar and indeterminate spinner have different semantics. | Add static callout/announcement policy, native meter styling, and determinate circular progress presentation. Avoid acquiring live-region semantics just to obtain a surface style. |
| P3 | **Menubars, navigation flyouts, sheet gestures** — Radix Primitives, Astryx, shadcn; Fluent variants | Native navigation, command menus, modal drawers and responsive disclosures exist. | Extend coordinated open-menu/arrow ownership, mega-navigation recipes, or sheet snap/scroll arbitration only for demonstrated needs. Keep website navigation, desktop command menus and nonmodal side panels distinct. |

Suggested names are provisional. Each behavioral addition should keep the library's existing event, cancellation, SSR/hydration and form policies; imitating React props is not a reason to introduce another ownership model.

## Implementation follow-through

The gap list above records the audit baseline. The authorized closure is tracked in [Component gap implementation](component-gap-implementation.md), with working examples in the [component pattern laboratory](/component-patterns.html). The public catalogue now includes 96 custom elements. The implementation report distinguishes new interaction owners from native recipes and application responsibilities.

## Recipes before new elements

Several visible gaps can be closed cheaply and correctly through native recipes: `kbd`, inline/block code, timestamps, separators, static callouts, joined buttons, native submit/reset actions, card actions, inset/flush media, choice tiles, metadata orientations and responsive app/form shells. Radix's Box/Flex/Grid/Container/Section exports do not imply five missing custom elements. Their useful contribution is documented spacing, responsive composition and predictable nested padding.

The comparison specimen should pair equivalent tasks, not export names: primary/neutral/destructive/icon/toggle actions; default/invalid/adorned fields; single/multiple choices; submenu checks and context invocation; ordinary/confirmation dialogs; static/dynamic feedback; navigation versus tab panels; metadata, code/keycaps and media cards. Label application compositions and unsupported cases. This fixture is a proposed next deliverable, not included in the new theme implementation.

Broader product patterns remain optional: Astryx query builders and lightboxes; shadcn charts, OTP, streaming transcript policies and questionnaires; Spectrum calendar/timezone depth and generalized drag/drop. Existing controls provide ingredients, but do not establish full parity. Prefer a chart adapter with text/table alternatives over binding the design system to a chart engine; a form workflow example before a questionnaire element; a dialog/carousel media recipe before a full viewer. Their source-specific details remain in the companions.

## Implications for the first official theme API

The Radix exercise strengthens existing recommendations:

1. **Separate presentation, intent, color and state.** Radix's solid/soft/surface/outline/classic/ghost axis is independent of local color and high-contrast appearance. Our primary/secondary/ghost/danger enum cannot express that full matrix. Define bounded family roles and precedence before multiplying global pins.
2. **Expose the anatomy already missing from current consumers.** Alpha colors, layered shadows and inset shadows are supported values. Card/input/button elevation, pseudo-surface composition, backdrop filtering and classic gradient treatments lack complete portable consumers. Fix that distinction in documentation and diagnostics.
3. **Complete portable pressed and focus composition.** Scale/offset/filter/elevation effects need connected roles and reduced-motion alternatives. Focus must remain immediate and visible; press styling must not replace it or destabilize the hit area/anchor.
4. **Make typography and sizing relationships explicit.** Tracking, independently scoped field/label/content roles, size-dependent corners and a protected interaction frame matter more than another global scale knob. A 32px source button and our larger target floor are an intentional adaptation.
5. **Bind new hooks to real component contracts.** Themes cannot manufacture multivalue form state, a second thumb, alert-dialog semantics or tag removal focus recovery. Define states/Parts/geometry with each accepted component, then prove export/reopen, scope reset and real consumer coverage.

The pre-v1 decision is a stable extension model and truthful capability matrix. It does not require implementing every external pattern before the first release. These recommendations remain open for prioritization; no new component, dependency, publication or external font redistribution is implied.
