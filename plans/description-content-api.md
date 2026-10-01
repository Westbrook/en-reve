# One description API across fields and editors

Prepared 23 September 2026. **Status: proposed implementation plan.** This task changes planning documentation only. The audit uses the current working tree on `codex/theme-api-adoption`, based on `6d09b31cf43523ac8c75352208ab9697b62e2673`, including existing uncommitted editor work. Recheck those files before implementation; their changes belong to other ongoing work.

Adopt the existing text-field/textarea description contract for `en-rich-text-editor` and `en-token-editor`, then close concrete inconsistencies in components that already expose descriptions. Consumers should learn three names once: **`description` attribute/property, `slot="description"`, and `::part(description)`**. The associated semantic target varies with the component's purpose, but authoring and fallback behavior should transfer.

## The API to teach

The following is the proposed rich-editor API; the same description authoring already works on text fields and textareas:

```html
<!-- Plain text: attribute, or editor.description = '…' in JavaScript. -->
<en-rich-text-editor
  label="Project brief"
  description="Explain the goal and the intended audience.">
</en-rich-text-editor>

<!-- Rich supporting content replaces the fallback. -->
<en-rich-text-editor
  label="Project brief"
  description="Explain the goal and the intended audience.">
  <span slot="description">
    Explain the <strong>goal</strong> and intended audience.
    <a href="/writing-guide">Writing guide</a>
  </span>
</en-rich-text-editor>
```

```css
en-text-field::part(description),
en-textarea::part(description),
en-rich-text-editor::part(description),
en-token-editor::part(description) {
  color: var(--en-color-text-muted);
}
```

| Contract | Text field / textarea today | Proposed editor behavior |
| --- | --- | --- |
| Plain content | Reactive `description: string`, default `''`; HTML attribute accepted; property does not reflect | Identical |
| Rich content | Named `description` slot | Identical |
| Precedence | Any assigned nodes replace the fallback; remove them to restore the latest fallback | Identical, using native slot distribution |
| Empty or hidden assignment | Still suppresses the fallback | Identical; no text-content heuristic |
| Empty fallback | Stable target remains, with no visible text or trailing gap | Identical |
| Formatting | Real DOM phrasing content and ordinary help links; one wrapper for inline content, multiple roots for separate help blocks | Identical |
| Placement | Below the control, before any visible error | Below the editing surface, outside its scrolling/editable content |
| Accessibility | Native control references the same-shadow description separately from its label and error | Actual textbox references description plus its existing keyboard/picker instructions |
| Styling | Public `description` Part and existing field spacing/type/color tokens | Same public Part and supporting-text style rules |
| State | Does not alter value, events, validation or form state | Does not alter document, selection, history, drafts, composition or events |

Use these names in examples and generated API tables. Do not introduce synonyms such as `helper-text`, `help-text`, `hint`, or a separate rich-content property. Keep placeholders as in-control prompts and errors/status as distinct state feedback. Applications own translation of descriptions; the editors' `messages` API continues to own built-in instructions.

Preserve two small but deliberate compatibility details: whitespace-only string fallback is not trimmed today; an assigned empty element may retain its ordinary spacing. Do not silently normalize either behavior only for editors. A later library-wide change can reconsider these rules separately.

## What exists, and where the gaps are

| Family | Audited current state | Planned treatment |
| --- | --- | --- |
| `en-text-field`, `en-textarea`, `en-search-input`, `en-date-input`, `en-select`, `en-number-field`, `en-color-field` | Shared native-field contract | Keep behavior; serve as reference implementations |
| `en-checkbox`, `en-switch`, `en-radio`, `en-radio-group`, `en-segmented-control`, `en-slider`, `en-rating` | Existing description slot/attribute/Part, included in the fourteen-family tests | Keep authoring behavior and verify shared-style extraction |
| `en-combobox`, `en-file-upload`, `en-time-field`, `en-otp-field`, `en-date-picker`, `en-color-slider` | Existing support, some inherited; not all covered by the common matrix | Add to the conformance inventory, including composite targets and mode differences |
| `en-rich-text-editor`, `en-token-editor` | No component-level visible description API; hidden interaction hints already exist | Add the common contract to both in the first delivery |
| `en-range-slider` | No description API, unlike `en-slider`; two thumbs and two exact-value inputs | Add the same contract in the subsequent control-family phase |
| `en-checkbox-group`, `en-multiselect`, `en-toggle-group` | `MultipleChoice` owns a string description, rendered without the named slot or Part | Normalize the shared implementation |
| `en-selection-collection` | Inherits the string property but overrides rendering with an unassociated paragraph | Handle explicitly; a base-class change alone is insufficient |
| `en-dialog`, `en-drawer`, `en-sheet`, `en-media-viewer`, `en-command-palette` | Inherited string description and shared Part, conditional markup, no description slot | Normalize the shared modal template for all five, including slot-only content |
| `en-validation-summary` | String fallback and description slot already exist; no description Part | Add the styling hook without restructuring summary content |
| `en-choice-option` | Property/slot/Part exist for item descriptions; projection can fall back based on nonempty text | Verify and align slot precedence in item normalization; retain item-specific restrictions |

