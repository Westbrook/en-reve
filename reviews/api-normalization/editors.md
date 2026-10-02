# Editor, chat, notification and workflow API normalization audit

Read-only source review. No runtime, generated metadata, report, Git or site files were changed. Findings below are recommendations, not implementation changes. Runtime consequences explicitly described as source-inferred have not been browser-reproduced in this audit.

## Coverage and deliberate boundaries

Inspected `en-token-editor`, `en-rich-text-editor`, `en-editor-trigger`, `en-editor-toolbar`, `en-chat-composer`, `en-chat-message`, `en-toast`, `en-toast-region`, `en-progress-steps`, `en-progress-step`, their shared editor/event/chat/descriptor primitives, styling modules, definitions, custom-elements manifest and API guides. Compared `en-toolbar`, `en-navigation`, native form-field adapters and `en-validation-summary` where they establish a relevant precedent.

There is no `form-stepper` component in this checkout. The workflow equivalent is `en-progress-steps` + `en-progress-step`; validation-summary supplies error navigation. Preserve these intentional differences:

- Token and rich documents have distinct versioned schemas and selection coordinates. Opaque bookmarks are already the right common adapter; do not expose ProseMirror offsets as the token editor's logical offsets.
- Rich formatting commands and contextual formatting are rich-editor capabilities. Token editor should not acquire meaningless formatting methods merely for identical class shapes.
- Composer owns send requests, not editing, form association, transport, clearing, attachments or delivery. `sending` intentionally preserves editor availability; chat-message does not own transcript announcements or scrolling. `requestSend()` acceptance is not delivery completion.
- Toast dismissal/step selection correctly use cancelable tentative `en-change`; application commands correctly use `en-action`. Silent author writes remain silent.
- Descriptor metadata intentionally reflects synchronously for browser/SSR discovery (`packages/elements/src/internal/selection-item.ts:4`, `:24`); progress parent value/disabled/readOnly do not reflect (`packages/elements/src/progress-steps/element.ts:38`). Publish reflection explicitly rather than reflecting everything.
- Direct progress descriptors intentionally reject wrappers/forwarded lists; chat/editor and toast slots explicitly support forwarding. Validation-summary's `link` Part is array-mode-only because authored anchors retain light-DOM ownership (`packages/elements/src/validation-summary/element.ts:83`, `apps/docs/src/api-reference/form-navigation.ts:27`). Improve applicability metadata, not ownership.

## 14 grouped discrepancies and preferred contracts

### E1. Focus signature and readiness differ within the editor composition

**Evidence:** `packages/elements/src/editor-toolbar.ts:68` overrides `focus()` with no options, waits for `updateComplete`, and calls the chosen control with no options. Token editor (`packages/elements/src/token-editor/element.ts:105`), composer (`packages/elements/src/chat-composer/element.ts:79`), chat-message (`packages/elements/src/chat-message/element.ts:39`) and toast-region (`packages/elements/src/toast-region/element.ts:78`) accept/forward `FocusOptions`. Rich editor (`packages/elements/src/rich-text-editor/element.ts:214`) forwards options only on its `preventScroll` branch and requires an asynchronously mounted view (`:225`).

**Impact:** A generic focus adapter can call `focus({preventScroll:true})` everywhere except the toolbar's published TS signature; JS calls silently lose the option. Callers cannot infer whether immediate post-connection focus succeeds or is deferred. **Confidence: high** for signature/forwarding; readiness consequences are source-inferred.

**Preferred contract:** All focusable wrappers expose `focus(options?: FocusOptions): void` and forward options. Explicitly document target and pre-render behavior. Keep DOM-compatible synchronous return; readiness should have a separate documented promise/hook if required. **Alternative:** document a common “await ready before focus” contract without adding implicit scheduling. **Migration:** low/additive for options and metadata; medium if changing timing relied on by consumers.

### E2. `value` means draft in one editor and accepted/model text elsewhere

