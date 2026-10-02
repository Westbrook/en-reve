# Overlay, navigation, and disclosure API audit

Read-only source audit, 2026-09-18. No component implementation was changed. IDs OVL-01–OVL-14 are stable local references for integration into the parent audit. Evidence below is from actual TypeScript/template source; CEM metadata was not treated as authoritative. Relative evidence paths resolve under the repository/. Findings distinguish observable implementation gaps from API policy decisions; a difference alone is not a defect.

## Coverage

Inspected en-tooltip, en-popover, en-dialog, en-drawer, FloatingSurface, ModalTriggerController, tooltip/menu positioning, en-menu, en-menu-item, en-command-palette, en-toolbar, en-navigation, en-navigation-group, en-breadcrumbs, en-link, en-tabs, en-tab, en-tab-panel, en-accordion, en-accordion-item, en-split-view, en-splitter, and en-pagination. Checked relevant templates, styles, event transactions, owner connections, README contracts, and registration/type declarations. Sidebar is en-navigation layout="sidebar" plus navigation-group; there is no separate sidebar or navigation-item element in this surface. Native anchors are navigation items.

## Findings

### OVL-01 — External trigger clicks have three different cancellation/default-action contracts

**Class:** Observable implementation discrepancy; high priority for later correction.

**Evidence:** packages/elements/src/popover/floating-surface.ts:178 accepts no event and only checks trigger availability before show/hide; packages/elements/src/menu/element.ts:203 checks event.defaultPrevented; packages/elements/src/dialog/trigger-controller.ts:37 checks defaultPrevented and calls preventDefault at :46. Modal and floating triggers both accept native button/en-button, at trigger-controller.ts:29 and floating-surface.ts:208.

**Equivalent intent / consequence:** All associate an external button through for. A prior listener's preventDefault suppresses menu/dialog opening but not popover opening. An associated native submit button has its submit default suppressed for modal opening but not for popover/menu opening. These differences are independent of modal versus nonmodal focus behavior.

**Preferred normalization:** Share the trigger admission/click transaction, honoring an already-prevented click everywhere. Explicitly choose a common form-default rule for associated opener buttons. Preserve modal opener-only behavior versus menu/popover toggling as a separate policy.

**Alternative / migration:** Require type="button" for nonmodal triggers and document the difference, while still respecting preventDefault. Fixing the latter can change applications that intentionally depended on opening after a prevented click; changing submit suppression needs a migration note.

### OVL-02 — Accepted requests do not consistently revalidate listener-modified constraints

**Class:** Observable transaction correctness gap.

**Evidence:** packages/elements/src/dialog/trigger-controller.ts:39 supplies a validity closure checking current association, connection, and disabled/loading state; dialog/dialog.ts:156 passes it as canCommit. By contrast, popover/floating-surface.ts:84 calls dispatchChange without canCommit. tabs/tabs.ts:125 checks disabled/value only before dispatch and its transaction at :127 has no canCommit. accordion/accordion.ts:60 and accordion-item/accordion-item.ts:85 also check eligibility only before dispatch. Counterexamples with final checks: menu-item/element.ts:126, splitter/splitter.ts:122, split-view/split-view.ts:172. primitives/src/interactions/events.ts:83 only validates when a caller supplies canCommit.

**Equivalent intent / consequence:** Every component exposes the same cancelable tentative change model. During en-change a consumer can disable/remove/rekey a tab or accordion item, or rebind/disable a floating trigger, without assigning the primary state. Some components cancel the stale default; others still accept it. A floating open may commit intent while its original trigger is no longer eligible.

**Preferred normalization:** Define reusable final admission checks per operation: connection, current ownership, enabled state, stable key/association, and current numeric bounds where relevant. Keep authoritative state writes and accepted nested transactions superseding older work.

**Alternative / migration:** Explicitly document that only preventDefault/state writes invalidate certain requests. Preferred checks change only requests whose eligibility changes synchronously during dispatch; add focused adversarial cases rather than changing the public event shape.

