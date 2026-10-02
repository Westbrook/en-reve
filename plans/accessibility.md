# Accessibility architecture and acceptance plan

Status: standing acceptance architecture, reconciled with the implemented review library at source `0d0b4265701b9102d1530bee63330ce879de327d` and canonical progress revision 122. Discovery decisions through `d24` remain the baseline. Focused browser, accessibility-tree, axe and rendered-image evidence now exists; manual acceptance of the reference workflows, assistive-technology review and the full support matrix remain unfinished. This is not a conformance assessment. This document owns the acceptance contracts; [the review record](./accessibility-review.md) separates delivered behavior, versioned evidence and remaining work. The runtime, token, experience and verification plans own their implementations.

## Accepted scope

- Use WCAG 2.2 AA as the baseline: applicable component criteria plus browser and assistive-technology evaluation of complete SSO-centric forms, design settings, and chat-triggered control workflows.
- Support the broad rolling current-minus-one browser/framework policy and the agreed phone, tablet, laptop, desktop, orientation, and connectivity coverage. Start assistive-technology work with screen readers and platform preferences, and identify decisions affecting other environments. Webviews have lower priority, not an implicit exclusion.
- Require JavaScript in the initial version; applications own loading/failure fallback and connectivity policies. Preserve the SSR target and coherent behavior during upgrade/hydration. Do not add a library-owned no-JavaScript experience.
- Favor Shadow DOM. Delivered internal markup is private; slots, documented CSS Parts, custom properties, and supported imports provide customization. Private markup does not mean a closed shadow root.
- Allow application ownership of public component state and cancellation of relevant proposed actions. Preserve native editing and interaction capabilities while doing so.
- Provide the 19 accepted message catalogs and RTL support. Library maintainers review official defaults/named themes; consuming teams review their customizations. Managed token editing guides decisions without guaranteeing accessibility.
- Build breadth before stabilizing APIs. Record unimplemented or unverified outcomes visibly rather than claiming complete accessibility from pattern count.

