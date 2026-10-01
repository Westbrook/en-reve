# en-color-field

A labeled native color input owns the accepted six-digit sRGB hexadecimal value, editing draft, validation, and form submission. The browser supplies the picker UI.

```html
<en-swatch id="accent-sample" color="#2457d6" label="Choose accent color"></en-swatch>
<en-color-field for="accent-sample" label="Accent color" name="accent" value="#2457d6"></en-color-field>
```

Use the named `description` slot for supporting text with emphasis or a help link. It replaces the `description` attribute/property while content is assigned; removing it restores the fallback. The description is associated with the native color input and stays separate from its label and any external picker trigger. The shared [native field contract](../forms-private/README.md) applies.

Keep inline text, formatting, and links together inside one element with `slot="description"`, such as a `span`. Multiple directly assigned description elements render as separate help blocks.

`for` is an optional literal ID, also available as the `.for` property. It connects a native `button`, `en-button`, or `en-swatch` in the field's own Document or ShadowRoot. The shared reference resolver handles late insertion, replacement, ID changes, and reconnection without looking through another shadow root. Removing or changing the reference detaches the old listener.

The native input remains visible, labeled, focusable, and usable. The external trigger is an additional way to request its picker. Give that trigger an action name. `en-swatch` renders only its sample and does not copy anything by default.

Let one application handler accept the color and update its preview together:

```js
const field = document.querySelector('en-color-field');
const sample = document.querySelector('#accent-sample');
field.addEventListener('en-change', (event) => {
  if (event.composedPath()[0] !== field || event.defaultPrevented) return;
  event.preventDefault();
  const next = field.value;
  // Apply any application acceptance rules here; return to reject the change.
  field.value = next;
  sample.color = field.value;
});
```

The handler reads the provisional color through the field's `.value`, cancels automatic acceptance, then accepts it with an authoritative `.value` write. Read back that accepted value for the swatch's `.color`. Both property writes are silent, so this does not dispatch another `en-change`. Returning after cancellation without writing rejects the change and leaves the preview unchanged.

Use this handler as the application's acceptance point. Its explicit write takes precedence even if another listener later cancels the event. A listener that merely copies a provisional color into the preview cannot rely on the component to undo that external side effect.

The field does not mutate the external trigger's color, name, disabled state, or accessibility attributes. A canceled click or canceled swatch `en-action` prevents picker activation. Explicitly disabled triggers and disabled fields do not request a picker. Binding a native button suppresses its form-submit default; specify `type="button"` for predictable behavior before hydration too.

## Programmatic activation

`showPicker(): void` synchronously attempts the native input's `showPicker()` method. Call it directly from a user activation, before awaiting work. When the method is unavailable or throws, the field focuses and clicks its visible native input as a fallback. No further attempt follows a successful return, which could otherwise open the picker twice.

Returning does not prove that the picker displayed. There is no observable open/close lifecycle, no `open` or `aria-expanded` state, and no automatic focus restoration on color changes. The HTML algorithm permits no-op outcomes, and support for the generic method does not prove support for the color input on every platform. The native control remains the recovery path. [HTML picker requirements](https://html.spec.whatwg.org/multipage/input.html#dom-input-showpicker), [MDN showPicker documentation](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/showPicker).

Current MDN compatibility data records a color-specific iOS limitation. Embedded webviews, OS pickers, and assistive-technology use need platform review; do not hide the native control based only on method detection. [MDN browser compatibility data](https://github.com/mdn/browser-compat-data/blob/main/api/HTMLInputElement.json).

## State and rendering

`en-input` reports native drafts. The single bubbling, composed, cancelable `en-change` exposes the provisional accepted color through `.value` and form data while listeners run; its detail contains `{previous, proposed, reason}`. Cancel synchronously to restore the previous accepted color while preserving the native editing draft. An explicit `.value` write, including the same value, is authoritative and supersedes that rollback. A picker request alone changes no color and emits no value event. Direct `.value` writes update accepted state silently. Native form reset restores the initial value unless the application cancels the form’s reset event; browser restoration is authoritative. There is no separate state-ownership attribute.

Synchronize the consumer's sample after direct application writes and form resets too. For a native form reset, wait until its default action and custom-element reset callbacks have completed; a next-task callback can then read the accepted value, provided the reset was not canceled. A microtask inside the `reset` event can run too early.

SSR renders the native input and swatch button before JavaScript. Hydration keeps their nodes and attaches the reference listener. JavaScript is required for external-trigger behavior; applications own fallback requirements.

## Review

Check pointer, Enter, and Space activation of the external trigger; canceled activation; the directly reachable native control; accepted and canceled edits; form reset; and reference replacement. Record actual picker display, selection, dismissal, focus return, and screen-reader output on each tested OS/browser combination. Automated invocation-boundary checks do not establish those OS-picker outcomes.