### OVL-03 — Dynamic child identity reconciliation varies between related composites

**Class:** Observable implementation gap.

**Evidence:** packages/elements/src/accordion/accordion.ts:80 refreshes children on slot discovery and :93 only synchronizes when group value/multiple changes. accordion-item/accordion-item.ts:104 reacts to open, not value changes. tabs/tabs.ts:69 observes value/disabled changes, but its filter at :70 omits id even though :109 and :116 copy paired IDs into ARIA references. menu/element.ts:276 observes its association and item keys including for/id/type/name; FloatingSurface uses observeIdReference at popover/floating-surface.ts:192.

**Equivalent intent / consequence:** Public child keys and IDs establish parent-owned relationships. Changing an accordion item's value while keeping the same slot does not refresh its open state against the group's value. Changing a tab/panel ID can leave its counterpart's aria-controls/aria-labelledby stale until some unrelated reconciliation occurs.

**Preferred normalization:** Observe or privately notify owners about every public relationship input they consume. Reconcile key and ID changes independently from a group value change; share an owner-membership helper where practical.

**Alternative / migration:** Make keys/IDs explicitly immutable after attachment and enforce that contract. Reactive reconciliation is the less disruptive choice because these are currently ordinary mutable public properties/attributes.

### OVL-04 — Tab keyboard eligibility omits hidden/inert state handled by sibling composites

**Class:** Observable interaction consistency gap.

**Evidence:** packages/elements/src/tabs/tabs.ts:101 and :162 derive enabled tabs solely from !disabled; initial selection at :93 does the same; the observer at :70 watches only value/disabled. toolbar/element.ts:52 excludes hidden/inert, missing client rects, and hidden visibility, and its observer at :103 tracks related changes. menu/element.ts:303 walks composed ancestors to exclude hidden/inert and invisible items.

**Equivalent intent / consequence:** Arrow navigation needs eligible rendered targets. A hidden or inert tab remains in the tabs cycle and can become the selected key even though focus cannot reach that tab. Toolbar/menu already distinguish discoverable disabled commands from actually unavailable content.

**Preferred normalization:** Reuse a composed availability predicate for hidden/inert/rendered state and observe relevant changes; keep component-specific disabled semantics separate.

**Alternative / migration:** Require consumers to mirror hidden/inert into disabled and document that restriction. Preferred behavior changes keyboard traversal only for unavailable tabs and may require choosing a new entry tab when the current one disappears.

### OVL-05 — Disclosure open changes use incompatible event models

**Class:** API policy decision, not an assertion that native details behavior is wrong.

**Evidence:** packages/elements/src/navigation-group.ts:41 applies open and dispatches noncancelable en-toggle with {open}; navigation/element.ts:124 does the same for compact disclosure and :131 handles Escape with another terminal en-toggle. accordion-item/accordion-item.ts:91 proposes boolean open through cancelable en-change with previous/proposed/reason. dialog/dialog.ts:156 and popover/floating-surface.ts:84 use that same proposal contract. split-view/split-view.ts:116 uses the shared transaction helper under en-collapse for a second, separately typed state.

**Equivalent intent / consequence:** These all reveal/hide existing content. An application policy adapter can veto accordion/modal disclosure before commit, but must observe navigation disclosure after it happened; event names and detail types also change.

**Preferred normalization:** Decide whether all public, application-controllable boolean disclosures should offer the shared tentative en-change path. If yes, route user activation through it while preserving native details semantics and retain en-toggle temporarily as a clearly terminal compatibility notification.

**Alternative / migration:** Keep navigation as a lightweight native-details exception, prominently documenting noncancelability and terminal timing. Do not relabel a terminal event as cancelable after the native change. If adding proposals, distinguish duplicate proposal/notification subscriptions during migration.

### OVL-06 — Programmatic request versus authoritative-write workflows are uneven for disclosure

**Class:** API capability/ergonomics decision.

