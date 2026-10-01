# Creative settings reference workflow

`createSettingsWorkflow({requestUpdate, scenario?})` returns `render()`, `reset()` and `dispose()`. The dedicated `/workflows/settings.html` review entry includes `settingsStyles.cssText` in its page and registers `en-slider`, `en-checkbox`, `en-select`, `en-segmented-control`, `en-button`, `en-toolbar`, `en-tooltip`, `en-menu`, `en-menu-item` and `en-command-palette` in the shell. Construction and the initial render use no browser globals, requests or timers. Each instance owns its model, request lanes and simulated service. The optional `scenario` defaults to `'explore'` and is fixed for that instance.

The four fields control an artwork preview: an editable opacity slider, output-format select, layout segmented control and background checkbox. PNG/SVG are settings only; this fixture never creates files or contacts a server. `model.ts` holds accepted local values and saved/incoming snapshots; `template.ts` renders public components; `service.ts` uses the shared fixture scheduler; `index.ts` coordinates validation, request freshness and public field setters; `commands.ts` derives the current application-owned action catalog. `styles.ts` only styles the workflow layout and artwork.

`en-change` exposes a tentative local edit. The application waits until synchronous dispatch has settled, then checks that the event was not canceled and the public `value` (or checkbox `checked`) still matches its proposal before updating local settings. A later listener can therefore reject or supersede the edit without changing the settings model. Binding unchanged primitive values on unrelated renders avoids overwriting a native editor draft. On explicit Save, the first field, opacity, reports validity through its public `reportValidity()` method before the remaining native form validation runs. This preserves field order and correctly focuses an invalid exact editor in Firefox, where aggregate form reporting can fail to focus the shadow control. An invalid number draft blocks saving even when its accepted FormData value is still valid. Passive validity queries do not invoke this reporting path or move focus. The pending save captures one snapshot; editing stays available and success marks only that captured snapshot saved. Failure preserves local work and the next Retry succeeds unless the QA result is changed again. Save remains focusable while pending; its request lane prevents duplicate operations. Cancel save invalidates only that request lane and preserves local settings, native drafts and the reviewed saved snapshot. If the removed Cancel button owns focus, focus returns to Save; otherwise it stays where the user left it. Cancellation stops waiting for this request and does not promise that already completed persistence was undone. A later save still checks the simulated service revision.

Incoming collaboration changes only opacity to 82%. It remains separate from the local values and never moves focus on arrival. Keep my opacity preserves the unfinished editor and unrelated local settings. Use updated opacity deliberately assigns the incoming number through the slider's public setter, clearing a differing draft. Both choices advance the reviewed saved revision. The stable settings heading receives focus after a choice only when the removed choice button owned focus. Restore saved opacity similarly uses a public same-value assignment to reconcile an unfinished draft, leaving other fields and any captured save intact.

Reset closes the command surfaces, removes the optional shortcut, invalidates waiting command handlers, cancels both request lanes, resets simulated persistence and authoritatively reconciles all fields. It restores the selected scenario's response preset and keeps the existing Reset settings demo label. Disposing permanently invalidates the instance. Service revision checks and lane identities prevent stale completion from replacing current UI state. The service serializes its own revision mutation at simulated delivery; result callbacks never mutate workflow UI. Accepted save/incoming snapshots are copied rather than sharing mutable objects.

## Equivalent command entry points

The toolbar exposes the frequent Save and Restore saved opacity actions. More settings actions browses the same application actions; Search commands filters their labels and keywords. Menu and palette also expose context-dependent Cancel save and Review incoming change. Disabled actions remain discoverable. The command catalog carries IDs and availability; the application owns validation, persistence, feedback and focus destinations.

Toolbar clicks use the same executor as menu and palette `en-action`. The latter queues a microtask, checks cancellation after the complete synchronous dispatch, awaits the surface's public `updateComplete`, and executes only after `open` is false. An ancestor veto of the action or default close therefore prevents application execution. The executor checks current capabilities again after closure: a command rendered before an incoming update cannot bypass conflict review. Surface close restores its opener before invalid Save moves focus to the exact editor or Review incoming change moves focus to the existing heading. Search, navigation, disabled actions and Escape do not change settings. The workflow never reads component shadow internals or invents a second command event.

