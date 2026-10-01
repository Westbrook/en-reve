# Combobox

`en-combobox` is an editable, single-select picker for a finite catalog of projects, workspaces or similar records. Typing filters labels; selecting an option accepts its stable string ID. Typed text is a temporary filter, not a new value.

The bounded implementation has focused browser, SSR, copied-source and generated metadata coverage. The remaining acceptance boundaries are listed below; earlier field or theme receipts are not treated as combobox evidence.

## Use a picker

Type part of a label to find matching options. Use the option button or Arrow Down/Up to explore the popup; arrows move the active option without accepting it. Enter or a pointer selection requests that option. Disabled options cannot be chosen. Native text-selection, caret and composition behavior remain available.

Escape, Tab and focus leaving the whole picker close the popup and restore the accepted label. They never accept the highlighted option. A canceled selection keeps the focused filter available until an application write or exit. Reconciliation waits for active composition to finish safely. Enter with an unresolved query must not submit the previous ID as though the query had selected another record.

To offer an optional clear choice, supply an item such as `{value: '', label: 'No project'}`. Selecting it explicitly clears the submitted value. Deleting the filter text only changes the search. An empty accepted value remains invalid when `required` is set. On an optional picker, empty means no selection even when no empty-value item is currently supplied; a previously known clear-choice label may remain displayed.

A present disabled empty-value item is invalid, even on an optional picker. This differs from an optional empty value with no corresponding item, which represents no selection.

The containing form's Reset button restores the initial rendered selection. Reset does not choose the first result. An application that owns reset behavior can cancel the form's native `reset` event. Browser restoration is an authoritative, silent value write.

## Native-module consumption

Configure an import map for the package graph, then import the class without registration side effects. No JSX, raw-text query import, CSS side-effect import or option-markup generator is required. The element supplies its shadow styles; the consuming document owns its page layout.

```html
<form id="project-form">
	<en-combobox id="project-picker" name="project" label="Project">
		<span slot="label">Working project</span>
		<span slot="description">Choose the project for <strong>this workspace</strong>.</span>
	</en-combobox>
	<button type="reset">Reset project</button>
</form>

<script type="module">
	import { EnCombobox } from '@en-reve/elements/combobox.js';

	const picker = document.querySelector('#project-picker');
	picker.items = [
		{ value: '', label: 'No project' },
		{ value: 'studio', label: 'Studio' },
		{ value: 'archive', label: 'Archive', disabled: true },
	];
	picker.value = 'studio';
	customElements.define('en-combobox', EnCombobox);
</script>
```

The alternative explicit registration entry is `@en-reve/elements/define/combobox.js`. Use one registration approach per registry. The `.items` property is a readonly array of `{value, label, disabled?}` records: use unique string values and plain-text labels, and replace the array to update it. One empty-value item is supported. Labels are text rather than executable markup. The listbox and options stay in the input's shadow root; there is no public `en-option` element or option-content slot in this slice.

The `label` and `description` slots follow the existing field contract. Assigned content replaces its attribute/property fallback; removing the assignment restores that fallback. Label content is noninteractive phrasing. Description content may include phrasing and ordinary help links; put a multiline description in one assigned wrapper. These slots do not expose the private control or option markup.

Generated option rows render eagerly from the current catalog. Filtering and
catalog replacement reconcile keyed rows while the native editor remains stable.
Loading or a supplied load error suppresses selectable rows. Each instance owns
its query, accepted ID and popup state; opening one does not open another.

### Values, messages and events

`.value` is the accepted ID and form value. The query, active option and expanded state are internal; there is no public query/open state or filter-mode API. The catalog uses local, case-insensitive label substring matching. It is the complete current catalog, not a remote result window.

The usual field API includes `name`, `label`, `description`, `placeholder`, `value`, `disabled`, `required`, `error` and `size`. The combobox also supports `readOnly` (`readonly`) and `autocomplete`, defaulting to `false` and `'off'`. Native focus, blur, text selection, validity and form association use `focus()`, `blur()`, `select()`, `checkValidity()`, `reportValidity()`, `form`, `labels`, `validity`, `validationMessage` and `willValidate`.

