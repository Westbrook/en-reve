# Consistent description content: implementation receipt

Implemented 23 September 2026 in the current working tree, following `plans/description-content-api.md`. Runtime changes, generated contracts, shared documentation and automated verification are complete. The manual checklist subsequently passed on 25 September 2026 through user-reported Safari/VoiceOver and Japanese IME checks; the tested scope is recorded below. Existing unrelated working-tree changes were preserved. This initial receipt predates publication. The implementation was subsequently committed to main and published as version 227; see [publication and closeout](description-content-publication.md).

## One authoring contract

Text fields, textareas, rich-text editors and token editors now accept the same three API names: `description` for a string attribute/property, `slot="description"` for authored supporting content, and `::part(description)` for styling.

```html
<en-rich-text-editor label="Project brief"
  description="Explain the goal and intended audience.">
</en-rich-text-editor>

<en-rich-text-editor label="Project brief"
  description="Explain the goal and intended audience.">
  <span slot="description">
    Explain the <strong>goal</strong> and intended audience.
    <a href="/writing-guide">Writing guide</a>
  </span>
</en-rich-text-editor>
```

Replace the tag with `en-text-field`, `en-textarea` or `en-token-editor` without changing the description markup. Assigned content replaces the string fallback, including empty or hidden assigned elements. Removing that content restores the latest string. Whitespace-only strings retain the established behavior. New field/editor properties default to an empty string and do not reflect property writes back into attributes.

The existing primitive template remains authoritative. Its stable description target survives empty content and hydration; its empty fallback creates no trailing gap. Shared supporting-text styles now serve fields and both editors, with a token fallback for consumers outside a field wrapper. Guidance stays outside the editor document and scrolling region. Editor instructions, labels and suggestion-item descriptions retain their separate roles.

## Delivered scope and ownership

| Components | Change and semantic target |
| --- | --- |
| `en-rich-text-editor`, `en-token-editor` | New description attribute/property, slot and Part. Actual textbox receives guidance alongside existing interaction hints; rich-text SSR placeholder has the same association. |
| `en-range-slider` | New common contract; both thumbs and both native exact-value inputs reference the description. |
| `en-checkbox-group`, `en-toggle-group`, `en-multiselect` | Existing string fallback uses the common slot/Part template. Group/picker semantics remain unchanged; help links keep normal keyboard activation. |
| `en-selection-collection` | Common slot/Part with description associated with the owning section, retaining its introduction-before-actions placement. |
| `en-dialog`, `en-drawer`, `en-sheet`, `en-media-viewer`, `en-command-palette` | Stable modal description target and native named slot, including slot-only summaries. Empty descriptions add no flex gap. |
| `en-validation-summary` | Existing description slot now exposes the description Part; issue-dependent rendering and announcement behavior are unchanged. |
| `en-choice-option` projection | Explicit assigned-content state in browser and SSR normalization prevents empty/hidden descriptions from reviving a suppressed string fallback. Item content stays noninteractive. |
| Existing native-field and choice families | Shared-style compatibility verified with the established fourteen-family suite. |
| `en-combobox`, `en-file-upload`, `en-time-field`, `en-otp-field`, `en-date-picker`, `en-color-slider` | Added to the common hydration/accessible-description matrix; composite boundaries audited separately below. |

Generated CEM, public API/type snapshots and customization evidence expose the property, attribute, slot and Part across all 13 changed public component tags. The descriptor projection correction is additional to those 13. Shared documentation appears beside component API tables and includes identical examples for the four text-entry components. Live examples show standalone rich-editor help and identical rich/token reply help, including the composer-owned editor.

The existing uncommitted rich-editor range-decoration work introduced an eager browser-only `prosemirror-view` import. SSR verification exposed that import accessing the server DOM shim. The view module is again loaded during browser mounting; decoration creation uses that module. Its dedicated range/history regression suite passes.

## Compatibility and release notes

- New named slots can make previously undisplayed children visible. Remove unintended `slot="description"` children when adopting this version.
- Empty/hidden assigned `en-choice-option` descriptions now suppress the attribute fallback consistently in projected browser and SSR output. Removing the assignment restores the fallback.
- Modal `::part(description)` now exposes a stable `display: contents` region. Inherited typography/color customization continues to work; put margins, padding or box decoration on the authored description wrapper. Consumers relying on the former paragraph's default margins or Part box must adjust their styles. Validation summary likewise exposes its existing slot-owned region.
- There are no new aliases, events, public tokens, form owners or editor serialization fields.

## Automated verification

Evidence is stored in `artifacts/description-content/`.

| Check | Result | Evidence |
| --- | --- | --- |
| Builds: styles, primitives, elements, SSR, production docs | Passed | Package build logs; `docs-build-final.log` |
| Metadata/type/API/customization generation | Passed; zero customization failures | `metadata-final.log` |
| Tooling suite including the generated description contract | 69 passed | `tooling-final.log` |
| SSR Node suite including assigned empty/hidden projection | 71 passed | `ssr-node-final.log` |
| Existing field description suite | 15 passed across Chromium, Firefox, WebKit | `forms-final.log` |
| Description matrix, production minification and modal-close SSR regressions | 48 passed across all three engines | `ssr-browser-final.log` |
| Shadow-root help, rejected edits, scroll preservation and whitespace | 6 passed across all three engines | `extended-browser-final.log` |
| Rich-editor range/decoration/history regressions | 6 passed | `ranges.log` |
| Range-slider overlap and RTL regressions | 6 passed | `range-overlap.log` |
| Scoped-registry regressions | 24 passed; 6 capability-based skips | `scoped.log` |
| Existing rich-text documentation journeys | All 48 passed | Rich-text cases in `docs-browser.log` |
| Shared description guide and completed-build no-JavaScript docs | 6 passed | `docs-focused.log` |