The visible search button works without a keyboard shortcut. Command access and keyboard shortcut offers an explicit opt-in to Ctrl/⌘+K only while focus is in this workflow, including its fields. The listener ignores composition, repeats, canceled keys and extra modifier combinations; reset, disabling the option and disposal remove it. Opening through this application shortcut uses a silent public `open` write.

## Direct scenario pages

`scenarios.ts` is import-free metadata shared by route generation, navigation and the recipe. It exports `SettingsScenarioId`, the readonly `settingsScenarios` array and `getSettingsScenario()`. Each entry supplies its label, page title, description, path, relative HTML file, task steps, expected outcomes, relevant fixture controls and response preset. The shell selects the same scenario before server rendering and client construction; selecting a scenario does not start a request or mark a task complete.

| Scenario | Path | Initial response setup |
| --- | --- | --- |
| Explore | `/workflows/settings` | Succeed after 1.2 seconds; all controls available |
| Commands | `/workflows/settings/commands` | Standard responses; optional shortcut visible |
| Validation | `/workflows/settings/validation` | Standard responses; no additional setup |
| Save and retry | `/workflows/settings/save-retry` | Fail next save after 1.2 seconds |
| Pending save | `/workflows/settings/pending-save` | Hold successful responses until delivered |
| Incoming update | `/workflows/settings/incoming-update` | Standard responses; incoming timing and delivery visible |

Every route uses one `createSettingsWorkflow` instance, the same actual form, artwork, snapshots, command surfaces and simulated service. Initial state is idle at revision 1 with 64% opacity and no pending request or incoming change. Reset restores this state and the route's preset: Save and retry fails again on the next request; Pending save remains held. It also closes command surfaces, removes the shortcut and invalidates request identities. No scenario pre-runs a save, inserts a fabricated error, or claims a successful outcome.

Focused routes show Try this (`#scenario-steps`), Expected result (`#scenario-expected`) and Scenario controls (`#scenario-controls`) beside the form when space allows and before it on narrower screens. Native labeled sections support shell anchor links without adding Tab stops. These guides use expected outcomes, not completion indicators or live announcements. The commands route exposes the optional shortcut; Save and retry exposes Settings save result; Pending save exposes Deliver held response; Incoming update exposes response timing, queue and delivery. Validation needs only Reset. All form fields and toolbar/menu/search entry points remain available. Explore preserves the existing help and simulation disclosures for unrestricted review.

The shell owns the Settings review scenarios navigation and page heading from metadata; native Demo, Steps and Scenario controls links jump within the selected review. It must pass `scenario` to the factory consistently during server rendering and hydration, retain the selected demo ID `settings`, and preserve preview query parameters when building native links. This recipe does not duplicate routing or inspect the URL. `[data-workflow="settings"][data-settings-scenario="…"]` identifies the authored route state for consumer tests. Scenario controls are documentation fixtures; they are not new library APIs or application backend behavior.

## Manual review

On Explore, open Settings simulation controls for deterministic response timing and failure selection. Focused scenario pages show their relevant controls directly. After 1.2 seconds allows a queued update to arrive while editing. Hold until delivered makes pending-save and reset behavior easy to inspect. Held responses are delivered in request order. These controls are simulation tooling, not product settings.

- Enter a precise opacity and change output format. Run Restore saved opacity from the toolbar, menu and palette in turn; each restores only opacity.
- Search for an unknown command, clear the query and Escape without choosing. Settings and unfinished editor text stay unchanged; disabled actions never execute.
- Enter `101` in the exact editor and activate Save through the palette. Verify focus reaches the invalid editor, the last accepted preview remains, and nothing is saved. Correct the value and save.
- Select Fail next save, save and observe failure. Retry without re-entering settings.
- Hold a save, change output format or layout, then deliver the response. The saved summary describes the earlier snapshot and newer local settings stay unsaved. Repeat with Cancel save: local settings and the saved summary stay unchanged, and keyboard focus returns to Save.
- Queue an incoming update, continue typing an incomplete opacity, and review the update. Arrival must preserve the same native editor, draft and current focus. Keep preserves it; Use deliberately replaces it.
- Queue a delayed incoming update, open command search and keep typing while it arrives. Availability updates without replacing the query or moving focus; Review incoming change reaches the existing review.
- Try the visible buttons at phone width, enable and disable the optional shortcut, then Reset. Surfaces close, pending responses and the shortcut are canceled, and no old state returns.