The application supplies loading and failure state. These properties do not start a request or own retries:

| Property | Default and purpose |
| --- | --- |
| `loading` | `false`; options are being supplied. |
| `loadError` | `''`; an application-supplied catalog-loading failure, distinct from field validity `error`. |
| `toggleLabel` | `'Show options'`; accessible option-button label. |
| `emptyText` | `'No matching options.'`; no matching choices. |
| `loadingText` | `'Loading options.'`; loading message. |
| `validationText` | `'Choose an option from the list.'`; invalid-selection feedback. |
| `noRoomText` | `'Suggestions cannot be shown in the available space.'`; persistent layout feedback outside the popup (`no-room-text` attribute). |

After 700 ms of continuous measured lack of room for a usable result row, a polite status outside the hidden popup explains why suggestions are unavailable. An offscreen editor, initial layout measurements, and brief keyboard/viewport transitions do not start that message. New feedback waits until composition ends and the quiet period completes. Localize `noRoomText`; it may describe recovery appropriate to the application without promising that scrolling can fix an authored CSS height ceiling.

This message is presentation feedback, not field validation: it does not change the accepted value, native query, focus, selection events, or description association. It clears on usable-space recovery or when the editor moves offscreen. Its measured minimum space remains reserved only for that open session, preventing centered layouts from oscillating as the message disappears; closing, exiting, disabling or disconnecting clears both text and reservation. A displayed message stays stable through brief pending remeasurement and composition. Customize its appearance through `::part(space-status)`.

Localize supplied labels/messages for the consuming application. Loading, failure and no-results messages are status content, not selectable fake options. Replace `.items` with the authoritative catalog when ready. The component supplies no fetcher, request scheduler, cache or retry service.

`en-input` reports the native query draft through `{value, isComposing, inputType}`; its `value` is text, not a project ID. The single `en-change` is synchronous, bubbling, composed and cancelable, with `{previous, proposed, reason: 'select'}`. During dispatch, `.value` and form data expose the provisional accepted ID. The query, popup and native focus are preserved until acceptance; cancellation restores the previous accepted ID and keeps the filter available. Moving the active option, opening/closing, exiting the filter and programmatic writes do not emit selection changes.

An application can own acceptance with one guarded `en-change` handler:

```js
picker.addEventListener('en-change', (event) => {
	if (event.composedPath()[0] !== picker || event.defaultPrevented) return;
	event.preventDefault();
	const next = picker.value;
	const item = picker.items.find(item => item.value === next && !item.disabled);
	if (!item || picker.disabled || picker.readOnly || picker.loading) return;
	// Apply any further application acceptance rules before this write.
	picker.value = next;
	// Update dependent application state from picker.value here.
});
```

The origin guard ignores another element's change, and `defaultPrevented` respects an earlier veto. Read the tentative ID from `.value`, cancel automatic acceptance, then assign the accepted ID through `.value`. Returning after cancellation without writing rejects the selection and retains the filter. The setter is silent, so it does not dispatch another `en-change`.

An unfinished query blocks validated submission but does not immediately paint an error. Explicit validity reporting exposes the associated error and invalid border without moving the input text.

Assigning `.value`, including the same ID exposed during the event, is authoritative and reconciles the query. That write supersedes rollback even when the event is canceled. Keep acceptance and dependent state updates in the same owner handler: later cancellation does not undo its explicit write, and rollback cannot retract external side effects from listeners that merely observe a tentative value. No separate ownership flag is needed.

For asynchronous approval, cancel synchronously before awaiting, keep the desired request identity in application state, and write only the result that is still current. A dispatched event does not mean remote work succeeded.