The implementation already has a reusable `descriptionTemplate()` in [description.ts](/Users/westbrook/Documents/repos/design-system/packages/primitives/src/templates/description.ts:10). It renders a stable `#description` target, a native slot and an empty-safe fallback span. The field contract is documented in [forms-private/README.md](/Users/westbrook/Documents/repos/design-system/packages/elements/src/forms-private/README.md:7), applied in [form-field.ts](/Users/westbrook/Documents/repos/design-system/packages/elements/src/forms-private/form-field.ts:165), and styled in [controls.ts](/Users/westbrook/Documents/repos/design-system/packages/styles/src/controls.ts:357). This is an extension of an established design.

## Implementation design

### Shared supporting content

Reuse `descriptionTemplate(this.description)` for field-like components. Extract the small description typography, spacing and empty-fallback rules from `formStyles` into an internal style fragment that both `formStyles` and `tokenEditorStyles` consume. Preserve the existing field output, public exports and token defaults; do not import the entire form layout into editors. Establish the editor's local description gap using `--en-field-gap` with an existing spacing-token fallback. Leave existing label/editor spacing unchanged when no description is supplied.

Use distinct selectors for component help (`.en-description`) and suggestion-row descriptions (currently `.description`). `::part(description)` must style component guidance without changing `EditorChoice.description` rows. No new public tokens, base class, generic slot-presence controller, mutation observer, or form wrapper is required.

Keep the stable target and native slot in the first render, including SSR, even when empty. Preserve `fallback || nothing`: this already prevents an empty-text-node hydration problem. Never copy slotted text into an ARIA string or rebuild consumer markup with `innerHTML`. Existing native distribution handles replacement, removal, text mutation and assigned custom-element content.

### Rich-text editor

Update [rich-text-editor/element.ts](/Users/westbrook/Documents/repos/design-system/packages/elements/src/rich-text-editor/element.ts:100):

1. Add the reactive, non-reflecting string property with default `''`, and document the slot and Part in the element metadata.
2. Render the shared description immediately after `.mount`. The description must remain outside both the ProseMirror-owned DOM and the bounded editor scroll area.
3. Use `aria-describedby="description rich-hint"` on the actual live textbox. Keep the existing rich-text and contextual picker instructions in `rich-hint`; description is additional application guidance.
4. Add the same description relationship to the initial readonly SSR textbox. Its current template omits `aria-describedby`, whereas the live backend references `rich-hint`. Make the relationship consistent before and after mounting.
5. Keep `attributesForEditor()` authoritative for backend attributes. Because the target ID is stable, changing description content need not reconfigure ProseMirror at all. Do not add description changes to the update branch that rebuilds node views or notifies editor-state consumers.
6. Ensure reconnect/mount preserves the relationship. Do not change label naming, document serialization, toolbar association, extensions, validation, or form ownership in this work.

The relevant boundaries are the [asynchronous mount](/Users/westbrook/Documents/repos/design-system/packages/elements/src/rich-text-editor/element.ts:331), [backend attributes](/Users/westbrook/Documents/repos/design-system/packages/elements/src/rich-text-editor/element.ts:387), and [initial template](/Users/westbrook/Documents/repos/design-system/packages/elements/src/rich-text-editor/element.ts:487).

### Token editor

Add the same property and shared visible description to [token-editor/element.ts](/Users/westbrook/Documents/repos/design-system/packages/elements/src/token-editor/element.ts:86). Its actual textbox should always reference `description` and additionally reference `editor-hint` while the existing internal suggestion/picker session requires it. An external picker retains its current hint policy.

Keep the description outside `.editor`; changing it must not cause the editor's DOM reconciliation to rewrite content or reset selection. Both editor backends should accept the same description examples, CSS and behavioral test cases. This also makes swapping a textarea for either editor inside a composer straightforward.

### Existing groups and content containers

Replace `MultipleChoice`'s plain description at [multiple-choice.ts](/Users/westbrook/Documents/repos/design-system/packages/elements/src/internal/multiple-choice.ts:282) with the shared template, and expose inherited slot/Part documentation on its public facades. Retain group-level guidance on the group and picker input, distinct from each item's description and errors. Keep links outside choice activation areas; group key handling must not intercept normal help-link interaction.