**Evidence:** packages/elements/src/dialog/dialog.ts:151 and popover/floating-surface.ts:79 expose show/hide returning ChangeOutcome. split-view/split-view.ts:108 exposes collapse/restore/toggle with outcomes. accordion-item/accordion-item.ts:85 keeps toggle private, despite a public open setter at :68; navigation-group.ts:17 exposes only open, and navigation/element.ts:92 adds revealCurrent but no disclosure request method.

**Equivalent intent / consequence:** External controls can request a vetoable overlay or pane visibility change, but must silently assign accordion/navigation open state or synthesize a click on internal UI to get equivalent behavior. Silent authoritative writes themselves are correct and should stay silent.

**Preferred normalization:** Add a small public request API for boolean disclosures, using the established outcome type and respecting group ownership. Decide one naming family (show/hide/toggle or explicit requestOpen) and offer aliases without renaming existing overlay methods. Pane-specific collapse(pane)/restore remains semantically useful.

**Alternative / migration:** Keep proposal methods only for overlays and split panes and document setter-only disclosure control. Additive methods avoid breaking existing silent assignments; grouped accordion methods must delegate to the group rather than emitting duplicate child events.

### OVL-07 — Anchored placement and responsive configuration have incompatible expressiveness

**Class:** Mixed API capability gap and implementation-policy divergence.

**Evidence:** packages/elements/src/tooltip/tooltip.ts:46 and :103 expose inline/block logical regions; tooltip/position-controller.ts:136 reads trigger direction/writingMode and :147 uses visualViewport offsets/dimensions. popover/floating-surface.ts:311 always prefers below/start, reads host direction at :322, and measures documentElement width/height at :317. MenuPositionController independently measures visual viewport at menu/position-controller.ts:131 and adapts presentation at menu/element.ts:344. dialog/dialog.ts:66 exposes presentation/responsive-query; navigation/element.ts:35 exposes collapse-at, which is interpolated into max-width at :103. Drawer placement is viewport-edge placement at drawer/drawer.ts:37, a distinct concept.

**Equivalent intent / consequence:** Consumers positioning an anchored surface can tune tooltip regions but cannot express the same preference for popover/menu. Popover can use a different direction source and viewport envelope from tooltip/menu/pagination. Responsive navigation accepts a length while modal overlays accept a complete query, and submenu replacement is automatic.

**Preferred normalization:** Extract shared anchor geometry/viewport observation and expose common logical preferences on compatible anchored surfaces, retaining per-component defaults and menu submenu rules. Document one responsive-query vocabulary, optionally retaining collapse-at as shorthand.

**Alternative / migration:** Keep minimal fixed popover placement and explicit component-specific responsive policies, but document them together. Add new preferences as optional; do not rename drawer edge placement into anchor placement or force menu replacement behavior onto other overlays.

### OVL-08 — Dismissal policy, visible close affordance, and legacy aliases are intertwined

**Class:** API normalization decision, not a request to remove mandatory dismissal exits.

**Evidence:** packages/elements/src/dialog/dialog.ts:63 exposes closedBy (attribute closedby), dismissible, and backdropDismiss; :128 documents dismissible as both overall dismissal switch and close-action visibility; :134 maps backdropDismiss to closedBy; :193 applies the effective policy. dialog/template.ts:34 uses dismissible to omit the close action. popover/popover.ts:46 only adds label/closeLabel, popover/template.ts:17 always renders close, and floating-surface.ts:339/:346 always proposes Escape/outside dismissal. Drawer and command palette inherit the modal policy.

**Equivalent intent / consequence:** Customizing a dismissible surface requires understanding several overlapping modal fields, whereas nonmodal dialogs expose no corresponding policy. Hiding the modal close control also changes Escape/backdrop behavior. The native closedby spelling is deliberate platform alignment, unlike an accidental kebab-case inconsistency.

