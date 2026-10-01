# Segmented control

`en-segmented-control` presents a compact selection among named alternatives, such as Light/Dark appearance. It uses native radios in one shadow tree, with a fieldset/legend label. Use `en-switch` for a stable on/off setting instead. Entering focus or changing layout never selects a new value.

```js
appearance.items = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
appearance.value = 'light';
```

```html
<en-segmented-control name="appearance" value="light" label="Appearance">
  <span slot="label">Display appearance</span>
  <span slot="description">Choose the appearance for <strong>this workspace</strong>.</span>
</en-segmented-control>
```

## Authored choices

```html
<en-segmented-control name="appearance" label="Appearance" value="light">
  <en-segmented-item value="light"><strong>Light</strong></en-segmented-item>
  <en-segmented-item value="dark">Dark</en-segmented-item>
</en-segmented-control>
```

Import `@en-reve/elements/define/segmented-control.js` to register the group and its descriptor. One or more direct `en-segmented-item` children take precedence over `.items`; removing all restores the authored array. `.items` continues to return that fallback array. The parent owns one native radio group in its shadow tree, one form entry and the sole accepted `value`. A descriptor adds no host Tab stop, radio or form entry.

Each descriptor requires a unique nonempty `value`. Supply noninteractive phrasing content, such as text, emphasis or a decorative icon; an unused default slot falls back to its `label` attribute. Do not include links, buttons, editable content, custom interactive controls or tab stops. The descriptor root must not carry `tabindex`, active `contenteditable`, `inert` or `aria-hidden="true"`; use `hidden` to make a choice unavailable. Original label nodes remain in the consumer's tree and are projected into the native radio's wrapping label. Do not author descriptor `slot` attributes: the renderer/controller owns and releases the necessary private assignments. `selected` and `checked` are unsupported; set the parent's `value`.

Descriptor value/disabled/label attributes and properties, text, addition, removal and reordering update the catalog. A label update or reorder retains its native radio and original label nodes. `hidden` excludes the choice from navigation and submission; `hidden="until-found"` is unsupported. Changing, disabling, hiding or removing a proposed item during `en-change` prevents that obsolete proposal from committing. Invalid descriptor metadata produces a diagnostic and does not reveal the `.items` fallback.

Direct child additions, removals and moves update the choices without changing the parent's accepted value. Pasting rendered item HTML or cloning an item also works when each value remains unique: copied generated slot names are treated as stale projection metadata and reassigned by the receiving group. Arbitrary authored slots and changes to a connected item's owned slot remain errors.

The named `label` slot falls back to the `label` attribute. `.items` is a property-only readonly array of `{value, label, disabled?}` records; supply two or more alternatives with unique nonempty values, and replace the array to change it. `value` is the accepted string selection. The shared `size` contract is `inherit | small | medium | large`; `medium` is the default without requiring an attribute, and `inherit` explicitly opts into the surrounding scope. Styles use shared token-backed roles and Parts, with private internal markup.

The named `description` slot replaces the `description` attribute/property fallback while content is assigned. Removing that content restores the fallback. Supporting phrasing markup and help links remain separate from the legend and radio labels; the text describes the group, and links keep their own keyboard behavior. Description content does not become an item or change selection.

Keep inline text, formatting, and links together inside one element with `slot="description"`, such as a `span`. Multiple directly assigned description elements render as separate help blocks.

The outer frame uses the same control-radius token as `en-select`, including its size selection and the shared `--en-control-radius` override. Inner choice corners subtract the frame padding and border from that radius, clamped to zero. At the default rhythm, small, medium/omitted, and large have outer radii of 7px, 8px, and 10px; density does not change them. Set `--en-control-radius` to a single nonnegative length to customize both the frame and its derived inner corners. Use `::part(options)` and `::part(option)` together for independently shaped corners.

`en-change` is synchronous, bubbling, composed and cancelable, with `{previous, proposed, reason}`. Reasons are `select`, `keyboard`, and eligible pre-hydration adoption via `hydrate`. During the event, `value`, native checked state and form data expose the proposed selection. Cancellation restores the previous selection and retains focus on the explored choice; an uncanceled event accepts it. Programmatic writes are silent and authoritative. A synchronous same-value write or a nested accepted change supersedes the original transaction, even when the outer event is canceled. Cancellation must happen synchronously; asynchronous approval cancels immediately and assigns `value` later. Application effects must account for the tentative event state.