Update [selection-collection.ts](/Users/westbrook/Documents/repos/design-system/packages/elements/src/selection-collection.ts:14) separately. Keep its existing introductory placement before actions/items, expose the same content API, and associate the guidance with the named owning section. Do not append it to every item's accessible name or status announcement. Preserve item actions, selection state, error behavior and the selected-count live region.

For all five overlay components, keep a stable same-shadow description target and native slot below the header, with the string as fallback. Slot-only content must work even when `description === ''`; the current conditional in [dialog/template.ts](/Users/westbrook/Documents/repos/design-system/packages/elements/src/dialog/template.ts:30) cannot remain the presence test. Their shared `dialogView` already supplies the description, so apply the contract deliberately to dialog, drawer, sheet, media viewer and command palette. The description belongs to the modal dialog, not automatically to its search input or every nested control. Date picker renders a separate nested `en-dialog`; its outer field help remains owned by the field. Verify that an empty modal description adds no spacing there. Keep modal spacing separate from field spacing. Describe the slot as a short supporting summary; structured long-form content belongs in the body. This follows the [WAI-ARIA dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), which advises against flattening complex dialog content into a single accessible description.

For validation summary, add `part="description"` to the existing slot and document that it exposes the slot-owned content region: inherited text styling works, while consumer markup owns its detailed layout. Preserve its current placement, rendering only when issues exist, and current announcement/focus behavior. [API-06](/Users/westbrook/Documents/repos/design-system/plans/api-06-customization.md:49) explicitly retained slot-owned guidance without an extra wrapper; a box wrapper is unnecessary for consistent authoring names. Do not announce the entire summary again as one description.

For choice descriptors, use an explicit assigned-content fact in the internal browser/SSR normalization record rather than `normalizedText || fallback`. The current [selection normalization](/Users/westbrook/Documents/repos/design-system/packages/primitives/src/interactions/selection-children.ts:64) can revive an attribute fallback suppressed by the visible slot. Verify hidden/empty assignments and restoration through parent projection, then make visible and associated descriptions agree. This is an item-metadata compatibility correction, not a new content channel; retain reflected descriptor properties and noninteractive content restrictions.

For [range-slider.ts](/Users/westbrook/Documents/repos/design-system/packages/elements/src/range-slider.ts:117), add the same string/slot/Part contract and shared description beneath the paired controls. Associate that same-shadow target with both slider thumbs and both native exact-value inputs, retaining endpoint labels and existing error rendering/validation behavior. The current range slider has no explicit error association on these controls; record that separately instead of claiming it already conforms to the field error contract. This is the clearest additional control candidate because users already learn the API on `en-slider`; changing from one value to a range should not require different guidance markup. Verify invalid endpoint drafts, clamping and keyboard interaction remain unchanged.

## Breadth without ambiguous ownership

Common authoring names do not mean every element needs a new description or every role should announce it identically.

| Element or concept | Scope and recommendation |
| --- | --- |
| `en-chat-composer` | Put description on its slotted textarea/token/rich editor. Composer `status` remains delivery/validation feedback. Avoid a second description owner across shadow roots. |
| `en-choice-option`, `ChoiceItem.description`, `EditorChoice.description` | Supporting information for one choice, not the whole field. Retain their data meaning. Rich choice content must remain noninteractive where projected into a choice/option; field/group help can contain links. |
| `en-questionnaire` | `Question.description` belongs to the active question. Preserve that scope; a host slot must not silently substitute for per-question descriptions. |
| `en-color-picker`, `en-calendar` | Useful candidates for future group-level guidance. If added, use the same attribute/property, slot and Part; select the actual group/grid as owner and preserve internal format instructions. They are follow-up candidates, not dependencies for the editor delivery. |
| Cards, empty states, toast bodies, tooltips, carousel role descriptions | Preserve body/item/status/ARIA meanings. Do not rename all supporting content or introduce host-field semantics solely for naming uniformity. |

The conformance audit must inspect actual focused targets in composites. In particular, [color-slider.ts](/Users/westbrook/Documents/repos/design-system/packages/elements/src/color-slider.ts:88) uses a nested `en-text-field` exact-value editor; its range inherits the outer description but the nested field does not currently forward it. Verify range and exact entry separately and record the gap explicitly. The description plan does not authorize a new cross-root ARIA-reference mechanism. Resolve such composite association work in a focused follow-up with native/SSR/assistive-technology evidence, rather than claiming parity from the presence of a slot. Include date-picker single/range modes in that audit for the same reason.

## Delivery sequence and acceptance

