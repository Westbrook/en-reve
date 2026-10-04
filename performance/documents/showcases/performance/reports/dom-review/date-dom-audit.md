# Date-control DOM audit

Reviewed 2026-09-20. This is a source investigation of the eight frozen native showcases, with a separately identified review of current En Reve source. It proposes experiments; no component implementation or frozen benchmark artifact was changed. The companion connected-DOM census supplies the measured counts. Numbers below described as structural estimates are not measurements of a modified implementation.

## What belongs in the date exclusion

The comparison should publish **whole implementation**, **date-owned subtree**, and **implementation minus date-owned subtree** at each checkpoint. Exclude the entire field, including its visible label, supporting text, trigger, hidden calendar, open shadow roots and any date-owned portal. Removing only `input[type=date]` would leave nearly all of En Reve's custom-calendar cost in its supposedly date-free total. Conversely, removing the project card would exclude unrelated fields and controls.

Keep a second decomposition within the date subtree: **closed field shell**, **calendar grid and navigation**, and **overlay shell**. This distinguishes the cost of the custom date capability from generic field/button/dialog composition. Count a DOM node once; walk light DOM and open shadow roots without walking assigned slot nodes a second time. A portal is attributed by its ownership, not its location in the document. Report any shared accessibility infrastructure outside the date root separately rather than guessing its owner.