**Preferred normalization:** Publish a canonical dismissal policy and an independent close-affordance option; deprecate legacy aliases only after a documented mapping. Decide explicitly which nonmodal surfaces should support policy customization while preserving usable keyboard exits.

**Alternative / migration:** Keep the current minimal popover contract and modal legacy fields, with a precedence table. Never reinterpret existing dismissible=false as only visual hiding without a breaking-change plan.

### OVL-09 — Removing defaulted localization attributes is inconsistent and can throw

**Class:** Confirmed runtime defect plus broader default/reset inconsistency.

**Evidence:** packages/elements/src/navigation/element.ts:32 and breadcrumbs/element.ts:24 use useDefault:true. pagination/element.ts:53–62, toolbar/element.ts:19, and navigation-group.ts:18 omit it. pagination/template.ts:42 passes statusLabel to paginationText; pagination/state.ts:26 invokes replaceAll without normalization. Local Lit source at node_modules/@lit/reactive-element/development/reactive-element.js:103 returns null for removed string attributes, and :668 restores only recorded defaults.

**Equivalent intent / consequence:** Removing a temporary localized attribute restores Navigation/Breadcrumbs defaults but produces null for sibling defaulted strings. Removing pagination status-label then rendering throws TypeError rather than restoring its default. The navigation subaudit reproduced this through existing built modules and the actual Lit attribute callback; TypeScript source independently confirms the path.

**Preferred normalization:** Apply a consistent default-on-attribute-removal policy to defaulted strings, using useDefault:true or an equivalent converter, and define handling of direct null/undefined writes. Check defaulted close/back/search labels under the same rule.

**Alternative / migration:** Normalize at each template boundary and document reset semantics. Preserve authored empty strings as distinct unless expressly forbidden; the fix should not silently replace valid custom text.

### OVL-10 — Equivalent styling roots/control surfaces use unrelated Part names

**Class:** Low-priority API consistency choice; additive aliases are sufficient.

**Evidence:** packages/elements/src/pagination/template.ts:49 exposes root navigation; primitives/src/templates/slotted-navigation.ts:12 and templates/breadcrumbs.ts:13 expose equivalent landmarks as base. toolbar/template.ts:11 also uses base. The native disclosure button is trigger at accordion-item/template.ts:15, summary is toggle at navigation-group.ts:49, menu-item native button is control per menu-item/element.ts:44. command-palette/element.ts:175 already uses an additive surface base alias.

**Equivalent intent / consequence:** Shared consumer styling needs component-specific selectors for common roots and operable surfaces. Some names intentionally describe role, but these are not incompatible with a generic alias.

**Preferred normalization:** Add base alongside pagination's navigation; consider control aliases on native disclosure controls while retaining trigger/toggle. Define base as the root wrapper and control as the actual interactive surface, distinguishing button hosts from exported native controls.

**Alternative / migration:** Keep semantic Part names as explicit exceptions. Add aliases rather than removing existing Parts, and avoid requiring base on modal shells when surface already has a precise purpose. Existing command-palette aliases demonstrate the compatible mechanism.

### OVL-11 — Overlay lifecycle observability is a policy decision separate from cancellation

**Class:** Documented observability limitation; not automatically a defect.

**Evidence:** packages/elements/src/dialog/dialog.ts:304 treats unexpected native close as terminal and writes open=false at :310 without en-change; popover/floating-surface.ts:295/:302 does equivalent reconciliation. Explicit requests use tentative en-change at dialog/dialog.ts:156 and floating-surface.ts:84. Both public open setters are intentionally silent (dialog/dialog.ts:98; floating-surface.ts:54). Floating initial native display additionally waits for an associated trigger at :271, so accepted open intent is not identical to visible presentation.

**Equivalent intent / consequence:** A listener cannot treat en-change as a post-commit/opened/closed event, nor assume every native terminal closure emits it. That preserves truthful cancellation and adopted silent-write semantics, but integrations need a documented way to distinguish accepted state from actual presentation.

