# Sticker-sheet interaction review

Status: accumulated user decisions and implementation/evidence at audit checkpoint revision 121. The report records the reviewed refinements as delivered. Planning synchronization changes no runtime code and reruns no browser tests. Focused browser evidence, manual assistive-technology work, and unfinished full reference applications remain distinct.

Scope: appearance choice pills, three densities, shared sizing/type, control focus contours and clearance, rating presentation, external overlay relationships, responsive dialogs, tooltip pointer traversal, editable numeric controls, and documentation code/reset/navigation behavior. The existing `en-*` naming contract applies to the `ev-*`/`rv-*` references in feedback. No service, publication, or extra workflow is introduced by this review.

## Appearance is a choice; a switch is an on/off setting

Use `en-segmented-control` for mutually exclusive visible choices such as Light and Dark. Give the group an accessible name such as Appearance, preserve visible option labels, and expose the selected option. It is one radio-style selection task, not two unrelated commands or an on/off switch.

For the ordinary standalone group, Tab enters at the accepted enabled option, otherwise the first enabled option; the next Tab leaves the group. Explored focus is retained only while operating inside the group and is cleared on exit. Arrow keys move through and select available options, and Space selects the focused option. Entering focus does not itself select a value. An unavailable accepted choice is not silently replaced: it has no submitted form entry and fails required validation until an enabled option is accepted. Explain that unavailable state to users; native browser grouping evidence does not finish the pending real-AT group-count review. The group must not change its value during responsive reflow. See the [WAI radio-group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

A group embedded in a true toolbar needs that toolbar's navigation contract; do not silently reuse standalone selection-on-arrow behavior there. Native and custom implementations can differ in unselected reverse-Tab entry, so document and test the implementation actually delivered. Two independent button Tab stops would be reasonable for two commands, but do not match this single-choice task.

Keep `en-switch` for a setting such as Live preview on/off, with a stable label and observable checked state. A binary switch should not relabel itself Light or Dark after activation. The distinction is semantic, not an attempt to reduce every two-choice control to one shape. See the [WAI switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/).

Pointer padding inside the options frame activates the nearest option rectangle in two dimensions, including wrapped and RTL layouts. A disabled nearest option stays inert; ties use stable option order. Native option-label clicks retain their normal path without duplicate activation. The group matches the select control's shared height envelope and outer radius, with inset inner corners. These visual/target refinements do not change its single-entry keyboard model.

Acceptance operations: Tab into the appearance group, identify the selected value, change it by keyboard, leave it with Tab, return to the selected choice, then perform the same selection by touch and by clicking the surrounding options-frame padding. Confirm synchronous cancellation restores still-owned accepted state unless an application write or accepted nested change supersedes it and that application-supplied values update presentation without fictitious user-change events.

## Density and size are independent customization axes

Use three initial density names: **Compact, Comfortable, Spacious**. Comfortable remains the initial default. Density changes spacing and control packing; it does not shrink the font as a shortcut to fitting more content or automatically choose a mode from the input device.

The authoritative sizing policy follows the user's latest correction:

- Public host `size="inherit|small|medium|large"` describes the requested sizing mode. **Medium is the default in both the API and CSS when the attribute is absent, including inside a differently sized parent.** Consumers do not need to set `size="medium"` to obtain medium sizing.
- `size="inherit"` explicitly opts into the containing size scope. Removing the attribute or supplying an invalid value restores medium behavior. Three concrete scales and an opt-in inheritance mode remain available.
- The `.size` property reports the requested mode: medium by default, or inherit when explicitly selected. It is not a computed-size measurement API. API and absent-attribute CSS behavior must agree.
- Explicit nested sizes select their own scale rather than multiplying the parent scale. Repeated wrappers must not progressively shrink or enlarge content.
- Each host establishes medium selection by default. Only explicit `inherit` takes the surrounding size-selection state; concrete modes establish absolute selection. Resolve generated role values locally against each host's current theme tokens. Do not inherit already-resolved dimensions in a way that leaves them stale across a nested full-theme scope. Each family consumes its own relevant roles, so an icon using `size="inherit"` uses icon geometry rather than its containing control's box size. The styles/token owner owns the concrete mechanism, values, and precedence.
- Size and type have separate roles. Current small UI/input/metadata text preserves its base size, so small and medium controls can share readable text while differing in geometry; larger type remains available. UI family, size, and line-height drive input and strong-label defaults through aliases, while their weights and explicit overrides remain independent. Density does not change font size. Enlarged text and text-spacing overrides must grow the shared control envelope rather than clip or be normalized away.
- Hit-target floors are independent of the selected scale and remain unscaled. A smaller drawing must not accidentally create an unusable target.
- Existing explicit component, width, and gap overrides retain their meaning and precedence. A layout wrapper can establish a concrete size context or explicitly inherit one without rewriting an independently chosen gap; children inherit that context only when they opt in.
- A visual size never changes task values: rating maximum, progress amount, selection count, content, and action semantics remain the same.

All element families need a documented sizing role. Structural hosts can establish or forward context where they have no separate control drawing. Do not add an undocumented inert `size` attribute or invent an arbitrary visual effect solely to make a host appear covered. Form controls distinguish host scale from the native input `size` concept of character width; any future character-width API must have an explicit separate name.

Acceptance operations: compare all three densities at the same size; compare all three sizes at the same density; place an attribute-free child inside a large parent and verify that both its property and presentation remain medium; opt that child into inherit and verify the larger context; then remove or invalidate its size and verify return to medium. Repeat relevant cases across controls, media/feedback, layouts, and overlays, including nested theme scopes. Confirm nested hosts do not compound scaling and explicit token/width/gap customizations still work. Check readability, target geometry, focus visibility, clipping, and labels with longer text. A scale attribute appearing in metadata is not evidence of sizing behavior.

Record the medium default and explicit inheritance behavior in the CEM and iteration notes. The earlier team proposal to inherit by default is superseded and was not an accepted user requirement. Follow the user's work-in-progress instruction: retain package/library versions at `0.1.0` for this iteration.

## Focus contours and rating appearance

The focus indicator follows the meaningful interaction shape and remains distinct from selected state: rounded-square checkbox, circular radio, visible slider thumb, and appropriately shaped rating/segmented target. The compound number field uses per-subcontrol focus: the center input has square corners and an inset outline, while edge steppers retain their own contours. It does not use a universal outer-group ring.

Full visibility also depends on surrounding surfaces. The accordion raises the focused item above adjacent item surfaces; the splitter raises its focused handle above both panes; overlay scroll containers reserve clearance for field/checkbox focus outlines. These fixes address complete-loop clipping and occlusion in dialog, drawer, popover, accordion, and split layouts, not only the local contour. Keyboard and forced-color evidence remain necessary.

Give `en-rating` a recognizable star presentation while retaining a single-choice model and intelligible option labels. Selection, pointer preview if present, and keyboard focus are different states. A clear/no-rating option should be understandable and should not look like another rated star. Do not change the value scale or keyboard model merely to make it appear less like a conventional radio group.

Acceptance operations: focus each choice control without changing its value, identify the focused region, select by keyboard, and distinguish focus from selection. In the rating, choose a value and clear it through the supported path. Repeat in light/dark themes, all density/size combinations relevant to the control, and forced colors. Check the interactive target rather than only the star or dot drawing.

## External triggers and names

Popover and tooltip triggers are external: `for` is a literal ID in the overlay's own Document or ShadowRoot, and `.for` is the equivalent property. There is no trigger slot. Current supported overlay triggers are a native button or `en-button`; arbitrary custom-element internals are not a public integration surface. The trigger stays in application layout; the overlay content retains the theme scope where it is placed.

Late insertion, replacement, ID changes, rebinding, and disconnection must maintain listeners and real accessible relationships without moving focus unexpectedly. An initially open surface waits for a valid trigger; a visible popover whose trigger disappears keeps its current content/position until it is dismissed or rebound. Do not focus a removed opener or claim broad cross-shadow ID lookup.

Use noninteractive phrasing in supported named label slots, with `label` fallback. Keep the trigger's action name, the field's name, and a popover/dialog title distinct. Tooltip descriptions reference real same-tree content; `en-button` forwards the resolved relationships to its native control. Browser element-reference and accessibility-tree evidence is not proof of all screen-reader output. The existing manual review gap remains visible.

`en-color-field` can also target a supported external button or `en-swatch` by `for`; its labeled native picker remains available. `en-swatch` owns the focusable color sample only. Captions, token-reference text, clipboard action, and success/failure feedback are consumer composition responsibilities, demonstrated in the sheet rather than built into every swatch.

## Dialog presentation may adapt without replacing the interaction

Use an opt-in responsive presentation on `en-dialog`; retain the same dialog element, slotted content, open state, form draft, and active control while switching its layout to a drawer on a small viewport. This is presentation adaptation, not an automatic close/open cycle or a new collapse action. Ordinary dialogs remain unchanged unless the consumer selects responsive behavior.

The implemented public surface is `presentation="responsive"` with `responsiveQuery` / `responsive-query`; the default query derives from the layout dialog-collapse token. The default presentation remains dialog. Do not add a second independent open state or synchronize two dialog/drawer instances.

The responsive surface keeps its title, dismiss control, action ordering, modality, and cancelable state-change contract. The requested `closedBy` behavior and its compatibility fallback must remain consistent across presentations; appearance adaptation must not silently change which dismissal actions are allowed. A change in width or orientation must not re-run initial focus or steal focus. Deliberate opening, closing, and removal of a focused control still need their documented focus transitions. Keep content and essential actions reachable with a virtual keyboard, safe areas, zoom, and constrained height. Respect reduced-motion preferences; resizing must not obscure the active field through a decorative transition.

Acceptance operations: open the dialog, edit a field, cross the presentation boundary in both directions, continue editing, and dismiss it through the same supported path. Verify the same active control and draft survive, only one modal instance exists, no spurious state-change event is emitted by presentation alone, and focus returns meaningfully after closing. Repeat with dismissal accepted and synchronously canceled.

## Tooltip traversal must work at a human pace

The current implementation adds safe-corridor geometry to the earlier timed exit grace period, using the pointer exit point and the destination surface bounds. A bounded transit interval prevents indefinite retention between surfaces. Validate slow diagonal movement as well as a quick straight crossing; the presence of geometric code alone does not establish the human outcome.

The outcome matters: a pointer can reach and remain over the tooltip without losing its content; an intentional move elsewhere lets it close; no invisible corridor intercepts underlying clicks. Repositioning, flipping, or scrolling must not leave stale geometry. Pointer bookkeeping must end when the tooltip is closed or disconnected.

Keep focus-triggered persistence independent of a hover timer. Escape dismisses without moving focus and should not immediately reopen the tooltip while the same trigger remains active. A genuine later trigger may reopen it. Required instructions remain available outside the tooltip; content stays supplemental and noninteractive, with a popover used for actions. The applicable [WAI hover/focus guidance](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) concerns dismissal, hoverability, and persistence; it does not mandate one geometric algorithm.

Acceptance operations: move slowly from trigger toward each reachable edge of the positioned surface, pause over its content, then move elsewhere. Test a flipped/clamped position and large-pointer/magnified use. Open by keyboard focus and dismiss with Escape without moving focus; ensure pointer behavior does not undo that dismissal. Touch users must not lose essential information because hover is unavailable.

## Numeric precision, password use, and split layouts

The sheet now demonstrates a password text field with masked input and password autocomplete metadata. It is a component specimen, not the complete SSO/login reference application.

`en-slider editable` combines a native range and a named exact-value input: two native Tab stops for one accepted value and one form entry. The editor's live string draft may differ from the accepted number. Completion validates bounds/step, invalid drafts remain available for correction, canceled tentative changes restore still-owned accepted state and preserve native drafts, and Escape restores the accepted value. Range and text interactions keep their native editing/keyboard semantics. Source and focused tests document these behavior boundaries; full screen-reader/mobile use still needs its planned review.

Top/bottom panes are already implemented with `en-split-view orientation="vertical"` and an explicit block size. The contained separator is horizontal and uses Up/Down plus vertical pointer movement. Side-by-side panes use the corresponding vertical separator and direction-aware horizontal movement. Do not conflate pane-flow orientation with separator orientation. The retained report receipt `evidence/splitter-focus/verification.json` for artifact `7cccff203162` records keyboard/pointer checks on both axes, bounds/cancellation, and focused screenshots in three engines. The durable focused structures suite still lacks an explicit top/bottom case; carry that coverage into the maintained suite rather than rebuilding the feature or claiming no prior browser evidence.

## Code, reset, and navigation serve the review task

Every specimen uses native `<details><summary>` to reveal the real authored example, including imports/setup, bindings, and relevant event handlers. Source uses literal tabs with a configurable rendered tab width and remains the same escaped text that can be copied. It represents the declared example, not a serialization of private shadow DOM or transient mutated DOM.

Microlighter 2.1.0 and the local Lit TypeScript grammar load on disclosure, highlight HTML/SVG tags and Lit bindings inside supported tagged templates, and retain TypeScript expression highlighting. Highlighting uses CSS Highlight ranges without executable markup or replacement token nodes; unavailable/unsupported grammar cases remain readable source. The isolated grammar/loading seam and its limitations are documented in `tooling/highlighting/README.md`.

Theme controls use `en-*` components, including segmented choices, fields, and reset actions; the version label is an `en-badge`. The independent Progress Report also uses a versioned library/token snapshot for its interactive controls while retaining native document structure and its independent server/storage.

A specimen reset restores that specimen's declared initial state and cancels its outstanding simulated async work. It does not reset the global theme, density, direction, or size preview; close code that the reviewer opened; reset neighboring examples; or move focus to the top of the page. Place the reset action in stable surrounding UI so recreating example internals does not remove the activated button. Preserve focus when its target survives; otherwise use a predictable nearby target with context.

Keep reset scope clear in the accessible name or surrounding heading. Do not add confirmation for a reversible local specimen reset. A global preview reset remains a separate action with separate scope. Static specimens need no misleading claim that data has been restored when nothing can change.

Make the section navigation available while reviewing the long sheet, while respecting constrained viewport height. Sticky navigation must not cover anchor destinations, focused controls, or the opened code. Preserve native link behavior and direct section URLs; do not turn navigation links into tabs without panel semantics. On small screens, an obvious compact navigation pattern is preferable to a tall permanent region that leaves little room for examples.

Acceptance operations: open code, interact with the specimen, reset it, and continue reading the same code section; neighboring and global preview state stays intact. Trigger delayed fixture work, reset, and confirm its stale completion cannot overwrite the reset state. Navigate to a deep section by keyboard and direct URL and verify its heading and focused controls remain visible beneath sticky UI.

## Peer conclusions and open decisions

The choice, forms, architecture, and token owners agree on the semantic appearance control and the separation of size from density. Léonie's API/rendering-consistency concern is met by the latest user decision: medium in both API and CSS by default, including nested hosts, with explicit inherit opt-in. Her review also confirms standalone radio Arrow selection versus focus entry, persistent tooltip hover/focus, Escape suppression, and predictable focus after reset. The overlay critique supports responsive presentation on one instance and measurable pointer traversal. Exact source implementations and validation evidence remain with their owners; this plan must not substitute for them.

The earlier revision-121 audit recorded the old `controlled`/request-change protocol, unbuilt login/settings/chat applications, and source-only split registration/supersession and maintained top/bottom coverage gaps. Those implementation gaps were addressed at later checkpoints in the [current review index](./review-session.md); the original audit is historical. The user has now adopted the [single cancelable `en-change` migration](./architecture.md#cancelable-state-changes-and-application-authority). Its runtime and consumer verification is in progress, with no new browser or publication claim from this plan update. Preserve native drafts and focus during owned rollback, defer destructive overlay/group/focus effects until settlement, and retain silent authoritative writes and native lifecycle reconciliation. Manual AT/support acceptance remains open.

## Retained interaction-review checkpoint

| Area | Current implementation | Evidence boundary |
| --- | --- | --- |
| Size/type | Medium API/CSS default with no attribute; explicit inherit; role values resolve locally. Shared UI/input/strong-label metrics and readable small/medium control text retain independent overrides. | Canonical report records the focused sizing/typography matrix, enlarged text, SSR, and RTL checks. This is not universal device/AT coverage. |
| Appearance | Single-entry segmented radio choices, native-label paths, nearest-frame-padding activation, disabled-nearest inertness, and select-aligned frame geometry. | Browser recovery/grouping checks exist; disabled-radio group-count speech still needs real AT review. |
| Numeric examples | Password specimen, compound number field, and editable slider are delivered. | These do not complete the login/settings application journeys; native editing and draft/form contracts remain explicit. |
| Overlays | Same-root external `for` triggers, label slots, closedBy native/fallback behavior, responsive same-instance geometry, and pointer-safe tooltip transit are delivered. | Focused browser evidence exists; cross-environment screen-reader/pointer/magnification review remains bounded by the actual recorded matrix. |
| Focus visibility | Complete outlines are kept above adjacent accordion/split surfaces and within overlay scroll clearance; per-control contours remain distinct. | Existing screenshot/browser evidence addresses reported cases, not every consuming layout. |
| Code/reset | Native details, authored literal-tab source, lazy local Lit highlighting, and per-specimen resets preserve surrounding review UI. | Highlighter dev/production and reset checks are recorded; complete async workflow fixtures remain future work. |
| Split orientation | Both side-by-side and top/bottom paths exist; vertical pane flow maps to a horizontal separator. | The original audit retained both-axis probe evidence; the later shared-correction checkpoint added maintained top/bottom coverage. Neither receipt verifies the new event migration. |
| Report/docs | Both consume library controls; report uses an independent versioned bundle snapshot, server, and state. Sticky docs navigation accounts for its measured height. | Report and docs have their own recorded checks and receipts; neither implies completion of the full documentation/admin system. |

Audit checkpoint: canonical revision 121 records 44 accumulated feedback items resolved and review `0.1.0-review.0712fe49c62e` delivered, with no unresolved feedback at that time. The full library objective remains open. Planning synchronization changes no runtime code and reruns no browser tests. [review-session.md](./review-session.md) is the current cross-plan index; the root task owns subsequent progress updates and the implementation handoff.