If a nonempty accepted ID becomes disabled or disappears from the supplied catalog, retain its ID and last known label and make the field invalid. Do not substitute another result. The application should explain the catalog change or supply an available accepted value. Restoring the item or explicitly choosing another valid item provides recovery. The accepted ID remains in `FormData` while the field is enabled; normal validated submission is blocked until validity recovers. Disabled controls and disabled fieldsets exclude their value. Constructing `FormData` directly does not run validity checks.

## Customize presentation

The field inherits the established typography, density, rhythm, color and size roles. Missing `size` means medium; `size="inherit"` is explicit. Existing field geometry includes `--en-input-inline-padding`, with `--en-control-inline-padding` taking precedence, and shared minimum/content/target constraints. Full themes and scoped overrides follow the existing optional-component fallback rules.

Public Parts are `field`, `label`, `control`, `trigger`, `popup`, `listbox`, `option`, `option-label`, `option-indicator`, `status`, `description` and `error`. A row also exposes `option-selected`, `option-active` and/or `option-disabled` when those states apply. These names are additive: an accepted keyboard candidate can expose both selected and active. They are styling surfaces, not additional state ownership or selection events.

The `--en-option-list-*` properties customize this popup independently of dialogs: `background`, `color`, `border-color`, `radius`, `padding`, `gap`, `shadow` and `max-block-size`. Applicable `--en-overlay-*` properties remain broader fallbacks. `--en-option-inline-padding`, `--en-option-block-padding`, `--en-option-radius`, `--en-option-font-weight` and `--en-option-selected-font-weight` control rows independently of the input. Unset row corners derive from the effective popup radius, padding and border. If CSS supplies asymmetric popup padding, also supply an explicit option radius.

Option colors distinguish `rest`, `selected`, `active`, `hover`, `pressed` and `disabled`: for example, `--en-option-selected-background` and `--en-option-hover-color`. Each state can refine the broad `--en-option-background` and `--en-option-color` fallback. Combined paint priority is disabled, pressed, hover, keyboard-active, selected, rest. Unset active/pressed paints fall through; default keyboard activity always retains its focus contour. The selected check remains visible even when a theme uses transparent selection fill and ordinary weight.

```css
en-combobox {
	--en-option-list-radius: 0.625rem;
	--en-option-selected-background: transparent;
	--en-option-selected-font-weight: 400;
	--en-option-hover-background: var(--en-color-surface-subtle);
}
en-combobox::part(option-active) {
	text-decoration: underline;
}
```

