# Context composition follow-up review

Source review: 1 October 2026, main `be47f046395bac902e3bbb938a3ece3629e4aab7`.
This closes the conditional owner-discovery evaluation (CONTEXT-2) and the three
research recommendations. It does not implement CONTEXT-3, introduce a public API,
or claim new browser, SSR, performance or assistive-technology qualification.

## CONTEXT-2 — Keep structural ownership explicit

Retain the existing ownership mechanisms for the four reviewed families. Context
answers which ancestor offers a capability; these components must additionally
establish exactly which children participate, their order, their presentation and
whether a transaction still owns its target. Replacing their owner handoff with
context would leave their structural collectors in place and add subscription,
late-provider and replacement lifecycle work. No removal of that machinery has
been demonstrated by this review.

| Family | Source and current contract | Decision and reopening condition |
| --- | --- | --- |
| Accordion | `packages/elements/src/accordion/accordion.ts`: `readItems()` resolves the flattened assigned elements, handles upgrades and calls `setOwner`. `requestItemOpen()` rechecks slot membership, key, disabled state and multiple mode before commit. | Keep the explicit handoff. Reopen for a concrete authored-child composition that cannot use the supported flattened slot, with membership and transactional behavior specified first. |
| Radio group | `packages/elements/src/radio-group/index.ts`: `collectRadios()` collects the flattened default slot; `syncRadios()` delivers selection, group-disabled state and the single tab stop. Commit eligibility rechecks assigned membership. | Keep the group as membership, form and focus owner. A provider cannot admit arbitrary descendant radios without changing the public form and keyboard contract. |
| Menu | `packages/elements/src/menu/element.ts`: `readChildren()` admits assigned menu items, releases removed registrations, reconciles nested menus and refreshes roving focus. `internal/menu-owner.ts` uses identity-checked WeakMap releases and a separate check-state map for radio transactions. | Keep the current registry for this pass. Independently bundled menu/item modules are a specific interoperability risk worth reopening with a reproducer; changing only owner lookup would leave the separate check-state identity problem unresolved. No cross-bundle conformance claim is made here. |
| Tree | `packages/elements/src/tree/interaction-controller.ts`: `collect()` builds an ordered hierarchy from direct children, rejects wrappers/slot forwarding and validates named child slots. `tree-item/element.ts` provides identity-checked owner release/presentation. | Keep structural collection and owner identity together. Reopen only with a designed authored-tree contract change, including buffered SSR, keys, hierarchy, nested trees, focus and drag ownership. Ancestor discovery does not establish any of those. |

Any later migration needs regression coverage for synchronous cancellation,
same-value authoritative writes, removal/reparenting during dispatch, stale release,
nested groups, late upgrades, SSR/hydration and focused-item removal. Add an actual
duplicate-bundle fixture if interoperability is the reason for changing ownership.
This is the migration/test cost, not a claim those future cases were run here.

## CONTEXT-R1 — Chat editor adapters

`packages/primitives/src/interactions/chat-editor.ts` registers an adapter on the
actual editor in a module-local WeakMap. Latest registration wins, and an old
disposer cannot remove its replacement. `chat-composer/element.ts` resolves the
flattened `editor` slot and looks up those exact elements when reading the editor.
`snapshotChatEditor()` independently detaches and freezes submitted JSON data.

Recommendation: retain this API until a concrete cross-bundle adapter use case is
qualified. A parent-provided service would require editor-side registration,
reparenting/unregistration and slot membership reconciliation, while an explicitly
registered native editor need not implement Context Protocol at all. It would not
replace snapshot validation. The module-local map does mean two independent
copies need a shared registration module today; do not describe it as cross-bundle
discovery.

If that requirement is taken up, compare a versioned direct-host request protocol
with a parent registration service before choosing either. Required tests: two
independently bundled copies, forwarded slots, native textarea fallback, duplicate
registration and stale disposers, disconnected/reparented editors, draft and IME
preservation, exactly one send snapshot, malformed snapshot rejection and SSR
without browser-global access. This is research, not an approved migration.

## CONTEXT-R2 — Focus participants

Recommendation: retain explicit participant membership and the existing focus
lease contract. A contextual coordinator may be useful when a future composition
has participants that cannot be enumerated through its supported authored slots.
It must not make both a native control and its wrapper independently own the tab
stop. Radio and menu membership above demonstrate why discovery alone cannot
replace ordered navigation.

A candidate must preserve author tabindex precedence, native-control fallback,
one effective tab stop, reconnect/reparenting, late upgrade, disabled/hidden items,
nested coordinators, focus recovery and identity-checked release. Compare the
candidate against the existing roving-focus implementation using real keyboard
navigation and retained native focus. No coordinator API is added by this review.

## CONTEXT-R3 — Keep the existing boundaries

| Concern | Retained mechanism | Why context is not a replacement |
| --- | --- | --- |
| Themes | CSS inheritance, documented custom properties and Parts, explicit theme installation | CSS reaches rendering and supports scoped overrides without adding a JavaScript subscription to each painted element. Context may carry a separate application preference, but should not become a second authority for computed paint. |
| Explicit references | Same-tree ID resolution and supported direct element properties | An explicit unresolved target must stay unresolved. Ancestor discovery must not silently redirect it to another component. |
| Definitions | Pure definitions, registry-aware dependency graph, explicit loading/registration | An ancestor capability does not define a constructor in the correct registry or establish its generated-child dependency closure. |
| SSR | Request-local data and matching server/client snapshots | Live ancestor discovery cannot provide the deterministic initial server snapshot. Subscriptions must not create mutable request data at module scope. |

The existing versioned editor capability contexts in
`packages/elements/src/editor/context.ts` remain a useful contrasting example:
they intentionally discover an ancestor capability, while explicit targeting and
the editor's own command/selection ownership remain separate.

## CONTEXT-3 remains implementation work

The optional tooltip warmup context is still open. It must request from the
**trigger's** ancestry, support tooltip hosts elsewhere, preserve explicit
`warmup-group` precedence (including unresolved explicit IDs), and keep nested
providers and dynamically replaced triggers isolated. Reuse the existing
`tooltip/warmup-group.ts` coordinator and preserve its focus/hover/Escape,
cancelable handoff and cooldown behavior. Qualification must cover remote hosts,
nested providers, provider replacement, trigger reparenting, cleanup and ordinary
ID-based peers before this item can be marked implemented.