**Evidence:** token `value` reads DOM while composing (`packages/elements/src/token-editor/element.ts:61`), while its `document` remains the model (`:64`) and composition is private (`:52`). Rich `value` always projects state (`packages/elements/src/rich-text-editor/element.ts:80`), separately exposes public `composing` (`:83`), and captures native drafts with `draftText()` for `en-input` (`:242`, `:265`). Native form fields explicitly define `value` as accepted state (`packages/elements/src/forms-private/form-field.ts:82`). Both editors already emit `{value,isComposing,inputType}` via the common draft helper (`packages/primitives/src/interactions/events.ts:120`).

**Impact:** During IME, token `value` and `document` can describe different states, unlike the accepted-value precedent; a generic adapter cannot use the same public composition-state capability for both backends. **Confidence: high** for source definitions; precise timing varies by native editor/backend.

**Preferred contract:** `value` is the plain-text projection of the accepted document for both; draft text lives in `en-input.detail.value` and, if needed, an explicit `draftValue` getter. Expose readonly `composing` consistently for both adapters. **Alternative:** explicitly standardize live draft `value` in both editors, leaving document as accepted state, but that differs from form fields. **Migration:** medium because IME reads change; additive draft/composition APIs and documentation can precede it.

### E3. Rich editor commit lifecycle lacks shared nested-transaction precedence

**Evidence:** token model delegates to `dispatchChange` (`packages/primitives/src/state/token-document.ts:89`), whose transaction frame tracks author revision and accepted nested epochs (`packages/primitives/src/interactions/events.ts:65`, `:88`). Rich editor manually stages `next`, dispatches, checks only `authorVersion`, then restores old or assigns outer `next` (`packages/elements/src/rich-text-editor/element.ts:279`–`:293`). Nested command commits advance `version`, not `authorVersion` (`:290`); author document writes do advance `authorVersion` (`:75`).

**Impact:** Source-inferred: an `en-change` listener that accepts a nested rich-editor command can have that accepted state overwritten by the outer acceptance or rollback, while the token model preserves accepted nested transactions. This violates a common public lifecycle despite matching event names and payload keys. **Confidence: high** from control flow; no runtime reproduction performed.

**Preferred contract:** Both editors obey the shared tentative-read, veto, authoritative-write and accepted-nested-change rules. Use shared transaction coordination or an equivalent backend adapter; document unchanged/superseded outcomes separately from cancellation. **Alternative:** explicitly prohibit reentrant commands during dispatch, with deterministic rejection, but that is less composable than the established primitive. **Migration:** medium implementation work, low expected consumer migration; behavior correction may affect listeners relying on accidental overwrites.

### E4. Shared `EditorPickerSession` has backend-dependent lifecycle behavior

**Evidence:** session shape is explicitly shared (`packages/elements/src/editor/extensions.ts:8`). Token `openPicker` closes/aborts on callback throw (`packages/elements/src/token-editor/element.ts:231`–`:237`); rich handoff calls the callback without cleanup (`packages/elements/src/rich-text-editor/element.ts:317`), though rich initial `open` does clean up (`:313`). After an `en-action` listener runs, token `complete` rechecks only revision (`packages/elements/src/token-editor/element.ts:239`), while rich reruns session identity/abort/editability validity (`packages/elements/src/rich-text-editor/element.ts:316`, `:336`). Token cancellation returns focus to an edited token button when available (`packages/elements/src/token-editor/element.ts:273`); rich cancellation always focuses editor (`packages/elements/src/rich-text-editor/element.ts:317`).

**Impact:** A single extension can retain a stale external session after an exception only in rich mode, or still insert after its registration is removed by an action listener only in token mode. Cancellation focus differs for the same occurrence-editing operation. **Confidence: high**, with consequences source-inferred.

**Preferred contract:** One documented lifecycle: callback exceptions abort/close before rethrow; revalidate session and editable state after each application callback; cancellation of occurrence editing restores its surviving invoker, otherwise editor selection. **Alternative:** intentionally editor-only focus return, but apply it consistently and publish it. **Migration:** low–medium; shared session orchestration is worthwhile but not required to normalize the public behavior.

### E5. Editor association is only partly capability-based and upgrade-safe