**Preferred normalization:** Keep current cancellation and silent-author-write contracts. Document lifecycle states and return-value semantics consistently. Only add a noncancelable presentation notification if a concrete consumer requirement warrants it, with explicit coverage for native terminal closure versus author writes and delayed anchor availability.

**Alternative / migration:** Continue exposing only state + request outcomes, requiring consumers to inspect settled state/updateComplete. Do not emit a cancelable en-change after native closure, and do not introduce generic en-close merely to satisfy naming symmetry.

### OVL-12 — Event reasons mix input origin with semantic action and can misdescribe an action

**Class:** API vocabulary decision with a confirmed misleading reason.

**Evidence:** packages/elements/src/menu/element.ts:371 maps the visible Back action to hide('escape'); :175 uses the same reason for the reverse submenu arrow. dialog/types.ts:1 combines programmatic/hover/focus with close-button/backdrop/action/layout in one OverlayReason union. tabs/tabs.ts:125 uses pointer/keyboard; accordion/accordion.ts:67 uses toggle; split-view/split-view.ts:114 uses keyboard/button/programmatic.

**Equivalent intent / consequence:** Generic telemetry/policy cannot reliably determine whether reason identifies the input device, semantic command, or cause. A click on Back is specifically reported as escape, even though no Escape key was used.

**Preferred normalization:** Define reason as semantic cause and, if consumers need it, add optional origin metadata for pointer/keyboard/programmatic. At minimum give submenu Back/reverse navigation an accurate documented cause instead of overloading escape.

**Alternative / migration:** Retain per-component reason unions with a published mapping. New union members or changed reasons affect exhaustive TypeScript switches and policy listeners; offer aliases or a versioned migration rather than silently changing the vocabulary.

### OVL-13 — DOM tag-name type inference is incomplete across the audited public components

**Class:** Confirmed TypeScript developer API gap.

**Evidence:** packages/elements/src/navigation/element.ts:148, breadcrumbs/element.ts:43, navigation-group.ts:54, pagination/element.ts:294, menu/element.ts:440, and menu-item/element.ts:150 augment HTMLElementTagNameMap. toolbar/element.ts:142 and link/element.ts:47 end without augmentations; neither their local nor top-level barrel supplies them. The same omission is visible at class-file endings for tooltip (:621), popover (:65), dialog (:356), drawer (:53), tabs (:193), tab (:49), tab-panel (:35), accordion (:100), accordion-item (:118), split-view (:218), splitter (:216), and command-palette (:182), using their standard folders.

**Equivalent intent / consequence:** All are public registered tags, but document.createElement/tag-name selector inference works consistently only for a subset. Source-wide searches found no central replacement for the missing declarations; toolbar/link were also checked against built declarations.

**Preferred normalization:** Supply one reachable map entry for every public tag, beside its class or through generated declarations guaranteed to be imported by each relevant entry point.

**Alternative / migration:** Explicit generic/cast-based consumer usage can remain supported, but should not be necessary for only some components. Adding declarations is additive and needs no runtime migration.

### OVL-14 — The library link is not a drop-in navigation/breadcrumb item

**Class:** Intentional composition boundary requiring explicit cross-component documentation; do not silently broaden it.

**Evidence:** packages/elements/src/link/template.ts:12 renders a shadow anchor and forwards href/target/rel/download only; no aria-current forwarding exists there. navigation/element.ts:85 finds only light-DOM a[aria-current], :116 uses a[href] for focus recovery, and styles/navigation.ts:125 targets native slotted anchors. primitives/src/interactions/breadcrumbs-projection.ts:143 rejects any direct child except native a/span. navigation-group.ts:9 documents native anchors and nested groups.

**Equivalent intent / consequence:** An author may reasonably try en-link in a library navigation container. It can appear as generic slotted content in navigation but lacks the native-anchor styling/current-link/reveal contract; breadcrumbs rejects it outright. This follows the deliberate native routing/composition design, not a broken link implementation.