One enabled radio is the group's Tab entry. The entry is normalized to the accepted enabled choice, otherwise the last eligible focused choice or the first enabled option. Arrow keys wrap and skip disabled options; horizontal arrows follow text direction. Home/End select the first/last enabled choice. Space selects the focused choice. This intentionally defines one entry even when no option is selected; native browser reverse-Tab behavior for empty groups can otherwise differ.

The host participates in forms through ElementInternals. `name` supplies one form entry; disabled fields and missing/disabled selected options submit no value. Reset restores the host's `value` attribute; browser restoration writes authoritative state. An application that owns reset cancels the form's native `reset` event before assigning its desired values.

If the selected option is disabled or removed, the accepted property remains unchanged. A present disabled option retains its truthful checked state; enabled choices remain keyboard-operable. The host submits no entry for that unavailable selection, and `required` validation fails until an enabled choice matches the value. No alternative is silently chosen. This is an explicit library policy, rather than a claim that disabled native-radio required validation uses the same algorithm.

Use the form's native validation flow or `reportValidity()` to expose a required-selection error; `validation-text` supplies the localizable message and validation focuses an enabled choice. Applications can use `description` to explain why an accepted choice became unavailable, including on optional fields. Selecting an available choice clears the previous checked state and restores its form entry.

Disabled radios temporarily omit their internal native name. This avoids WebKit skipping every enabled option when the same native group contains a checked disabled radio. The name is restored on re-enable. The fieldset/legend, individual labels, checked and disabled states remain present. Native group membership changes for the disabled radio, so real assistive-technology review of position/group-count announcements remains pending. Browser tests cover the actionable keyboard path and capture accessibility/grouping evidence.

For the `.items` path, server rendering consumes the same items/value snapshot and emits only the selected radio's boolean `checked` attribute. Hydration must supply the same property-only items snapshot before upgrade/render; it is not serialized through an HTML attribute. Checked state uses boolean attribute binding because a string attribute such as `checked="false"` still checks an HTML radio. Browser reconciliation subsequently updates the live inputs.

Focused browser tests live with the choice fixtures under `../checkbox`. They cover normal and reverse Tab, disabled skipping, RTL, Home/End, cancellation, synchronous writes, cancelable native reset ownership, FormData, required state, removal/re-enable recovery, named labels, inherited size, and normal/forced-color focus captures. These checks do not substitute for manual screen-reader review.


For authored children, `@en-reve/ssr` supplies the exact first native-radio snapshot and named label assignments while retaining the original child markup. There is no public plan/count property. Hydration first attaches to those same radios, then reconciles later child mutations. Other renderers need equivalent adapter integration.

An attribute-authored group may adopt a native radio choice made before hydration through cancelable `en-change` with reason `hydrate`; reset still restores the parent `value` attribute. Any subsequent public `.value` setter is authoritative, including an equal pre-upgrade own-property write and canonical property replay by a parent framework. Those writes are indistinguishable, so property-bound hydration restores the binding's value instead of guessing it should adopt early native state.

## Native-aligned form contract (API-03)

`defaultValue` reflects the `value` attribute; checkboxes, switches and standalone radios instead use `defaultChecked` and `checked`. Defaults update current state while pristine. A current-state assignment (including the same value), user editing or browser restoration makes it dirty. Later default changes preserve the current value/draft; uncanceled form reset restores defaults and makes it pristine again. Defaults and current-state writes are silent. Numeric defaults retain the component's existing clamp/snap rules.

All form-associated controls expose `form`, `labels`, `validity`, `validationMessage`, `willValidate`, `checkValidity()` and `reportValidity()`. `name`, supported `required`, and `disabled` reflect. Set `error` to invalidate a value for an application rule and show associated `::part(error)` feedback. Clear it explicitly with `error = ''`; reset does not clear application errors. `validationText` changes existing constraint feedback only. A zero rating is a defined score; sliders and ratings do not gain a `required` constraint.

## Joined presentation

Theme companions can select the code-owned `joined` presentation. The public `option-start`, `option-end`, `option-joined`, `option-selected`, `option-enabled` and `option-disabled` Parts describe existing labels without adding wrapper nodes. Endpoints follow **visible** choices, including hidden authored children; a single visible option has both edge Parts. Logical corners and shared borders follow RTL. Query a Part as a token (`[part~="option"]`), since one node can expose several Parts. Presentation preserves the radio/fieldset contract; it does not turn selection into toolbar commands.