**Evidence:** trigger accepts `EditorExtensionHost`, checks `registerExtension`, and waits for an unknown custom-element definition (`packages/elements/src/editor-trigger/element.ts:13`, `:23`); toolbar property is concrete `EnRichTextEditor`, checks command/bookmark methods, and has no equivalent late-definition wait (`packages/elements/src/editor-toolbar.ts:32`, `:46`). Trigger resolves its wait against the document registry (`packages/elements/src/editor-trigger/element.ts:23`), unlike shared scoped-registry resolution (`packages/elements/src/internal/element-registry.ts:2`) used by ordinary toolbar (`packages/elements/src/toolbar/element.ts:109`). The backend-neutral trigger definition nevertheless imports/registers token editor (`packages/elements/src/define/editor-trigger.ts:2`–`:4`).

**Impact:** Association setup/lazy definition ordering and scoped registries behave differently; a rich-only trigger integration acquires an unrelated token-editor dependency. **Confidence: high** for code/dependency differences; missed late toolbar association is source-inferred.

**Preferred contract:** Shared association resolver: same-tree `for`, explicit `editor` across roots, owning-registry upgrade handling, deterministic unbinding. Define a `RichEditorCommandHost` capability for toolbar rather than a concrete implementation type. A neutral trigger should register only itself. **Alternative:** retain the eager token dependency as a documented convenience entry point, plus a neutral entry point. **Migration:** medium for removing side-effect registration (explicit import may be needed); low/additive for capability typing and upgrade recovery.

### E6. Shared token renderer, Parts and CSS metadata diverge

**Evidence:** token editor always supplies `token-interactive` when renderer options identify an edit extension, disabling the button if unavailable (`packages/elements/src/token-editor/element.ts:131`, `:145`–`:150`). Rich uses a span until the extension is registered, never assigns `token-interactive`, uses `run.label` as fallback and does not catch renderer errors (`packages/elements/src/rich-text-editor/element.ts:204`–`:210`). Token fallback uses `run.text` and catches renderer exceptions (`packages/elements/src/token-editor/element.ts:150`). Rich consumes all `tokenEditorStyles` (`packages/elements/src/rich-text-editor/element.ts:44`), but documents only `--en-editor-max-size` (`:36`), versus token's 11 additional shared token properties (`packages/elements/src/token-editor/element.ts:26`–`:35`; actual consumption `packages/styles/src/token-editor.ts:19`–`:30`).

**Impact:** Identical renderer/options require backend-specific CSS and have different default output/error behavior; API discovery understates rich styling support. **Confidence: high.**

**Preferred contract:** Document a common atomic-token renderer contract: text fallback, safe fallback on renderer failure or consistent explicit throw policy, stable interactive-wrapper semantics, common `token`, `token-interactive`, `token-content`, and optional type Part. Publish shared CSS hooks through reusable metadata. Preserve rich node-selection behavior outside token activation. **Alternative:** explicitly document wrapper availability as dynamic and use separate availability Part/state; still add identical canonical hooks. **Migration:** low for additive Parts/docs, medium for wrapper and exception-policy changes. Avoid renaming existing Parts.

### E7. `EditorChoice.description` loses accessible association in rich mode

**Evidence:** the shared choice exposes `description` (`packages/elements/src/editor/extensions.ts:5`). Token suggestion gives the description an ID and option `aria-describedby` (`packages/elements/src/token-editor/element.ts:290`); rich renders the description but supplies neither ID nor association (`packages/elements/src/rich-text-editor/element.ts:371`). Both set the accessible option name to `choice.label`.

**Impact:** The same provider's secondary disambiguating text is structurally associated with its option in one backend only. **Confidence: high** for markup difference; exact announcement depends on assistive technology.

**Preferred contract:** Shared suggestion option semantics include `label` as name and optional `description` as description, regardless of renderer/backend. **Alternative:** intentionally include description in the name consistently, but that changes verbosity and should be explicit. **Migration:** low, additive accessibility metadata; no provider schema change.

### E8. Localization is configurable in chat/toast/workflow but hardcoded in editors

**Evidence:** composer exposes `sendLabel` (`packages/elements/src/chat-composer/element.ts:32`–`:37`); toast-region exposes history/waiting/recent labels (`packages/elements/src/toast-region/element.ts:26`); progress exposes status/count label properties (`packages/elements/src/progress-steps/element.ts:38`). Toolbar hardcodes command names, link prompt, apply/cancel and invalid-link message (`packages/elements/src/editor-toolbar.ts:75`, `:89`–`:92`); token/rich editors hardcode hints/loading/error/no-match strings (`packages/elements/src/token-editor/element.ts:290`, `packages/elements/src/rich-text-editor/element.ts:371`).