Browser tests should scope to `[data-workflow="settings"]`. Public labels are Layer opacity / Layer opacity Exact value, Output format, Preview layout, Include background, Save settings, Retry save, Cancel save, Restore saved opacity, Reset settings demo, Keep my opacity, and Use updated opacity. Command entry points are More settings actions and Search commands. The menu is `#settings-command-menu`, the palette is `#settings-command-palette`, and its search label is Find a settings command. The toolbar host is `#settings-command-toolbar`; scope authored button locators from the host rather than its private slot wrapper. `[data-action="settings-save"]` remains stable while its label changes to Saving settings…. Summaries are `[data-settings-current]`, `[data-settings-saved]`, and `[data-settings-dirty]`; the single persistent announcement is `[data-settings-status]` with `role=status`. Incoming review is the region named Incoming opacity change. QA labels are Settings save result, Settings response delivery, Queue collaborator update, and Deliver held response.

Keyboard review follows native controls. Exact editor completion is Enter or blur; Escape keeps the last accepted value. Value announcements remain native; the preview and summaries are not live regions. There is one persistent status region for save, service failure, cancellation, incoming and reset outcomes. Invalid Save uses native form validation and its focused field error without a duplicate generic live announcement. Save blocked by an unresolved incoming update focuses its existing heading without another live message. Automated interaction tests do not replace screen-reader, dictation or physical-IME review.

The Save and Restore buttons have stable external trigger IDs. Their sibling `en-tooltip` hosts use `warmup-group="settings-command-toolbar"`, so pointer travel between these frequent actions shares warm-up without moving the tooltip hosts into the toolbar. Keyboard arrow navigation still opens the focused action's description immediately. Save/Restore handlers and their application ownership remain unchanged. The isolated tooltip review explains the cold delay, independent group, cooldown and Escape behavior.

The More settings actions menu also exposes Include background as a checkbox item
and Preview layout as a nested radio-choice menu. Both update the same accepted
application state as the always-visible fields. Item `en-change` listeners are
attached to the relevant child and ignore unrelated bubbling menu-open changes;
commands continue through the existing accepted-action path. Reset restores all
representations. The direct review is `/workflows/settings/commands`.


Output controls now compose the format selector, background checkbox and Restore
saved output button in `en-toolbar keyboard-navigation="tab"`. This named group
keeps native sequential focus and editing keys in SSR and after hydration.
Restore saved output restores only the last saved format/background pair; opacity
and layout remain unchanged. The separate Settings actions toolbar remains a
button-only roving composite, providing both keyboard contracts in one workflow.

### Project outline

The main Explore page includes a child-authored `en-tree` and a local details panel. Selection and expansion are independent; the panel observes only an accepted selection after synchronous `en-change` dispatch. It has no connection to output form values, save requests or collaborator simulation. Focused review scenarios retain their existing isolated setting controls.

## Command search construction

Settings uses the palette's default eager search and result body. Server-rendered
pages already contain the native input, listbox, result rows and status inside
the closed, inert dialog while the client palette remains unregistered. A
client-only palette constructs that same body when registered and rendered.
Close/reopen retains the native editor;
an accepted close resets its query under the existing editing contract. There is
no separate generated-content construction policy.

The existing application activation owns tag preparation, registration, readiness,
loading/retry feedback, Escape cancellation, disposal and focus-generation checks.
Code-only intent preparation leaves an undefined palette unregistered. Completing
registration after canceled intent may construct the eager body, but must not
open the palette or steal focus. The settings form and menu remain usable without
opening command search. Matching server/client snapshots retain their existing
hydration owner; eager construction does not change application code loading.