| Implementation | Actual date surface in the recorded desktop/fine-pointer profiles | Complete date boundary | Relevant source |
| --- | --- | --- | --- |
| En Reve | Native editable date input plus custom calendar in an eagerly mounted `en-dialog` | `#showcase-project #project-date` (`en-date-picker`), including its entire shadow tree and nested component shadows | [Fixture](../../../en-reve/src/template.ts#L526), [picker](../../../../packages/elements/src/date-picker/element.ts#L211) |
| Radix React | Radix TextField around `input[type=date]`; browser owns the picker | The date input's closest `label.field` within `#showcase-project` | [Input and Date adapters](../../../radix-react/src/ui.jsx#L21) |
| Fluent React | Fluent Field/Input around `input[type=date]`; browser owns the picker | The date input's closest `.fui-Field` within `#showcase-project` | [Date adapter](../../../fluent-react/src/ui.jsx#L117) |
| Spectrum React S2 | Custom segmented DatePicker; custom calendar is mounted while open, then removed after exit | Visible DatePicker field containing “Review date” **plus the sibling `#showcase-project .pair > [data-testid=hidden-dateinput-container]`** (a `div` and native date `input`), and its owned DatePicker portal, focus-scope nodes and overlay underlay when present | [Date adapter](../../../spectrum-react/src/ui.jsx#L132); frozen RAC `HiddenDateInput.mjs` and `Popover.mjs`, below |
| Astryx React | Custom PointerDateField, text input with `role=combobox`, and custom calendar; closed calendar remains mounted | `.astryx-field` containing `.astryx-date-input` within `#showcase-project`, plus any owned corrective portal if the layer is relocated | [Date adapter](../../../astryx-react/src/ui.jsx#L103); frozen DateInput/Layer sources, below |
| shadcn React | Local Input component around `input[type=date]`; browser owns the picker | The complete date field wrapper, the final field within `#showcase-project .pair` | [Date adapter](../../../shadcn-react/src/ui.jsx#L159) |
| Fluent Web Components | `fluent-text-input type=date` with native internal date input | `#project-date` and its closest `fluent-field`, including label and open shadows | [Input adapter](../../../fluent-web-components/src/ui.js#L12) |
| Spectrum Web Components | Native `input[type=date]`; browser owns the picker | `#project-date` and its closest `label.field` | [Input adapter](../../../spectrum-web-components/src/ui.js#L18) |

The inspection artifacts [field-inspection.json](field-inspection.json) and [date-open-inspection.json](date-open-inspection.json) show the field structures and open calendar ownership. React-generated IDs must be discovered per document, not copied between runs.

**Boundary correction:** independent review found that the preliminary Spectrum React exclusion selected only its visible field wrapper and missed the sibling hidden date-input container. Both the container and its input are date-owned: omitting them understated date cost by two nodes/two elements and overstated the date-free total by the same amount. Pre-correction date-subtracted Spectrum counts must not be treated as a valid complete-field comparison. The corrected v4 collector explicitly includes this sibling; use the final census receipt for numerical totals. Frozen RAC `HiddenDateInput.mjs` confirms the two-element structure and its date-picker value/state synchronization; this node is not unrelated project form markup.

The corrected [census source](../../experiments/dom-census.mjs) also asserts that every connected `input` whose resolved `type` is `date` is inside a declared date boundary. Source review confirms the check runs after boundary classification and that its inherited `inDate` state traverses both light children and open shadow roots. It therefore covers the native inputs inside Fluent WC and En Reve shadows, as well as Spectrum's hidden sibling, rather than only light-DOM inputs. This guard detects omitted native date inputs; it does not by itself prove ownership of custom text/segmented controls or portals, which require the separate boundary and lifecycle checks above.

Native browser/OS date pickers are **not free**. Their internal trees and platform UI are outside a page-level open-shadow census. Native date comparisons measure application-owned connected DOM, not the total implementation cost of the browser picker. Do not assign native popups a measured zero for unavailable internals.

Astryx is an important qualification: the executable frozen `DateInput` defaults `nativePicker` to `touch`; a coarse pointer uses NativeDateField, while a fine pointer uses PointerDateField. Its nearby prose still describes another touch default. The current narrow-viewport campaign does not emulate a coarse pointer, so the executable branch and observed DOM identify it as a custom-calendar case. A future physical/mobile campaign must report the selected surface rather than assume the desktop tree.

## The main opportunity is mounting policy

En Reve's `render()` unconditionally instantiates `en-dialog` and `en-calendar`. The calendar constructs its table and day controls while the dialog is closed. Closing the dialog hides the existing subtree; `hidePicker()` does not disconnect it. Astryx's PointerDateField is also eager: `usePopover` calls `useLayer` without `lazyMount`, whose context-mode default is false. Spectrum React provides a useful alternative: its frozen RAC Popover returns `null` when neither open nor exiting.

First investigate **mount calendar content on demand**, then compare two policies: retain after the first opening, or disconnect after close/exit. Retaining trades a lower initial connected count for a higher later steady-state count. Disconnecting may lower that later count, but remounts and must restore accepted state and focus correctly. Merely using `content-visibility`, `hidden`, `inert` or a closed native dialog does not reduce connected nodes.

The first variant can retain a small dialog shell and defer its calendar child, which preserves the existing same-shadow trigger association more easily. A second variant can defer the full dialog. Today `showPicker()` queries both nodes and returns if either is absent, so either variant needs a deliberate first-open construction path, not just a conditional in the template. The opener must reflect the correct popup semantics before interaction; close, canceled selection, author writes, form reset and disabled/readonly transitions must keep their existing behavior.

Measure untouched load, first successful open, closed after first use, and closed after repeated use. Record connected elements, text, comments and shadow roots at every checkpoint; measure first/repeat open and date-selection presentation separately. A smaller initial tree is useful only if its first-use cost is acceptable. Keep deferred mounting and deferred module import as separate experiments so node savings are not confused with network/parse savings.

## What the calendar actually contains

[Calendar render](../../../../packages/elements/src/calendar/element.ts#L278) uses a native table with `role=grid`. Each ordinary day has **one `td` and one native `button`**, not an `en-button` and shadow tree. The six-week primitive creates 42 days; this is **84 day cell/control elements** before row structure, headings, navigation, text and Lit markers. There are seven additional weekday presentation spans. Range bands and range status/actions are conditionally emitted only in range mode; the showcased picker is single-date mode.

The table cells carry selection state, while native buttons supply activation/focus semantics. Replacing the pair with a single arbitrary element would trade proven native behavior for new keyboard and accessibility work. The same cell-plus-native-button pattern exists in Astryx. Spectrum React has more visual inner divs per cell, but it does not mount that calendar while closed. These examples show why both state and node type matter more than a single whole-page count.

Lit child-expression markers and formatting whitespace contribute to the all-node total without producing an equal number of layout boxes. In En Reve's shared single/range day template, every cell has a range-band expression even when the result is `nothing`, plus a conditional button expression and a dynamic text expression. An experiment with a dedicated single-date template could remove unnecessary expression boundaries without removing semantic elements. Its exact savings need a runtime census; copied template code may increase JS bytes and maintenance cost. Do not strip Lit markers after rendering: they are renderer state, and the SSR/hydration path must remain valid.

The per-day template also installs `pointerenter`, `focus` and `click` handlers. Delegating those where practical can investigate listener/closure/update cost, **not connected-node reduction**. `pointerenter` and `focus` do not simply bubble: a delegation variant would need suitable bubbling events or capture, correct target/related-target handling and unchanged preview behavior.

## `part="base"` within the date stack

The direct date/calendar implementation has **one** `part="base"`: the calendar's outer `<div class="en-calendar">`. The date input and picker use `field`, `focus-frame` and `picker-layout` parts; the dialog uses `surface`, `header`, `body` and `footer`. Do not multiply this base wrapper by the 42 day cells.

| Responsibility of calendar base | Evidence | Host migration assessment |
| --- | --- | --- |
| Bounded width, maximum width, horizontal scrolling and text color | [Calendar styles](../../../../packages/styles/src/calendar.ts#L9) | Plausible on the existing block host; preserve behavior when inline calendar and slotted into a dialog. |
| `--_en-calendar-target` and coarse-pointer target-size scope | Same styles | Move variable declaration and coarse-pointer rule together; all descendants must inherit identical sizing. |
| `data-selection` styling anchor for single/range interactions and colors | Calendar render/styles | Host already reflects `selection`; rewrite descendant rules to an explicit host state rather than accidentally matching both modes. |
| Keyboard scroll surface | [Calendar updated()](../../../../packages/elements/src/calendar/element.ts#L259) reads `.en-calendar` geometry and calls `scrollBy` | Must change to host geometry/client borders/scrolling. Current code does not automatically follow a CSS move. |
| Public customization hook `en-calendar::part(base)` | [Calendar contract](../../../../packages/elements/src/calendar/README.md), [picker stylesheet](../../../../packages/elements/src/date-picker/element.ts#L55) | A compatibility decision is required. `part=base` on the custom-element host does not preserve the existing selector into its own shadow tree. Migrate documented CSS to the host or retain the hook intentionally. |
| Accessibility role/name/focus | Base is an ordinary `div`; role/name and roving focus live on grid/day controls | No direct semantic responsibility blocks migration. Preserve table relationships, named grid, live month announcement and focused-day behavior. |

The expected direct saving is **one element per calendar instance**. It is a useful representative wrapper experiment, but it cannot by itself remove the custom calendar's repeated-day cost or explain the whole-page gap. The host is the better initial target than the surrounding `en-dialog`: inline `en-calendar` remains a supported standalone element, and its scrolling/size semantics should remain local to it. `display:contents` retains the DOM node and is not a connected-count reduction.

Current source contains additional calendar press/motion selectors, compared with the frozen calendar stylesheet. Host migration must update those current selectors as well; replacing only the older baseline selectors would miss them.

## Focused experiments and acceptance criteria

| Investigation | Candidate gain and scope | Acceptance criteria before promotion |
| --- | --- | --- |
| **D1. Defer optional calendar construction** | Largest direct initial-tree candidate in the date stack; compare calendar-only and complete-overlay deferral. | Initially no day/grid subtree in the deferred variant. First open succeeds on one activation, with named dialog, correct selected/month state and focus; report first/repeat open timings and counts through close/reopen. No duplicate nodes or listeners after repeated cycles. |
| **D2. Attribute and simplify single-date renderer markers** | Reduce all-node count and render bookkeeping without reducing semantic day controls. Separate marker/whitespace savings from element savings. | All seven weekdays, expected displayed dates, cell selection and one grid Tab stop remain. Confirm numeric node breakdown; compare emitted JS bytes, update duration and first open. Preserve year boundaries, switching to range mode, SSR and hydration. |
| **D3. Move calendar base responsibilities to the host** | One element per instance, plus simpler containment. | Width, minimum touch targets, bounded horizontal scroll, RTL, keyboard reveal, focus outline, forced colors, press/reduced-motion styles and external theme overrides match. Decide and document `::part(base)` migration before removing a public customization target. |
| **D4. Reduce repeated presentational markup** | Up to seven weekday spans are candidates; calendar navigation slot/label wrappers are another small target. | Keep valid table header structure, full accessible weekday names and matching column alignment at narrow widths/large targets. Preserve previous/next slots and official button focus/disabled/theme behavior. Do not replace accessible labels with an unlabeled decorative glyph. |
| **D5. Optional variable week count** | September 2026 can use five week rows instead of six: structurally one fewer `tr` plus seven `td` and seven `button` elements, **15 elements**. This is an estimate, not measured performance. | Treat as a contract/UX decision: the primitive explicitly promises a stable six-week grid. Compare height/layout shift during month navigation, outside-day reachability, Home/End/arrows, year bounds and range continuity. Keep a fixed-height option if required. |
| **D6. Audit generic field/overlay scaffolding** | Calendar dialog has generic header/body/footer composition; date field has label/focus/description structure. A date-specific internal shell could omit provably unused structure. | Quantify attributable savings before specializing. Empty description target is intentionally stable for late slotted descriptions and hydration; an absent current description is not sufficient reason to remove it. The focus frame exists because native replaced inputs cannot carry every supplemental decoration. Preserve validation anchors, label association, late slots, forms and theme contract. |
| **D7. Delegate day events and cache immutable calendar presentation** | Listener, repeated formatting and update cost; does not necessarily reduce nodes. | Same hover/range preview, keyboard focus movement, disabled-day behavior and canceled transactions. Measure listener count, update CPU, heap and retained state, not just DOM total. Availability invalidation and locale/month changes must invalidate caches. |
| **D8. Document the native/custom product choice** | Consumers needing native editing and platform picker alone can use existing `en-date-input`; custom calendar remains justified for uniform themed/calendar behavior. | Add a separate, labeled capability-matched comparison if desired. Keep the canonical custom showcase unchanged; do not claim `en-date-input` delivers the custom calendar contract. Compare closed/open states and disclose inaccessible native UA internals. |

Prioritize D1 and D2 for explaining the initial all-node outlier; D3 and D4 are narrower element-removal investigations. D5 changes visual behavior and requires separate consideration. D6 may have wider benefits because field, button and dialog structure repeats elsewhere. D7 is adjacent performance work and must not be sold as a node reduction.

Date acceptance is broader than clicking one September day. Cover Gregorian and supported modern Buddhist presentation, multiple locales/numerals, RTL, first-day-of-week changes, year bounds, min/max/step/unavailable dates, disabled/readonly, required validity, native typing, external value changes, equal-date confirmation, cancellation/rollback and form reset/restoration. For range mode include incomplete drafts, preview, same-day/reversed ranges, Apply/Cancel/Clear, range bands and submitted endpoints. Preserve live announcements and a single date-grid Tab stop; keyboard arrows, Home/End, Page Up/Down and Shift-year movement must continue to work. A focused accessibility review is required for any semantic-element change.

## Source identity and current-source qualification

The frozen sources were read from `.cache/snapshots/<implementation>/assets/*.js.map` `sourcesContent`, not inferred from current package documentation. En Reve's installed showcase package files for date-picker, calendar, form-field and calendar styles match their frozen sourcemap contents byte-for-byte. Current compiled picker/form-field match those frozen sources; the current compiled calendar differs in documentation comments, while calendar styles add press/motion rules. Its current source retains the same six-week table and eager picker composition. No current-source browser measurements are asserted here.

Selected embedded-source SHA-256 identifiers:

| Frozen implementation/source | SHA-256 of sourcesContent |
| --- | --- |
| En Reve `elements/dist/date-picker/element.js` | `f6d0ff7a86fc2bbb3dc542dc56dc8d702d0e5f4912b69fdb42efc5cc700aa725` |
| En Reve `elements/dist/calendar/element.js` | `10edee0a256c00f068103052f26112e08f0ee59ba0a165673722cc3eedda8db2` |
| En Reve `elements/dist/date-input/element.js` | `b32f2b68c04f07ec7f891d02129b977cc4044c696fcc36691b56dea0f8572ce6` |
| En Reve `elements/dist/forms-private/form-field.js` | `104b18d57ce3793a09ca763160a7699ce4d6a2d05c9498b61db8f3d2776e2f13` |
| En Reve `styles/dist/calendar.js` | `fb401df27da2524a6b2c41707af666911985a7ae71f20fdc3277ef06dd7f97b2` |
| Astryx `core/dist/DateInput/DateInput.js` | `b8e687da78ecc0ee5e89f5dd51ec396b6c35911d4ea12a567a8f36584b1aa468` |
| Astryx `core/dist/Popover/usePopover.js` | `74c8ded8c5c672c95b5eb236587ea012fe9deb833c6393e25eb6d4b45cf8432c` |
| Astryx `core/dist/Layer/useLayer.js` | `e1fa5de4c9b96106e7743f65b7d45cda106e0bb77767f3ffad7801978843eea4` |
| Spectrum `react-aria-components/dist/private/Popover.mjs` | `7073ba69f0f96fd957cce7a5d8fda722ce68a32f04787ec11af942cf1c330e15` |
| Spectrum `react-aria-components/dist/private/HiddenDateInput.mjs` | `265510cd677e7187f5520ad28d599a835dda752d23e81ed6e6075193b1e88050` |
| Spectrum `@react-spectrum/s2/dist/private/DatePicker.mjs` | `25ffb3d03e6c9e95c08156dbd1c64891e7a3ef1875e9f902c8015ec40c244d06` |

Future candidate counts must identify the exact production artifact, pointer environment, calendar month/value and lifecycle checkpoint. Source-structure estimates and a lower count alone do not establish faster delivery or an accessibility-equivalent implementation.