**Impact:** A localized application can translate the composer and workflow shell but not the default editor controls without replacing substantial UI. **Confidence: high.**

**Preferred contract:** A shared typed editor `messages` object for multi-string internal UI, plus established simple `label`/`*-label` attributes for single values. Supply sensible defaults; include keyboard instructions, status, command names and validation messages. **Alternative:** individual kebab-case attributes for every string mirrors existing components but scales poorly. **Migration:** low/additive. A custom toolbar slot remains supported, not required for localization.

### E9. Event/method type metadata and editor reason vocabulary are uneven

**Evidence:** composer uses a typed `@fires CustomEvent<ActionDetail<'send',ChatEditorSnapshot>>` (`packages/elements/src/chat-composer/element.ts:29`), progress uses `ChangeEvent<string>` (`packages/elements/src/progress-steps/element.ts:35`), while editor annotations are untyped (`packages/elements/src/token-editor/element.ts:36`–`:38`, `packages/elements/src/rich-text-editor/element.ts:37`–`:40`). Token `undo`, `redo`, registration disposers and `openExtension` lack explicit returns (`packages/elements/src/token-editor/element.ts:73`, `:76`, `:83`, `:90`); the manifest omits their return information (`packages/elements/custom-elements.json:56219`, `:56227`, `:56316`). Token model reasons are only edit/undo/redo (`packages/primitives/src/state/token-document.ts:68`, `:89`); rich emits input/extension/paste/cut/command names (`packages/elements/src/rich-text-editor/element.ts:112`, `:154`, `:252`, `:263`, `:287`). `en-toolbar-request` is cancelable but intentionally direct-host-only (no bubbles/composed), unlike public bubbling events (`:349`; shared helper `packages/primitives/src/interactions/events.ts:41`).

**Impact:** Generated reference is less useful for newer editor APIs; consumers cannot rely on a common reason taxonomy for the same edit intent. A toolbar association signal is discoverable in the manifest without a clear public/private explanation. **Confidence: high.**

**Preferred contract:** Explicit public return types, exported typed editor event aliases, documented cancelability/bubbling/composed/phase, and a small common edit-reason vocabulary with optional command detail. Explicitly classify the direct-host toolbar request as association protocol or public extension point; preserve direct delivery if intentional. **Alternative:** preserve backend-specific reason strings and publish exact unions so consumers can branch safely. **Migration:** low for types/docs; medium/breaking for reason renames, so aliases/versioning may be appropriate.

### E10. Structured action data has inconsistent snapshot ownership

**Evidence:** `EditorChoice.data` is JSON-compatible `ChatEditorData` (`packages/elements/src/editor/extensions.ts:5`), but both editor completions pass its live object directly to `dispatchAction` (`packages/elements/src/token-editor/element.ts:239`, `packages/elements/src/rich-text-editor/element.ts:339`), whose freeze is shallow (`packages/primitives/src/interactions/events.ts:116`). Composer detaches/deep-freezes equivalent structured draft content before action dispatch (`packages/elements/src/chat-composer/element.ts:67`; `packages/primitives/src/interactions/chat-editor.ts:35`–`:58`).

**Impact:** Retaining `en-action.detail.data` after dispatch is a stable snapshot for send, but a provider-owned object for extension commands. This may be intentional, but the similarly typed action surface does not communicate ownership. **Confidence: high** for implementation distinction; **medium** that unification is preferable rather than documentation-only.

**Preferred contract:** Public JSON-bearing editor actions carry detached immutable data; document action payload ownership centrally. **Alternative:** preserve reference semantics for extension actions and clearly mark them as borrowed provider data; application must clone before async use. **Migration:** low–medium; identity-sensitive consumers would need adjustment. Do not deep-clone arbitrary non-JSON event data across the whole library.

### N1. Array and descriptor progress authoring have different invalid-data policies