Managed themes use matching `component.option-list.*` and `component.option.*` tokens. Full theme scopes clear unpinned optional values; partial scopes inherit unspecified values. Internal classes, IDs, active indices and positioning properties remain private. Preserve readable field/placeholder text, visible active and selected cues, disabled distinction and target bounds under enlarged text and system preferences. See the [shared styling contract](../../../styles/README.md#option-lists-and-result-rows).

## Phones, tablets and changing viewports

Tap a result to accept it; drag the results to scroll. Selection happens on the
completed click, so a canceled gesture or list swipe does not accept a result.
The focus guard preserves the native editor without canceling touch pointer events.
Coarse-pointer defaults keep the input, arrow and result targets at least 44 CSS
pixels. Theme customization still needs review with large text and touch input.

While open, the popup follows its own window's visual viewport, including its
offset and resize/scroll events, and the input's enclosing scroll surfaces. It
uses available space above or below the input. When the input leaves the visible
viewport or neither side can fit a complete result row and popup padding, results
are temporarily hidden. The filter, accepted value and native input remain intact.
The field reports a collapsed popup and no active descendant while hidden;
Arrow keys cannot move invisible choices and Enter cannot accept one. Results
return when there is room, unless Escape, Tab or outside interaction has dismissed
the open intent. The arrow button closes visible results; when results are
temporarily hidden, it retries positioning without clearing the filter. The
component does not move page scroll or dismiss the software keyboard.

Fixed CSS positions and client rectangles can have different origins when a mobile
viewport pans ([WebKit issue 257375](https://bugs.webkit.org/show_bug.cgi?id=257375)).
The positioner measures that difference using the existing popup. Resize frames
wait for constrained geometry before displaying results and keep the popup on its
chosen side of the editor. The `popup` Part's fixed positioning and coordinate
space are owned by this controller; apply cosmetic transforms to its `listbox`
Part instead. Scaling or rotating the popup itself is not supported by the default
positioner.

An iframe's popup remains inside that document. Its own viewport measurements do
not establish how much of the iframe is visible in a parent document; applications
should give embedded editors enough space. The inline fallback remains available
where native popovers are unavailable.

A floating tablet keyboard can cover content without resizing the visual viewport.
That occlusion cannot be inferred from viewport metrics. Include floating and
split keyboards, split-screen windows and browser zoom in physical tablet review.

The dedicated Selection workflow provides a long catalog and a scrollable layout
for hands-on review. Maintained browser profiles cover phones and tablets in both
orientations, trusted taps, and Chromium touch scrolling/cancellation. Separate
mocked-viewport tests exercise both client-coordinate conventions, each resize
frame, scroll-then-delete editing and recovery. These checks do not operate
an OS keyboard or establish physical iPhone, iPad, Android, IME, VoiceOver or
TalkBack acceptance. Review those environments with their real keyboards, browser
chrome, zoom and assistive technologies before claiming support.

The active option is the current navigation destination; the accepted selection is the stored ID. They may differ while exploring. A new highlight must not imply that a project was accepted. State styling must follow the component's documented semantic roles; do not infer accepted application state from a private class or from an option's accessible navigation state.

## SSR, generated-code guidance and limits

Server rendering must receive the same `.items` and `.value` snapshot used for the first client render. The initial input displays the selected label and the popup starts collapsed. Server markup includes generated option rows alongside the native input and listbox shell; the collapsed popup remains hidden. Property-only option data is not serialized into an HTML attribute. The native input, listbox and option relationships are internal to one shadow tree. `@en-reve/ssr` renders this ordinary same-shadow structure; no breadcrumb-style child-discovery or option-projection adapter is part of this API. Hydration preserves the native input, focus, selection and any pre-hydration query without committing that query as an ID or opening suggestions. This custom picker still requires its client interaction code to choose an option; server-rendered rows do not provide a native no-JavaScript select fallback.

Agents and code generators should consult the generated Custom Elements Manifest at `@en-reve/elements/custom-elements.json` and this guide. Verify the new entry exists in the actual package build before generating imports. Use `.items` as a property, supported label/description slots, stable unique IDs and explicit event ownership. Do not invent an option tag, rich-label callback, public query/open property or arbitrary HTML result renderer.

This slice supports one accepted catalog value, local filtering and supplied status. Freeform values, multiple selection, rich options, grouping, virtualization, remote filtering and new state-ownership protocols are outside its scope. Focused Chromium, Firefox and WebKit checks cover native and fallback popup placement, form/reset behavior, keyboard/pointer paths, synthetic composition transitions, SSR/hydration and copied-example consumption. The four exact-build theme candidates also exercise selection and verify field geometry, option text contrast and active contours. Real IME, manual screen readers, physical devices and the full current-minus-one/framework matrix remain separate acceptance work.

### Optional surface motion

`--en-duration-enter` and `--en-duration-exit` default to `0ms`. Pin either independently (managed range 0–500ms in 10ms steps); `--en-ease-enter` and `--en-ease-exit` select their easing. Supporting browsers retain only visual exit paint through native `display`/`overlay` transitions. Accepted state, native modality, focus restoration and the single cancelable `en-change` keep their existing timing. A closed surface is inert; a canceled close stays usable. Reduced motion and engines without the required discrete-transition support dismiss immediately.

Native suggestions can fade in and out while the editor retains focus. Motion never translates or scales the measured popup rectangle. Pending/no-room/offscreen suspension still hides immediately; it is not a close animation. The in-flow fallback remains immediate.

These hooks animate paint, not application transactions. Do not wait for an animation event to accept a value or execute a command. Reopen, disconnect and a changed reduced-motion preference require no delayed completion callback.
