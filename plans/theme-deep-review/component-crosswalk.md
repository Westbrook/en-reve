# Inspired-theme component crosswalk

2026-10-03 · **96 public elements, 75 anatomy families, 576 source mappings.** Chakra and Holotable are excluded. Every catalogue root is present once, including authored descriptors and generated-child roots. This is a coverage map, not a visual-fidelity pass.

The [machine-readable crosswalk](component-crosswalk.json) names upstream counterparts, source links, per-family review concerns and semantic contracts. Membership matches the current catalogue, public API inventory and Custom Elements Manifest. Historical 77-element audits remain evidence of their earlier baseline; they are not the current inventory.

**D** = direct task/anatomy analogue; **A** = explicit adaptation/composition; **N** = no direct counterpart found in the selected catalogue; **U** = unresolved generation/variant evidence. A slash shows a mixed family; exact per-element decisions are in JSON. D does not mean pixel, API or behavior parity. N is scoped to the selected catalogue, not the vendor ecosystem.

Sources: [Spectrum S2](https://react-spectrum.adobe.com/getting-started), [Fluent React v9 exports](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-components/src/index.ts), [Astryx](https://astryx.atmeta.com/components), [shadcn](https://ui.shadcn.com/docs/components), [Radix Themes](https://www.radix-ui.com/themes/docs/overview/getting-started), [Web Awesome](https://webawesome.com/docs/components/). All were re-read on October 3. Radix Primitives are not silently attributed to Themes. Current Web Awesome 3.14 includes newer, Pro and experimental families; availability does not change the pinned free-fixture baseline.

| Family · public elements | S2 | Fluent | Astryx | Rhea | Radix | WA |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| Action buttons · `en-button` | D | D | D | D | D | D |
| Persistent toggle actions · `en-toggle-button`, `en-toggle-group` | D | D/A | D | D | N | A |
| Action toolbars · `en-toolbar` | A | D | D | A | N | A |
| Measured action overflow · `en-action-overflow` | A | D | D | A | A | A |
| Text links · `en-link` | D | D | D | A | D | A |
| Command menus and items · `en-menu`, `en-menu-item` | D | D | D | D | D | D |
| Context invocation · `en-context-menu` | A | D | D | D | D | A |
| Application command menubars · `en-menubar` | A | A | A | D | N | A |
| Command search · `en-command-palette` | A | A | D | D | N | A |
| Single-line text · `en-text-field` | D | D | D | D | D | D |
| Multiline text · `en-textarea` | D | D | D | D | D | D |
| Search fields · `en-search-input` | D | D | D | A | A | A |
| Numeric fields · `en-number-field` | D | D | D | A | A | D |
| Date text entry · `en-date-input` | D | A | D | A | A | D |
| Time entry · `en-time-field` | D | A | D | A | A | D |
| One-time-code entry · `en-otp-field` | N | N | N | D | N | D |
| Single selection and descriptors · `en-select`, `en-select-option` | D | D | D | D | D | D |
| Searchable single selection · `en-combobox` | D | D | D | D | A | D |
| Searchable multiple selection · `en-multiselect` | A | D | D | D | A | D |
| Authored choice metadata · `en-choice-option` | A | A | A | A | A | A |
| Checkboxes and aggregate groups · `en-checkbox`, `en-checkbox-group` | D | D/A | D/A | D/A | D | D |
| Single-choice groups · `en-radio`, `en-radio-group` | D | D | D | D | D | D |
| Boolean setting switches · `en-switch` | D | D | D | D | D | D |
| Single-value sliders · `en-slider` | D | D | D | D | D | D |
| Interval sliders · `en-range-slider` | D | A | D | D | D | D |
| Editable ratings · `en-rating` | N | D | N | N | N | D |
| Segmented single choice · `en-segmented-control`, `en-segmented-item` | D | A | D | A | D | A |
| Calendar grid · `en-calendar` | D | A | D | D | N | D |
| Date and interval popup picker · `en-date-picker` | D | A | D | D | N | D |
| Disclosure groups · `en-accordion`, `en-accordion-item` | D | D | A/D | D | N | D |
| Tab-panel switching · `en-tabs`, `en-tab`, `en-tab-panel` | D | D | D | D | D | D |
| Page navigation and groups · `en-navigation`, `en-navigation-group` | D | D | D | D | A | A |
| Hierarchical location · `en-breadcrumbs` | D | D | D | D | A | D |
| Paged navigation · `en-pagination` | A | N | D | D | A | D |
| Workflow progress steps · `en-progress-steps`, `en-progress-step` | N | N | D | A | N | D |
| Content cards · `en-card` | D | D | D | D | D | D |
| Flow layout · `en-stack` | A | A | D | A | D | A |
| Resizable panes · `en-split-view`, `en-splitter` | N | N | D | D | N | D |
| Modal dialogs and confirmation · `en-dialog` | D | D | D | D | D | D |
| Edge drawers · `en-drawer` | A | D | A | D | A | D |
| Resizable bottom sheets · `en-sheet` | A | A | D | D | A | A |
| Interactive anchored surfaces · `en-popover` | D | D | D | D | D | D |
| Descriptive hover/focus help · `en-tooltip` | D | D | D | D | D | D |
| Supplemental previews · `en-hover-card` | A | A | D | D | D | A |
| Tables and data-table composition · `en-table`, `en-data-table` | D | D | D | D | D/A | A/D |
| Hierarchical collections · `en-tree`, `en-tree-item` | D | D | D | N | N | D |
| Selectable item/action collections · `en-selection-collection` | D | D | D | A | A | A |
| Compact status badges · `en-badge` | D | D | D | D | D | D |
| Removable labels · `en-tag` | D | D | D | A | A | D |
| Inline status/callouts · `en-alert` | D | D | D | D | D | D |
| Transient notifications and queue · `en-toast`, `en-toast-region` | D | D | D | D | N | D |
| Determinate progress · `en-progress-bar` | D | D | D | D | D | D |
| Indeterminate loading · `en-spinner` | D | D | D | D | D | D |
| Loading placeholders · `en-skeleton` | D | D | D | D | D | D |
| Form error summary · `en-validation-summary` | A | A | A | A | A | A |
| Identity portraits · `en-avatar` | D | D | D | D | D | D |
| Identity/status groups · `en-presence`, `en-presence-group` | A | D | D | A | A | A |
| File selection and drop · `en-file-upload` | D | A | D | A | N | D |
| Media/content carousels · `en-carousel`, `en-carousel-slide` | N | D | D | D | N | D |
| Modal image viewers · `en-media-viewer` | A | A | D | A | A | A |
| Semantic/decorative glyphs · `en-icon` | D | D | D | A | A | D |
| Textual color entry · `en-color-field` | D | A | N | N | N | A |
| Color channel controls · `en-color-slider` | D | D | N | N | N | A |
| Two-axis color area · `en-color-plane` | D | D | N | N | N | A |
| Hue wheels · `en-color-wheel` | D | N | N | N | N | N |
| Composite color picker · `en-color-picker` | A | D | N | N | N | D |
| Color swatches · `en-swatch` | D | D | N | N | N | A |
| Activity timelines · `en-activity-feed`, `en-activity-item` | N | A | A | A | A | A |
| Conversation messages · `en-chat-message` | N | N | D | D | N | N |
| Streaming reading/follow behavior · `en-transcript` | N | N | A | D | N | N |
| Message composition · `en-chat-composer` | A | A | D | A | A | A |
| Document and token editors · `en-rich-text-editor`, `en-token-editor`, `en-editor-trigger`, `en-editor-toolbar` | N/A | N/A/D | A/D | A | A | A |
| Question workflows · `en-questionnaire` | N | N | A | D | N | A |
| Structured filter editing · `en-query-builder` | N | N | A | N | N | N |
| Data visualization host · `en-chart` | N | A | N | D | N | D |

Counts below are per element, so child descriptors increase the totals; these are coverage classifications, not a score.

| Source | D | A | N | U |
| --- | ---: | ---: | ---: | ---: |
| spectrum | 59 | 20 | 17 | 0 |
| fluent2 | 59 | 24 | 13 | 0 |
| astryx | 73 | 14 | 9 | 0 |
| shadcn-rhea | 57 | 29 | 10 | 0 |
| radix-themes | 34 | 29 | 33 | 0 |
| web-awesome | 57 | 35 | 4 | 0 |

**Review beyond controls.** Keep these families explicit in source comparisons and rendered fixtures:

- **Compound selection and commands:** cards, tags/multiselect, selected collections, overflow, context menus, menubars and shortcut/check columns. Their owners and local CSS differ from ordinary buttons/checkboxes.
- **Range and date anatomy:** interval tracks/thumbs have their own renderer; day cells/range bands, calendar headers and field/popover layouts need separate checks. Fluent date/time/calendar counterparts are documented compatibility adaptations; Astryx and Web Awesome dual-thumb range counterparts were confirmed separately.
- **Navigation and hierarchy:** current-page versus selected state, ancestor indicators, tree indentation/actions, pagination and step markers. [Fluent navigation](https://fluent2.microsoft.design/components/web/react/core/nav/usage) and [tree guidance](https://fluent2.microsoft.design/components/web/react/core/tree/usage) provide concrete anatomy beyond surface paint.
- **Overlay and media composition:** title/body/action hierarchy, tooltip inversion, hover previews, sheet grip/sizing, carousel controls and image-viewer canvas. Astryx Lightbox and Bottom Sheet are direct counterparts. En Reve bottom sheet maps to shadcn Drawer; En Reve side drawer maps to shadcn Sheet.
- **Color and identity:** Spectrum color area/wheel/swatches and Fluent color picker require dedicated geometry; themes without these families use local anatomy. Presence needs glyph/ring, initials and group/overflow review, not merely a status dot.
- **New workflows and collaboration:** Astryx chat/composer/Power Search, shadcn Message Scroller/Questionnaire/Chart. Local editor documents, query transactions and renderer-neutral chart/table alternatives are deliberate implementation boundaries.

**Semantics stay stable; anatomy can adapt.** Themes may change geometry, hierarchy, glyphs, spacing, selected-state treatment, elevation and motion through documented Parts, tokens and recipes. They do not change native editing/IME, selection ownership, form/reset/validation, roles, keyboard/RTL behavior, synchronous cancellation/rollback, SSR snapshots or modal focus. A source that uses a slider for rating, pressed buttons for segments or screen-reader-ignored hover previews does not authorize changing the local radio/activation contracts. The JSON records these boundaries by family.

**Fluent generation resolution.** No mappings remain uncertain. Official [Calendar](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-calendar-compat/library/README.md), [DatePicker](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-datepicker-compat/library/README.md) and [TimePicker](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-timepicker-compat/library/README.md) READMEs identify separate compatibility packages derived from v8 and updated to v9 dependencies. Their calendar/date/time mappings are adaptations, not final core-v9 parity. [DatePicker types](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-datepicker-compat/library/src/components/DatePicker/DatePicker.types.ts) establish its editable input/calendar/popup anatomy. The separate [Fluent v9 chart library](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/charts/react-charts/library/README.md) is the chart reference; legacy `react-charting` is a different generation. These optional packages are absent from the pinned native showcase, so source correspondence does not imply fixture or rendered verification. The pinned React suite does include SwatchPicker 9.6.1, whose official README establishes the individual ColorSwatch counterpart.

**Evidence limit.** This pass checked catalogue completeness and source correspondence, not every source variant in a browser. Existing style consumers were inspected, including independently styled interval, chart, transcript, questionnaire and query-builder owners. Theme specialists and browser verification supply the actual implementation/fidelity disposition; this matrix prevents unexamined families from disappearing from that review.