**Evidence:** progress arrays filter empty and later duplicate values (`packages/elements/src/progress-steps/element.ts:71`–`:74`); descriptor normalization throws for empty/duplicate values and invalid statuses (`packages/primitives/src/interactions/form-children.ts:51`–`:60`), surfaced as an authoring error rather than permissive array fallback (documented `packages/elements/src/progress-steps/README.md:20`–`:24`).

**Impact:** Moving a workflow from `.items` to declarative descriptors changes whether bad data silently renders a subset or rejects the list. **Confidence: high.**

**Preferred contract:** Same data validity rules and explicit failure behavior for both authoring forms; use common normalization and a defined diagnostic/error state. **Alternative:** preserve permissive arrays for compatibility but publish that as a named policy and offer strict validation to both modes. **Migration:** medium if existing arrays become strict; low for documentation/additive validation. Preserve child precedence, node ownership, hidden handling and SSR identity.

### N2. `notify()` returns a toast before collection operations can see it

**Evidence:** `notify()` returns `EnToast` synchronously but defers insertion until region `updateComplete` and skips insertion if disconnected/epoch changed (`packages/elements/src/toast-region/element.ts:70`–`:74`). `dismissAll()` traverses only currently slotted toasts (`:68`, `:77`).

**Impact:** Source-inferred: `region.notify(...); region.dismissAll()` may leave the new toast open; the comment “returns its live element” does not explain created-versus-attached state. **Confidence: high.**

**Preferred contract:** Preserve the immediately usable element return but define pending notifications as part of collection commands, or expose explicit readiness/outcome before sequencing commands. Document pre-connection behavior and insertion cancellation. **Alternative:** return a typed handle `{toast, ready}` or add `notifyAsync`, rather than silently making the existing return a Promise. **Migration:** low for docs/additive readiness; medium for pending-collection semantics; changing return type is breaking.

### N3. Compact disclosure state/events vary across navigation surfaces

**Evidence:** ordinary navigation exposes `open`, `collapse-at`, and noncancelable post-change `en-toggle {open}` (`packages/elements/src/navigation/element.ts:31`–`:38`, `:124`–`:136`). Progress has private native details state and internal close logic (`packages/elements/src/progress-steps/element.ts:83`–`:92`), with fixed 30rem container breakpoint (`packages/styles/src/form-navigation.ts:15`).

**Impact:** Application-controlled compact layouts cannot use the same optional disclosure adapter for both navigation families. **Confidence: high** for API difference; policy choice rather than definite defect.

**Preferred contract:** Define an optional disclosure facet with named open state, post-change notification, and documented breakpoint scope. Make progress participation additive if application control is intended. **Alternative:** explicitly declare progress disclosure internal/uncontrolled, so a common adapter only targets components promising that capability. **Migration:** low–medium/additive. Preserve container versus viewport measurement and native SSR disclosure behavior; do not normalize every responsive component to viewport media queries.

### N4. Equivalent outer surfaces/disclosure controls use different Part names

**Evidence:** navigation names outer/control Parts `base`/`toggle` (`packages/elements/src/navigation/element.ts:15`–`:17`); progress uses `navigation`/`summary` (`packages/elements/src/progress-steps/element.ts:23`–`:25`); toast-region uses `region` (`packages/elements/src/toast-region/element.ts:13`); chat surfaces use `base` (`packages/elements/src/chat-composer/element.ts:17`, `packages/elements/src/chat-message/element.ts:15`).

**Impact:** Cross-component skinning needs component-specific selectors for equivalent surfaces. Different semantic tag names do not require different canonical Part names. **Confidence: high** for discrepancy; canonical choice is a design decision.

**Preferred contract:** Common additive `base` and `toggle` aliases where those roles apply, while preserving descriptive `region`, `navigation`, `summary` names and more specific subparts. Document generated-host versus nested-control Parts and exported parts consistently. **Alternative:** keep semantic names but publish a surface-role mapping in API metadata. **Migration:** low with multi-token Part aliases; direct renames would break CSS.

## Recommended ordering

Prioritize E3/E4/N2 lifecycle correctness and E1/E7 accessibility/integration parity. Then E5/E6 shared editor capability/rendering contracts. Publish E9 metadata, reflection/authoring-mode ownership and E8 localization before widening the API further. E2/E10/N1/N3/N4 require explicit policy choices; record those choices before implementation rather than homogenizing intentional differences.