WCAG conformance concerns complete pages and processes, not an isolated custom-element definition. Component evidence must describe what was checked and the conditions under which it works. A consuming application still owns its content, composition, workflow, and integrations. [WCAG conformance requirements](https://www.w3.org/TR/WCAG22/#conformance-reqs)

## One contract per pattern, reused across delivery layers

Each pattern record should carry the following authored accessibility fields next to its machine-readable API information. A CEM can link to these records; it cannot infer all behavioral requirements from source declarations.

| Contract field | Required information |
| --- | --- |
| User outcome | What a user can accomplish, including correction, dismissal, and recovery where relevant. |
| Semantic owner | The native element or custom host exposing the role, name, state, and value; any collection/group relationship. |
| Naming and descriptions | Supported visible label, additional description, error, and rich-content paths; precedence and consumer responsibilities. |
| Interaction | Pointer, touch, keyboard, editing, selection, focus entry/exit, and optional shortcuts. |
| Public state | Authoritative inputs, transient draft state, allowed transitions, cancelable actions, and outcome notifications. |
| Composition | Slot content restrictions, reading order, label ownership, permitted nested interactions, and dynamic slot changes. |
| Styling dependencies | Tokens and Parts affecting legibility, targets, focus, contrast, motion, overflow, and responsive layout. |
| Locale and direction | Translated strings, formatting input, language metadata, direction behavior, and local overrides. |
| Evidence | Fixture/scenario IDs, relevant criteria, verified environments, results, limitations, and review links. |

Reuse these contracts through separate layers: pure state transitions, native DOM adapters, focus/selection behavior, templates, token-driven styles, and test scenarios. A shared helper change selects consumers of that helper for validation. It does not require every unrelated component to be rechecked.

## Semantic ownership and Shadow DOM

1. Prefer native interactive elements inside components when they provide the intended operation. A native button owns button activation; a native input owns text editing. A host and its inner control must not produce duplicate interactive roles, tab stops, names, or announcements for one operation.
2. Use native semantic recipes where wrapping would weaken structure: headings, lists, quotes, fieldsets, table structures, and document landmarks. A pattern need not be a new tag. Keep structural relationships in a coherent DOM tree and demonstrate the recipe in the library.
3. Document intentional focus delegation. Calling the public focus method should focus the meaningful control, with the promised focus options. `delegatesFocus` alone does not establish naming, keyboard behavior, or form participation.
4. An open root can retain private implementation markup. Consumer examples/tests use public roles, names, state, events, slots, and Parts rather than internal selectors. Keep narrow structural inspections inside library tests where they diagnose semantic ownership or platform behavior.
5. Expose only deliberate Parts. A Part grants a styling surface, not permission to mutate private DOM or replace behavior. Document styles that affect accessible use and the consuming team's review responsibility.
6. Treat overlays, teleported content, scoped review registries, and nested roots as composition cases. Rendered proximity does not prove a semantic relationship. Verify labels, active descendants, reading order, and focus in the actual rendered structure.
7. Keep hidden, inert, disabled, and readonly behavior distinct. Do not hide a focusable control from assistive technology while leaving it keyboard-operable. An `aria-disabled` state does not by itself prevent activation; implement the documented interaction behavior as well as exposing the state.

WAI-ARIA patterns are implementation guidance, not proof of accessible behavior. A role brings corresponding interaction responsibilities; adding ARIA alone does not supply them. [WAI APG guidance](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)

### Slots are public composition contracts

For each named/default slot, specify whether it accepts plain phrasing, arbitrary flow content, a control, or collection items. Document required consumer labels and whether interactive descendants are allowed. An action slot inside a button cannot contain another button or link. A heading slot must not force a fixed heading level into every application's hierarchy.

Recompute relevant descriptions, ownership, and navigation when slotted content is added, removed, translated, disabled, or reordered. Do not infer semantic text solely by copying `textContent`: it can discard language, useful markup, and the intended accessible name. Decorative icon slots must not add filename-like or duplicate labels; informative icons require an appropriate text alternative.

Slotting changes rendered composition without moving assigned nodes into the slot's DOM tree. A visually adjacent label and input can still have an invalid cross-root reference. Test the supported composition instead of assuming slot placement fixes it.

### Labels, form association, and Reference Target

Maintain separate adapters and capability fixtures for these distinct obligations:

| Obligation | Demonstrate in a real browser |
| --- | --- |
| Accessible name | Visible label names the actual focusable control; icon-only actions have a name; name does not duplicate container text. |
| Label activation | Clicking/tapping the supported external or internal label focuses/activates the correct control once. |
| Description/error | Hint and error relationships reach the control, change correctly, and remain distinguishable from its name. |
| Native editing | Type, paste, autofill, select, compose, undo, and use platform editing commands without accidental submission or lost text. |
| Form participation | Correct `FormData` entries, reset behavior, disabled/readonly distinction, validation, associated form ownership, and expected submitter behavior. |
| Group semantics | Fieldset/legend or equivalent grouping remains intelligible, including required and invalid states. |
| Cross-root relationships | Test each supported relation and nesting direction independently, including dynamic changes and SSR hydration. |

Choose either a coherent native semantic owner plus a host form adapter, or a host-owned custom interaction with the necessary semantics. Do not assume `ElementInternals` automatically gives an inner input the host's label or form association. Use `setFormValue`, validity, reset, disabled, and restoration behavior intentionally when a form-associated custom element is needed. Test actual browser submission and reset rather than only inspecting stored properties. [ElementInternals documentation](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)

Implemented encapsulated form controls use a native editable semantic owner, same-tree label/description and a form-associated host for submission. Named label slots keep their attribute fallback in that semantic relationship. The common field and checkbox/radio/switch adapters now progressively associate external labels through confirmed native forwarding or a shared reflected-label bridge; that is separate from slot delivery. A native light-DOM label/control composition remains a candidate for SSO/autofill-sensitive cases. The proposed `en-field` composition is not yet a delivered element; it must not duplicate native form submission if introduced. The [Reference Target comparison](../probes/reference-target/README.md) records the production bridge and its pinned-engine evidence; actual AT/device parity remains separate.

The delivered external-trigger contract is narrower: `en-popover`, `en-tooltip` and `en-color-field` resolve a literal `for` ID only within their own Document or ShadowRoot. This is an activation relationship, not HTML label forwarding or a form-field `name`. Supported trigger types, lifecycle cleanup, accessible-name/description forwarding and loss of an active anchor are specified in [the review record](./accessibility-review.md#external-triggers-and-relationships). The verified tooltip element-reference bridge does not establish arbitrary Reference Target support.

Reference Target is a candidate for supported cross-root references. The proposal does not provide general forwarding of `role`/`aria-label` from host to inner element and does not automatically associate an enclosed native input with the outer form. Keep these separate from reference forwarding. [Reference Target explainer](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/reference-target-explainer.md)

The [initial native/polyfill comparison](../probes/reference-target/README.md#additional-aria-relationship-comparison-2026-10-02) now covers external labels, descriptions/errors, nested targets, target changes/removal, active-descendant relationships, and hydration ordering in the pinned engines. It records the native error-reference gap and the fallback's unsupported relations rather than promising parity. Production controls retain their documented same/ancestor-root description and local option relationships. Real OS/AT combinations and rolling-release/device support remain unqualified; feature detection establishes availability, not interoperability.

If a required combination fails, first choose a supported composition: colocated semantic label/control, documented explicit naming, or a slotted native control where appropriate. A slotted-control alternative must also preserve form behavior and the promised customization surface. This is a compatibility design decision within the existing Shadow DOM preference; do not silently advertise an unsupported relationship or add fake hidden duplicate inputs/controls as a blanket fix.

## Application-owned state without breaking native interaction

Distinguish these states in the component contract:

- **Accepted state:** the settled value, selection or open state.
- **Tentative public state:** the proposed property, Signals and FormData exposed coherently during cancelable `en-change`; later cancellation can restore still-owned state.
- **Transient interaction state:** focus bookkeeping, pointer capture, native text composition, caret/selection, and an explicitly documented editing draft where the pattern needs one.
- **Application outcome:** an operation is pending, accepted, rejected, or failed according to application input. A proposed UI change is not evidence that data was saved remotely.

For discrete actions such as checking an option or opening a disclosure, stage the semantic state before the single cancelable `en-change`, and defer destructive draft/group/focus/native overlay finalization until acceptance settles. Synchronous cancellation restores still-owned staging. Explicit application writes, including equality, and accepted nested changes take authority; a canceled nested attempt alone does not. Application writes update the appropriate native/ARIA state without echoing a user event.

Do not apply cancellation indiscriminately to focus navigation or every native editing event. Some `beforeinput` cases are absent or not cancelable, including cases involving IME, autofill, and platform editing. Preventing and replaying keystrokes is not a reliable controlled-input architecture. [Native beforeinput behavior](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event)

For editable controls, define exactly when a local draft exists, how the accepted value differs from it, what the form submits, and what happens on acceptance, rejection, reset, disabling, and an external replacement. Keep draft lifetime bounded by the interaction; do not retain orphan drafts after reset/unmount. Preserve active composition until an explicit reconciliation point. Do not display a draft while silently claiming a different value was committed or saved.

| Transition | Required observable result |
| --- | --- |
| Change accepted immediately | One cancelable `en-change` attempt settles and finalizes; no second committed event; focus remains suitable for continued work. |
| Discrete change canceled | Still-owned staged state rolls back unless an application write or accepted nested change superseded it; necessary activation focus is not forcibly undone. |
| Application delays decision | Honest pending state if supplied; no fabricated success, repeated action, or focus theft. |
| Application supplies accepted state | Actual native/ARIA value updates; no event feedback loop. |
| Application rejects an edit | Clear recoverable feedback; preserve a documented editable draft or reconcile at the documented boundary. |
| Remote update during typing | Follow the explicit draft/reconciliation contract; no lost composition or unexplained caret jump. |
| Focused item removed | Move to a predictable surviving target only when needed, with enough context to understand the change. |
| Reset/reconnect/disposal | Clean interaction state and listeners; no delayed announcement or stale commit from a disposed instance. |

The adopted [event contract](./architecture.md#cancelable-state-changes-and-application-authority) removes `controlled` and `en-request-change`. One synchronous cancelable `en-change` exposes tentative coherent property/Signals/FormData, with readonly `{ previous, proposed, reason }` detail. `en-input` still observes the native editing draft. Cancellation cannot undo native keystrokes, IME or arbitrary effects in application listeners; preserve the documented draft until accepted reconciliation or an authoritative write. Async consumers cancel before yielding and guard stale completions.

The migration is implemented, with scoped component/core/SSR passes at the [current checkpoint](./review-session.md#current-event-api-migration-checkpoint); production documentation verification passed with 178 cases and two retained skips. Historical controlled-mode tests do not verify this contract. Native form reset restores its baseline unless the application cancels the outer form’s native reset event. Restoration and automatic initialization defaults are authoritative and silent, independent of disabled/read-only user guards. Existing field hydration native-edit adoption remains unchanged. Ordinary overlay actions cancel before effects; unexpected native close/hide that already completed reconciles silently. Retain early listener timing, equal-write authority, nested rollback and draft/focus checks. The earlier structure-family supersession receipt remains scoped evidence. [Current review-session findings](./review-session.md#earlier-shared-audit-findings)

## Focus, dynamic content, and loading

- Move focus intentionally for user-invoked context changes: dialog opening, form-step transitions, and recovery after removal of the focused control. Document entry, containment where modal, and exit/return behavior. Do not move it merely because another person changed a setting or a message arrived.
- Keep focus order and reading order understandable at every responsive size and direction. Avoid positive tabindex. Composite navigation must allow entry and exit and retain the distinction between focus and selection.
- Verify the entire focus indicator in its rendered context, including adjacent stacking, scrolling and enlarged text. Delivered overlay scrollports reserve token-derived outline clearance; focused accordion items and split handles rise within local stacking contexts. These fixes preserve body/pane scrolling and do not justify global z-index escalation or removing overflow indiscriminately. Shape-sensitive control rings and the compound-number focus contract are recorded in [the review record](./accessibility-review.md#focus-shape-and-complete-outlines).
- Use one deliberate announcement path for each outcome. Ordinary status regions should exist before their contents change. Do not make the whole application or constantly changing transcript an assertive region. Reserve interruptive alerts for genuinely urgent outcomes; verify announcements on actual screen readers. [TetraLogical live-region guidance](https://tetralogical.com/blog/2024/05/01/why-are-my-live-regions-not-working/)
- Provide persistent, navigable content for information users may need again. Announcements are supplementary and cannot be the only durable record of errors, collaborator changes, or available actions. Combine/deduplicate high-frequency updates without withholding a meaningful result. [WAI status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- Keep generated chat controls within known component contracts. New labels, values, and concepts do not justify invented keyboard behavior or unverified ARIA roles. The integration owns the truth of those labels and outcomes.
- Preserve focused/edited controls through SSR hydration; avoid replacing an active field merely to reconcile initial markup. Distinguish initial HTML from restored reactive interaction. Evaluate late component/polyfill loading and ordering without promising complete custom operation before JavaScript. [Lit SSR client guidance](https://lit.dev/docs/ssr/client-usage/)
- Coordinate library readiness with the application so apparently usable controls are not silently inert. The application still owns loading/failure fallback. The component's responsibility is a truthful interface and predictable lifecycle, including no stuck hidden content caused by its own bootstrap.
- Lazy rendering and virtualization must preserve navigable structure, focused items, current edits, and a way to reach relevant items. Establish each virtualized pattern's semantics and access strategy before adopting that optimization. A fast incomplete accessibility tree is not a successful result.

## Pattern-family acceptance map

The [pattern inventory](./pattern-inventory.json) is the authoritative coverage list. Its stable pattern IDs should link to the relevant family checks and workflow steps below. These families define reusable checks, not a second count or a requirement to invent one tag per pattern. Specialized browser/APG guidance should be attached when each pattern is specified.

| Family and examples | Core evidence |
| --- | --- |
| Document structure: headings, text, lists, quotes, landmarks, dividers | Native structure, useful heading hierarchy, reading order, language, zoom/spacing tolerance; decorative separators not needlessly announced. |
| Actions/navigation: buttons, links, breadcrumbs, pagination, navigation | Correct action-versus-navigation semantics; native activation; visible names and focus; current location and disabled behavior; browser link affordances preserved. |
| Forms: field, input, textarea, password, validation, group, multistep form | Label/name/description, input purpose, paste/autofill, composition, reset/submission, error identification/recovery, progress and return context. |
| Choice: checkbox, radio, switch, segmented choices | Checked/mixed/selected distinctions, group names, native keyboard expectations, tentative-state acceptance and owned rollback. |
| Numeric/visual values: number input, slider, range, color controls | Exact value and units available to nonvisual users; keyboard operation; alternatives to dragging; value text where raw numbers are insufficient; touch-AT tests for custom sliders. |
| Collections: select, listbox, combobox, autocomplete, command menu | Named popup and options, active versus selected item, typing/filtering, empty/loading state, Escape, focus return, valid active-descendant or roving-focus relationships. |
| Disclosure: accordion, details, tabs | Named trigger/panel relationships, expanded/selected state, hidden panels out of navigation, expected keys and focus continuity. |
| Overlays: dialog, drawer, popover, menu, tooltip | Correct modal/nonmodal distinction, naming, dismissal, focus behavior, background interaction, hover/focus/touch access; interactive content not disguised as a tooltip. |
| Feedback: alert, status, toast, progress, skeleton, empty state | Meaningful busy/progress/completion/error information, persistent recovery actions, bounded announcements, no color-only state, reduced-motion operation. |
| Data: table, sortable table, grid, tree, treegrid | Native table for tabular reading; introduce grid interaction only when needed; headers/levels/expanded state, selected versus focused rows, keyboard reachability, sort announcements, coherent virtualization. |
| Date/time: calendar, date picker, time picker | Understandable localized value, direct entry where provided, date availability, month/year changes, grid navigation where used, focus/selection distinction and error recovery. |
| Editing: toolbar, rich text, editor commands | Editable region label; selection and composition; paste and undo; toolbar state and return to editing; shortcut discoverability; actual content semantics. Toolbar coverage alone does not establish editor coverage. |
| Direct manipulation: drag/drop, resize, splitter, reorder, upload | Keyboard plus single-pointer non-drag alternatives; cancel/recover; position/size meaning; real file-picker operation and progress/error feedback. |
| Media/content: avatar, image, card, carousel, video/audio, badge | Useful alternatives and labels, nested-action safety, media controls/captions where applicable, pause/stop behavior, current item/status without announcement floods. |
| Collaboration: chat, contextual action, comments, presence, history | Author/context identification, local/remote distinction, navigable history, discoverable newly available controls, focus/edit preservation, honest pending/rejected/stale state. |

For dragging interactions, keyboard support and a single-pointer alternative address distinct needs. A keyboard alternative alone does not satisfy the non-drag pointer requirement. [WAI dragging guidance](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)

## Token, theme, and responsive acceptance

Maintain a map of actual foreground/background and indicator/surface pairs by component state. Derivation from a base accent is useful but cannot replace checking the resulting pairs, overlays, opacity, and surrounding content. Check official default and named themes through rendered states and the integrated workflows. Custom-theme reviews use the same evidence surfaces with consuming-team ownership.

The token admin should reveal affected pairs and affected patterns when a value changes. Separate schema validity, calculated checks, visual evidence, and human review. Managed options may make mistakes less likely; they neither approve a proposal nor certify the consuming application. Public code customization remains available beyond admin options.

| Area | Measurable baseline and review |
| --- | --- |
| Text contrast | Check applicable normal text at 4.5:1 and large text at 3:1 against its actual background; record criterion exceptions accurately. Do not round a failing ratio upward. [Contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) |
| Controls/indicators | Check the applicable 3:1 non-text contrast relationships; do not treat every decorative boundary as a required control boundary. [Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) |
| Pointer targets | Evaluate 24 by 24 CSS-pixel minimum or an applicable spacing/other exception in rendered context. Dense tokens cannot be approved through a scalar size check alone. [Target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) |
| Text/layout | Exercise 200% text resize and reflow at the applicable 320 CSS-pixel width/256 CSS-pixel height conditions; contain genuinely two-dimensional content appropriately instead of treating the entire settings UI as exempt. [Reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) |
| User spacing | Test the applicable line, paragraph, letter, and word-spacing overrides without loss of content/function. These are override-tolerance tests, not mandatory default typography values. [Text-spacing guidance](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) |
| Focus | Visible and not wholly obscured by authored overlays/sticky regions; recognizable in every official theme, direction, and density. Avoid clipping the indicator through overflow/radii. |

Include a browser zoom scenario at 400% from a 1280 CSS-pixel-wide starting viewport, alongside direct narrow-viewport and 200% text-resize checks. Verify actual usability and retained content rather than treating a viewport screenshot as proof of browser zoom behavior.

There is no universal WCAG AA minimum font-size token. Choose readable typography through the agreed visual review and actual content; do not label an invented minimum as a WCAG requirement.

The delivered default UI metrics are `1rem / 1.5`; input and strong-label family, size and leading alias UI while their weights remain independently configurable. Small UI/input text retains its base size, medium uses that base and large scales up. Thus the default 16px root yields 16px small/medium and 18px large text; these are design defaults, not fixed pixel requirements or a physical iOS focus-zoom guarantee. Explicit output pins can intentionally diverge. Density and rhythm affect geometry, not font size. Missing/invalid/removed `size` means medium even in a sized parent; `size="inherit"` is the explicit inheritance path.

Comparable single-line controls now share a content/padding/border/target height calculation. The conservative segmented-frame budget retains at least 44px native option block targets on coarse pointers, rather than counting delegated frame padding as proof of that floor. At default medium tokens this gives 40px fine-pointer and 54px coarse-pointer outer heights; a `.5rem` rhythm gives 50px and 62px. Width, wrapping, exceptions and customizations still require rendered checks: the coarse option block floor is not a claim that every target is 44 by 44 or meets AAA. Multiline content grows instead of being forced into a single-line height.

Use the complete theme boundary to rederive dependent aliases after changing primitives; an arbitrary descendant override does not automatically rebase already inherited values. Continue testing custom fonts, independent input overrides, enlarged root text, user spacing and narrow/RTL layouts. Opt-in typography roles style consumer-owned semantic HTML without a global reset or changing heading level. Browser-computed select leading and the open WebKit fixed-host rem finding have measured limits documented in [the review record](./accessibility-review.md#shared-type-size-and-user-preferences).

Honor forced colors and platform color preferences through semantic styles and visible affordances. Keep automatic forced-color adjustment as the default; any narrow exception needs a documented reason and evidence that meaning remains visible. Test borders and focus when shadows/backgrounds change. [Forced-colors behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)

Honor reduced motion per effect: reduce or remove nonessential movement while keeping state, completion, and controls understandable. Do not make functional completion depend on a transition event that disappears at zero duration. The specific WCAG animation-from-interaction criterion is AAA; respecting motion preference here also follows the user's broader platform-preference requirement, not an invented AA criterion. [Animation guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)

Test touch targets, virtual-keyboard obstruction, orientation changes, scroll containment, and overlay positioning on the agreed phone/tablet classes. Check scaling and focus visibility when moving a window between monitors with different display scales. Browser viewport emulation is useful but does not establish those physical-device outcomes.

## Language, direction, and text input

Catalogs: `pt-BR`, `zh-Hans`, `zh-Hant`, `cs`, `da`, `nl`, `en`, `fi`, `fr`, `de`, `it`, `ja`, `ko`, `nb`, `pl`, `ru`, `es`, `sv`, and `tr`. This is the accepted list; do not silently choose countries for language-only catalogs. Application-selected formatting preferences and catalog matching remain distinct.

- Preserve language and direction across application roots, local regions, hosts, slots, overlays, and hydration. Allow explicit local overrides. Language does not set direction automatically. [W3C HTML direction guidance](https://www.w3.org/International/questions/qa-html-dir)
- Translate visible strings and accessible names/descriptions/status strings together. Keep visible action text represented in its accessible name so speech users can operate the control by its label. [Label-in-name guidance](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)
- Preserve markup identifying changes in language. Test what the browser exposes and how AT presents it. Mixed-language accessible names may flatten language metadata in some modes; document the measured limitation rather than promising pronunciation that the platform cannot supply. [Language-of-parts guidance](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html)
- Test real RTL-script user content even though no additional RTL translation catalog was requested. Include mixed-direction names, messages, punctuation, numbers, filenames, and URLs. Use isolation and explicit/automatic direction appropriately rather than reversing strings or relying on mirrored English screenshots. [Bidirectional isolation](https://www.w3.org/International/questions/qa-bidi-unicode-controls)
- Verify editing/selection, IME composition, paste, and keyboard shortcuts with Japanese, Korean, Chinese, Turkish, and other applicable inputs. Do not intercept character keys globally or assume a US keyboard layout.
- Review directional keyboard behavior per pattern; never blanket-reverse all arrow keys. Numeric value editing, text caret movement, visual collection navigation, and document order have different contracts.
- Catalog completeness and rendered overflow checks can cover all 19 catalogs automatically. Language quality and AT pronunciation remain separately recorded human evidence; pseudolocalization does not establish translation quality.

## Three integrated acceptance experiences

The three deterministic journeys are implemented on separate SSR Workflows pages and remain subject to manual acceptance. The retained initial combined-page workflow run records 58 browser passes and two intentional narrow-profile skips, including six scoped initial/validation axe audits with zero violations; eight separate Node cases cover the shared async core. These results belong to their exact tested artifact and do not establish manual screen-reader, physical-device or full support-matrix acceptance. See the [maintained runner and limits](../apps/docs/tests/README.md).

Use the same deterministic, resettable fixtures as UX and performance work, with controlled delays, rejection, collaborator updates, and new messages. Use synthetic accounts/content. Simulated SSO demonstrates the library's flow behavior, not conformance of an untested external identity provider.

### F1 — multistep SSO-centric form

1. Enter through headings/landmarks, find the sign-in form, and identify available methods and the current step.
2. Follow the visible field labels; type, paste, and exercise available autofill/password-manager behavior. For any verification-code example, test whole-code paste.
3. Submit an invalid value, discover the error and correction, and return to the relevant field without losing useful context.
4. Move backward/forward, encounter a delayed response, then a recoverable failure; confirm expected retained state and that repeated activation does not create unexplained duplicate actions.
5. Complete the simulated provider return and reach an understandable completion state with intentional focus placement.
6. Repeat relevant steps with keyboard only, screen reader, narrow/zoomed layout, and another language/direction scenario.

Observe label/description relationships, error reading, input purpose, step orientation, field preservation, busy/result announcements, and normal form semantics. Authentication effort includes paste/autofill support and the complete sequence of steps, not just the first login screen. [Accessible authentication](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)

### F2 — design settings panel

1. Find an ordinary setting and adjust it using the default presentation.
2. Reveal advanced controls, discover their purpose/units, and make a precise adjustment using both a direct value path and another supported method.
3. Cancel or reverse a change where the fixture offers that action; distinguish draft, pending, accepted, and rejected outcomes.
4. Receive a collaborator update while focused and while composing text; finish or reconcile without an unexplained change of editing context.
5. Change theme/density and local direction, then use the same controls at a narrow/zoomed size and with platform preferences.

Observe discoverability, grouping, keyboard efficiency, selection versus focus, exact values, disabled explanations, layout, and the ability to recover. No assumption that every settings change requires an explicit Save button.

### F3 — chat-triggered controls

1. Read prior messages, identify their authors, and begin composing a response.
2. Introduce a message with a contextual control while the user is reading or typing. The new opportunity is discoverable without stealing focus or repeatedly interrupting speech.
3. Navigate to the new control, understand its name/current value, activate it, and distinguish the action proposal from the application's eventual outcome.
4. Reject or supersede an action through a collaborator update; recover and find the current valid action.
5. Remove a focused action through an intentional fixture transition and verify predictable focus recovery; preserve the draft chat message.
6. Revisit the result through persistent history, then try mixed-language/RTL content and a long transcript.

Observe announcement volume, history navigation, stale/pending/error clarity, focus continuity, and whether knowledge of the settings component transfers to its chat presentation. An LLM-provided label or schema receives the same review as human-authored content.

## Repeatable evidence and focused validation

### Automated browser work

Use Playwright for actual navigation, keyboard input, clicking/tapping, selection, form submission/reset, delayed state transitions, and public property updates. Prefer role/name/label locators and observable outcomes. A passing role locator is evidence about that locator's computation, not a substitute for actual screen-reader operation. Shadow-DOM traversal depends on the tooling/root mode; do not claim closed-root inspection that the selected tool cannot perform. [Playwright locators](https://playwright.dev/docs/locators#locate-in-shadow-dom)

Run axe through `@axe-core/playwright` after meaningful reachable states: opened popup, invalid form, changed step, expanded settings, newly introduced chat control. Configure the chosen axe version's supported WCAG 2.2 A/AA tags and retain best-practice findings separately; older example configurations that stop at WCAG 2.1 are insufficient for the accepted target. Attach violations, incomplete/manual-review items, tool version, and state identity. An empty violations array only means that run detected none of its covered problems. [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)

Do not test delivered HTML by regex/string matching. Do not manufacture test-only roles or labels. Avoid blanket scan exclusions and global rule suppression to make early breadth look complete. Known findings can remain linked to precise scenarios, affected versions, rationale, and required next work.

Use visual regression evidence for visual changes, behavioral assertions for operations, and manual AT evidence for actual interaction. None substitutes for the other. Screenshots alone cannot establish reading order, accessible names, live announcements, or keyboard usability.

### Candidate environment matrix

These are proposed starting combinations, not verified results or newly imposed support exclusions. Resolve available devices/tooling during test preparation and record any unavailable combination as unverified.

| Surface | Initial evidence |
| --- | --- |
| Automated desktop engines | Pinned Playwright Chromium, Firefox, WebKit for repeatability, plus named installed browser versions for the rolling support target where feasible. Playwright WebKit is not Safari certification. |
| Windows screen reader | NVDA with Firefox and Chrome/Edge; add JAWS with a supported browser when access is available or a feature discrepancy demands it. Record browser, OS, AT, and navigation mode. |
| Apple desktop/mobile | VoiceOver with Safari on macOS and iOS/iPadOS; physical-device touch reading and virtual-keyboard behavior. |
| Android phone/tablet | TalkBack with Chrome; real touch exploration, controls, and orientation changes. |
| Keyboard/pointer/preferences | Keyboard without AT, pointer/touch, zoom/text spacing, forced colors, reduced motion, and supported color/contrast preferences. |
| Broader environments | Focused speech-input, magnification, switch/alternative-input, braille, and webview investigations when a design may limit access; record the actual boundary instead of inferring support. |

Record the current and preceding supported release explicitly rather than leaving “latest” in evidence. Browser/OS coupling may prevent installing a preceding Safari/iOS version locally; a current automated engine does not fill that gap. The current-minus-one policy remains the target while test records expose actual coverage.

### Selection and invalidation

| Change | Select this evidence |
| --- | --- |
| One component template/behavior | Its semantic contract and reachable state scenarios; relevant integration fixture paths and AT cases. |
| Shared focus/state/form helper | Transitive consuming families, including cancellation, editing, and disposal scenarios. |
| Token/theme | Dependent token aliases, computed contrast pairs, representative states, all-component sticker sheet, candidate docs, and affected workflow paths. |
| Locale/direction | Changed catalog and rendered patterns; shared name/announcement/direction helper consumers; focused IME/RTL cases if behavior changed. |
| SSR/registry/polyfill | Cross-root semantic fixtures, form/name/focus tests, hydration editing scenarios, and affected real AT combinations. |
| Broad integration/release candidate | Complete F1/F2/F3 evidence in the supported matrix, with remaining gaps visible. |

Cache keys include component/shared-dependency versions, fixture revision/data, token resolution, locale/direction, fonts, preference settings, viewport, browser/OS/tool versions, rendering mode, and relevant capability/polyfill configuration. Preserve provenance when reusing evidence. A manual AT review can be carried forward only when its tested behavior and environment are unaffected; it is not recomputed by a screenshot hash.

Do not run all-system scans on every render or all 19 locales across every AT pairing on every edit. Select affected paths, retain the broader planned matrix, and broaden checks when a shared dependency or new failure justifies it. Full workflows remain required evidence for stability; exact release mechanics belong to the release plan.

### Manual review record

Each record contains: candidate/version, scenario/step, starting state, attempted action, expected and observed outcome, impact, browser/OS/AT and input method, language/direction/preferences, reproducibility, optional capture, reviewer, timestamp, and linked finding/follow-up. Store browser and screen-reader versions separately. Avoid personal credentials or production conversation content in recordings.

Reviewer prompts:

- Could you find the control, operate it, and tell what changed using your usual interaction method?
- Where did the next action become unclear or require repeated effort?
- Did anything interrupt reading/typing or move focus unexpectedly?
- Could you correct, reverse, dismiss, or resume the interaction where intended?
- Did knowledge from another library component help here?

Use readiness/coverage labels such as **not implemented**, **ready to test**, **automated evidence recorded**, **manual evidence recorded**, **known issue**, and **not exercised** independently of run outcomes. The run manifest uses the `passed`, `failed`, `not-run`, `unsupported`, and `reused` vocabulary from [the verification plan](./verification.md); these readiness labels are not a competing result schema. Keep outcome and tested environment attached to each observation rather than a single component-wide green check. Review acknowledgment, accepted design change, and adopted code are different events.

## Accessibility of documentation and review tools

The documentation, token admin, sticker sheets, and old/new comparison demos are consumers of these contracts. They need usable navigation, named controls, headings, keyboard operation, contrast, focus, and status feedback themselves.

Label comparison regions with version and purpose so screen-reader and keyboard users can distinguish old/new instances. Scope their interactive controls without duplicate public IDs or cross-panel state leakage. Scoped registries solve a registration concern; they do not establish accessible reading order or isolate global focus/announcement behavior.

Provide end-user operation/recovery instructions; developer naming, slots, form, events, state authority/rollback timing, and styling responsibilities; designer customization effects; and structured links to these same constraints for agents. Generated API metadata supplements authored behavior documentation. A token proposal should link to its affected states and findings, not show an unsupported “accessible” score.

The sheet's source examples now use native `details`/`summary`, retaining a contextual name, ordinary keyboard operation, selectable source and independent open state. Highlighting must not replace the source or steal focus. Specimen reset preserves the user's global theme and unrelated review state. The independent Progress Report consumes its own fixed library snapshot and uses public component APIs; its search, disclosure and feedback tasks need the same naming, validation and focus checks. Neither the preview theme controls nor the report constitutes the completed managed theme-adoption workflow.

CEM diffs should surface changed accessibility-relevant APIs, while semantic/focus/keyboard/announcement changes receive authored changelog entries even when CEM is unchanged. Review them under the accepted pre-1.0 `0.x.y` and stable-version policy without inventing an additional deprecation timetable.

## Investigation follow-through

The original A1–A5 investigations now have partial implementation and focused browser evidence. They remain useful ownership links, not five unstarted experiments or global release gates.

| Investigation | Recorded progress and remaining acceptance |
| --- | --- |
| A1: semantic field | Internal label slots, native semantic owners, FACE and same-root external triggers have focused browser evidence. Reference Target/polyfill parity, SSO autofill/password-manager composition and manual AT relationships remain unverified. |
| A2: application-owned editing | Native text/textarea and editable-slider draft, validation, reset and hydration receipts retain their pre-migration scope. The adopted cancelable change migration needs new adapter/consumer evidence; physical IME/dictation and complete AT acceptance remain open. |
| A3: shared overlay/focus | Responsive native dialogs, external popover/tooltip triggers, dismissal fallbacks and complete focus rings have focused evidence. Spoken names/descriptions, focus transitions in actual AT and full workflow composition remain pending. |
| A4: hydration and review coexistence | Real component DSD and selected native node/focus/edit preservation have browser evidence. Interactive old/new review, registration isolation and announcements are not complete merely because the sheet hydrates. |
| A5: themed pattern family | Shared size/typography, aliases, custom values, forced colors and focused family layouts have versioned evidence. The broader official-theme review, managed candidates, physical preferences and accepted visual baselines remain unfinished. |

Reuse the same investigations across plans: A1 supplies the accessibility evidence for platform P6; A2 extends P2; A4 extends P3–P5. A3 is the shared overlay family slice, and A5 is the token/visual slice. One fixture/run can satisfy several linked requirements; these labels do not require duplicate implementations or parallel review systems.

No new accessibility product choice is required to reconcile the delivered feedback. The user has adopted the ownership/event migration; implement and verify its documented semantics without silently changing the existing hydration/editing policy, Reference Target support or environment targets. Use concrete capability experiments and native comparisons for engineering uncertainty; bring a material change to a promised API or environment target back to the user when evidence establishes the tradeoff.

Open browser findings remain `webkit-fixed-host-rem` and `firefox-slotted-emulated-touch`. The former is a specific runtime root-font invalidation in WebKit 26.6 with a fixed-font shadow host, not proof that Safari browser zoom fails. The latter is a Firefox 155 desktop touch-emulation failure reproduced with a native slotted button, not proof of a physical Firefox mobile failure. Keep their original artifact identities and next investigations in [the review record](./accessibility-review.md#open-findings-and-remaining-acceptance).

## Handoff

Input checkpoint: canonical progress revision 122, source `0d0b4265701b9102d1530bee63330ce879de327d`, served review artifact `0.1.0-review.0712fe49c62e`. The checkpoint has no unresolved user feedback; it retains two browser findings, with the inspected split-view source-contract follow-ups and unfinished project scope recorded separately. This plan-only reconciliation does not rebuild or reverify the artifact, change package versions, close manual review, or constitute user acceptance.

Next work: manually review the implemented F1/F2/F3 journeys, promote useful focused review probes into durable family fixtures, and record actual AT/device/prior-version evidence. Retain the scoped split-view packed-consumer and same-value-write regressions with the platform owner; extend coverage as other component dependencies and ownership adapters change. Parent coordination owns the independent report and final user-facing handoff. See [the session index](./review-session.md), [detailed accessibility review](./accessibility-review.md) and [verification plan](./verification.md).