| Phase | Concrete work | Completion evidence |
| --- | --- | --- |
| 1. Shared contract | Record the authoring rules and component/semantic-target inventory; extract supporting styles without changing existing field output | Existing description suite remains green; metadata checks cover property, attribute, slot and Part |
| 2. Both editors | Add description to rich and token editors, including SSR/live relationships and instruction composition | Shared behavior matrix plus editor-specific state-preservation and SSR checks; side-by-side example with text field and textarea |
| 3. Related controls and existing gaps | Add range-slider support; normalize the three `MultipleChoice` facades, selection collection, five overlay components and summary; reconcile choice descriptor precedence | Focused range/group/modal/summary and browser/SSR projection checks; compatibility notes for changed behavior |
| 4. Documentation and breadth audit | Audit the additional existing adopters, including composite modes; publish one reusable explanation in local docs and link component examples to it | Exact support matrix, generated API/CEM/type/customization checks, known limitations documented, source/examples reviewed |

Implement phases in that order so editor work can be reviewed before unrelated container changes. Phase 4 audits all named adopters; a discovered composite accessibility gap remains visible as follow-up work and is not mislabeled as full conformance. Speculative API additions to calendar/color picker are outside the implementation milestone.

Recommended changes are additive for editor properties/slots/Parts and group/container authoring. Do not rename/remove any current description API, reflect field/editor properties, or add events. Adding a previously unsupported slot can make old unrendered children visible; document that migration effect. Correcting choice projection precedence changes observable behavior for empty/hidden assignments and needs a release note under the project's existing version policy.

### Verification matrix

Extend [the shared description tests](/Users/westbrook/Documents/repos/design-system/packages/elements/src/forms-private/tests/description-slots.spec.ts:52) and [SSR description tests](/Users/westbrook/Documents/repos/design-system/packages/ssr/tests/browser/description-slots.spec.ts:3), using semantic-target adapters for editors, groups and containers. Existing test coverage is evidence for the baseline, not proof of the proposed work.

| Area | Required cases |
| --- | --- |
| Authoring | Absent, attribute, property, slot-only, both channels, multiple roots, formatting/help link, custom element with shadow content |
| Precedence and updates | Attribute/property changes while slotted; text mutation without slotchange; reassignment/removal; empty/hidden assigned roots; empty → text → empty → text; preserve whitespace policy |
| Accessibility | Unchanged name; correct description on actual textbox/group; built-in instructions retained and not duplicated; error remains independent; help link keyboard use; no new live announcements |
| Editor state | Same live editing node, selection, focus, scroll, accepted document/revision, undo/redo and bookmarks after help changes; rejected draft and active composition retained; no `en-input`, `en-change`, `en-action` or description-only `en-editor-state` events; open suggestions and picker session remain intact |
| SSR/lifecycle | Initial help visible with JavaScript disabled; stable target/relationship; hydration and later fallback restoration, including production minification; readonly/disabled and reconnect; descriptions never serialized into the editor document |
| Layout/style | Empty fallback adds no gap; help stays below/outside editor scrolling; long/localized/RTL text; multiple-root order; small/medium/large; default and inspired themes; forced colors; `::part(description)` does not style suggestion descriptions |
| Integration | Composer/editor swapping, group help links, both range endpoints and exact inputs, all five modal-family slot-only/empty descriptions, summary issue transitions, projected choices, scoped registrations and metadata inheritance |

Use Chromium, Firefox and WebKit for the focused behavior/SSR checks. Include a manual screen-reader pass for field/editor instruction ordering and help-link reading, plus real IME verification for the editor update case; record these separately from automated accessibility assertions. Do not claim manual acceptance from a passing browser tree check.

Update the element JSDoc, shared primitive/form documentation, editor guides, group/modal/summary examples, and generated `custom-elements.json`, public API/type snapshots and customization evidence through the repository's normal generation commands. The main teaching example should show text field, textarea, token editor and rich editor with exactly the same description markup, followed by string-only and slot-override examples. Keep suggestion-item descriptions clearly labeled as item-level content.

Before implementation, reconcile the current dirty editor files and run the existing focused baseline. After each phase, run the affected suites and package builds; after integration, run metadata/type/API/customization checks and relevant docs/SSR/scoped-registry regressions. Broaden verification only when failures or shared changes justify it.

## Planning handoff

The source audit and two independent reviews support extending the existing contract. No runtime changes, generated metadata changes, browser behavior tests or manual assistive-technology results are claimed for this planning task. Existing unresolved project feedback remains open; this plan does not resolve the prior layout/editor interaction reviews.

The next implementation action is phase 1, followed by both editors as one reviewable change. The independent [Progress Report](http://127.0.0.1:4177) records this plan as a separate planning iteration; review acknowledgment and approval remain the user's actions.