**Preferred normalization:** State the compatibility boundary prominently in the en-link, navigation, breadcrumbs, and sidebar recipes and show native anchors as the supported item pattern. Preserve native routing/click semantics and the component's encapsulation.

**Alternative / migration:** If support is desired later, design an explicit public link-participation/current-state contract shared by link and navigation, including SSR and focus behavior. Do not query private shadow anchors. Documentation is nonbreaking; adding en-link support is a deliberate new capability.

## Retain these differences

- **Modal versus anchored/help semantics:** dialog/drawer/command-palette use native modality and focus containment; popover is an interactive nonmodal dialog; tooltip is noninteractive supplemental description and must not move focus. Tooltip's content slot and same-tree light-DOM aria-describedby target are justified (tooltip/tooltip.ts:17; tooltip/template.ts:11), unlike modal/default body slots. Do not flatten these into one undifferentiated overlay API.
- **for associations:** modal/popover/tooltip external native button/en-button references are same-tree by design. Menu's extra en-menu-item trigger acceptance is limited to sibling submenu ownership (menu/element.ts:150). Modal for is an optional opener; a floating surface requires an anchor for initial display. These are sensible differences, while click admission can still be shared.
- **Trigger action:** dialog/drawer opener-only activation (dialog/dialog.ts:185), palette toggle activation (command-palette/element.ts:126), and menu/popover toggling reflect existing use patterns. Preserve unless the user explicitly chooses a different action policy.
- **Split orientation:** split-view orientation describes pane arrangement; splitter orientation describes the divider/ARIA separator. The intentional inversion at split-view/template.ts:38/:42 is correct and documented; don't normalize the values blindly.
- **State shape and ownership:** tabs use one string key, accordion always uses an array, pagination uses a one-based bounded number with zero page-count meaning unknown, and split-view keeps size and collapse state separately. Grouped accordion and split-view emit at the owner once; preserve that (accordion-item/accordion-item.ts:87; splitter/splitter.ts:112).
- **Commands versus links:** menu-item/command-palette emit cancelable en-action intent, never execute application commands. Native links/navigation/breadcrumbs retain real browser navigation; toolbar retains native child click behavior. Palette's finite commands data catalog versus menu's rich slotted command rows serves different composition/search requirements. Their shared action cancellation and revision-protected dismissal already align (menu-item/element.ts:140; command-palette/element.ts:147).
- **Disabled discoverability:** menu-item disabled commands remain arrow-discoverable; tabs/toolbar skip disabled targets. This is intentional interaction semantics. Hidden/inert availability is a separate concern (OVL-04).
- **Customization families:** menu/command results use option/option-list variables; modal shells use overlay variables; search inputs use input variables. Menu option-list variables already fall back to overlay variables (styles/commands.ts:8–11/:83); modal/drawer share overlay tokens (styles/overlays.ts:13). Preserve role-based families and documented inheritance rather than forcing one token prefix for every layer.
- **Pagination private popup:** the direct-page entry popup is internal composition, with native popovertarget behavior; it need not expose a second public open value simply because en-popover exists. Geometry/lifecycle utilities may still be reused privately.
- **Native close and author writes:** preserve terminal native reconciliation and silent authoritative property writes. OVL-11 is a policy review item, not a request to reverse the adopted event contract.

## Shared-workflow opportunities, without implementing normalization

Highest-value internal reuse is external trigger admission/ARIA leasing; post-dispatch eligibility checks; composed focus availability; child identity/ownership reconciliation; and anchor/visual-viewport measurement. Preserve strategy hooks for modality, focus return, submenu replacement, and tooltip hover/focus timing. For public normalization, prefer additive aliases/default fixes and explicit support matrices over broad property or event renaming.

Validation limit: source/control-flow audit plus the navigation subaudit's targeted existing-module label-reset reproduction. No new browser or assistive-technology coverage is claimed. No tests, source edits, builds, git changes, publishing, or Progress Report changes were performed by this subaudit.