The description suites check runtime fallback restoration, empty/hidden assignments, text mutation, all five modal variants, editor DOM identity, accepted state/revision, selection/bookmarks, undo/redo, focus, scroll, canceled edits, synthetic composition state, readonly/disabled state, reconnect, open suggestions, help links, summary transitions, narrow RTL layout, sizes and forced colors. Existing rich-editor journeys also exercise the inspired themes. Local visual inspection confirmed guidance placement on the standalone editor and both composer/reply examples.

The broad API-reference run had nine failures from three stale expectations repeated across engines: it expects one navigation search match although both navigation classes exist, expects missing combobox event types that are documented, and expects the old pagination `navigation` Part instead of `base`. These facts are unchanged between HEAD metadata and the working tree. They were not altered as part of description work. That run also initially read an incomplete docs-build page in Chromium; the completed-build no-JavaScript checks subsequently passed in all three engines. That original broad run was therefore not fully green. The three stale expectations are corrected in the subsequent [closeout](description-content-publication.md#closeout); the historical results above remain unchanged.

Early extended-editor checks sampled an ongoing Chromium native caret-scroll animation before changing any description. The final test waits for a stable native scroll state before recording the baseline and passes without changing product scrolling behavior.

## Retained boundaries and manual checklist

- Color-slider outer guidance describes the range. Its nested exact-value field retains a separate help scope.
- Date-picker single-date help describes its native input. Range mode forwards the description element to the native trigger button; the modal endpoint inputs retain their own instruction scope.
- Range-slider still has its pre-existing lack of an explicit error association on the four controls. This task adds description associations, not a new error contract.
- Group help belongs to the group; modal summaries belong to the modal, not every nested field. Long structured modal content belongs in the body. Composer guidance belongs on its editor. No speculative API was added to calendars, color pickers, panels or generic content containers.
- The manual checklist covers field/textarea/editor names, descriptions and built-in instruction order; reading and activating a help link; and changing string and slotted help during native composition in both editors, followed by commit/cancel and draft, caret and history checks. The user-reported results below establish this manual coverage for the tested setup; browser accessibility assertions and synthetic composition events alone do not.

## Manual results — 25 September 2026

The user performed the guided checks in Safari with VoiceOver on macOS and a native Japanese input source, against the published documentation. These are user-reported observations, not automated or synthetic IME results.

| Check | Observed result |
| --- | --- |
| Name, description and editing-role announcements | Passed for Project brief editor, Rich reply, Token editor comparison, Project name and Creative direction. Rich-editor guidance preceded its built-in Enter/Alt+F10 instructions. |
| Authored description help link | “Review this field” was announced as a link and activation moved focus to the “What feels right…” section on the full documentation page. |
| Rich editor: string and slotted description updates | Native Japanese composition remained active through each guidance update. Confirming inserted `日本` once with the caret afterward; one Command–Z restored the previous draft. Separate cancellation checks preserved the original draft and caret. |
| Token editor: string and slotted description updates | The same composition, commit, caret, Undo and cancellation checks passed for both description forms. |
| Updated guidance retrieval | Updated help was available through VoiceOver’s Control–Option–Command–/ additional-content command. The user also reported a hint that more content was available; the changed guidance was not read aloud automatically in full. |

The help-link test used the full documentation page at `/#fields`, because the isolated text-field example does not contain its `#review-notes` destination. Editor mutation checks used temporary console helpers that changed guidance after native composition began; the user typed, converted, committed, canceled and undid the actual Japanese input. Reloading restores the demo’s original guidance.

All cases in this guided description checklist passed. Exact Safari/macOS versions, Japanese typing method and Live Conversion setting were not recorded. Other browser, screen-reader and IME combinations were not manually tested. These results do not establish acceptance for the separate [composite accessibility follow-up](composite-accessibility.md). Individual observations are retained in the independent Progress Report’s `descriptionManualReview` handoff.

## Review and continuation

[Live editor examples](http://127.0.0.1:4480/api-examples/rich-text.html?progress-report) · [Shared description guide](http://127.0.0.1:4480/api-reference?component=en-rich-text-editor&progress-report#api-description-guide) · [Progress Report](http://127.0.0.1:4177)

The local docs preview serves the completed `dist` using `EN_WORKFLOW_TEST_PORT=4480 node apps/docs/tests/static-server.mjs`. Restart that command if the local preview stops. The independent report remains on port 4177. No cases remain in the guided Safari/VoiceOver and Japanese IME description checklist. The subsequent closeout addresses the stale API-reference expectations; the manual results above are recorded separately from automated verification and broader product approval.
