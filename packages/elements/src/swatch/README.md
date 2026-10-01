# en-swatch

A color-sample button with an application-owned action. The component displays the sample, keeps native keyboard and focus behavior, and exposes a cancelable activation request. The consumer provides surrounding labels, values, reference text, copying, picker integration, and feedback.

## Use

Resolve bare module specifiers with your application's bundler or import map. Choose one registration route:

```js
// Register only this component.
import '@en-reve/elements/define/swatch.js';
```

```js
// Or register the class explicitly.
import { EnSwatch } from '@en-reve/elements/swatch.js';
customElements.define('en-swatch', EnSwatch);
```

```html
<en-swatch token="--en-color-action" label="Copy action color CSS reference"></en-swatch>

<en-swatch color="#2457d6">
  <span slot="label">Choose accent color</span>
</en-swatch>
```

Both samples are neutral buttons. Naming an action does not implement it. Supply a full localized action name through `label` or the named `label` slot. Slotted text takes precedence over the attribute and is visually hidden inside the native button. Keep interactive descendants out of this slot. Author visible labels and values alongside the swatch where they help people understand its purpose without relying on color alone.

## Public API

| Property | Attribute | Default / meaning |
| --- | --- | --- |
| `token` | `token` | Empty; canonical generated `--en-*` color-token name. A nonempty token takes precedence over `color`. |
| `color` | `color` | Empty; CSS color used when `token` is empty. |
| `label` | `label` | Empty; full accessible action name when the named label slot is empty. |
| `disabled` | `disabled` | `false`; explicit native disabled behavior. |
| `size` | `size` | `medium`, without an initial attribute. Also accepts `small`, `large`, and explicit `inherit`. |

`focus(options)` moves focus to the native button when it is available and enabled. There is no form value, clipboard state, or `controlled` flag. Applications own accepted color changes and update the swatch's display properties.

Token names accept `--en-` followed by ASCII letters, digits, hyphens, and underscores. An invalid nonempty token leaves the fill unpainted instead of falling back to `color`. Apply the exported `@en-reve/tokens/default.css`, another generated theme, or a scoped property definition. Previewing a token reads its actual scoped value; undefined and non-color values do not silently substitute the library default.

`color` accepts browser-supported CSS colors, including hex, named colors, `rgb()`, `oklch()`, and `var()`. Declaration separators, braces, CSS escapes, and `!important` are unsupported. The browser validates the remaining color value. Invalid or unsupported colors leave the fill unpainted. Missing paint never disables a neutral action such as “Choose color,” which may let the user remedy it.

## Activation and cancellation

`en-action` bubbles and crosses the shadow boundary. Its detail is `{ action: 'activate', data: undefined }`. It is a request, not evidence that an application operation completed.

Cancel synchronously to prevent consumers of the original native click from performing their default action:

```js
swatch.addEventListener('en-action', (event) => {
  if (event.detail.action === 'activate' && applicationCannotProceed()) {
    event.preventDefault();
  }
});

swatch.addEventListener('click', (event) => {
  if (event.defaultPrevented) return;
  // Perform the application action once, while user activation is available.
});
```

Canceling `en-action` calls `preventDefault()` on the originating click before it bubbles to the host; propagation continues. Calling `preventDefault()` after an `await` is too late. Consumers should use one action path to avoid handling both `en-action` and `click` as separate activations.

For a token-copy experience, the consumer derives `var(--en-color-action)` from its known token, invokes `navigator.clipboard.writeText()` directly during the accepted click, and owns pending work, stale-result handling, and localized feedback. Keep the exact code reference selectable outside the button for manual copying. The component itself makes no clipboard request. Clipboard availability and failure handling belong to that consuming experience.

For a color picker, `en-color-field` can use `for` to reference the swatch in the same tree. Its native input remains available. Use one application handler to accept a color and synchronize the sample:

```html
<en-swatch id="accent-sample" color="#2457d6" label="Choose accent color"></en-swatch>
<en-color-field for="accent-sample" value="#2457d6" label="Accent color"></en-color-field>
```

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

The field's `.value` is provisional during `en-change`. Canceling and then assigning `.value` accepts the application's decision authoritatively; the sample is updated from that accepted value. Returning after cancellation without writing rejects the change and keeps the existing sample. The guard respects earlier cancellation and ignores changes originating from another element. Explicit value writes take precedence over later cancellation, so keep acceptance and preview updates in this one owner handler.

The field's `.value` and the swatch's `.color` setters are silent: they do not emit another value-change event. Keep the swatch synchronized after other direct application writes and native form reset/restoration, too. The field owns color and form state; the swatch owns its preview and activation. See the [color-field reset guidance](../color-field/README.md#state-and-rendering) for reset timing.

## Styling and size

The default sample is square. Its dimensions use the sized `--en-size-swatch` token, optionally overridden by `--en-swatch-size`, with the shared minimum target size preserved. The host can stretch its inline axis in a consuming layout:

```css
.palette-sample { inline-size: 100%; }
.compact-sample { --en-swatch-size: 3rem; }
```

An unmarked swatch stays medium inside a differently sized parent. Use `size="inherit"` deliberately to follow the parent's size scope.

Public parts are `control`, `sample`, `color`, and `label`. `control` and `sample` identify the same native button; `color` is its decorative fill; `label` is the visually hidden action name. Internal tags and nesting remain private. In forced-colors mode, only the decorative fill preserves the inspected color. The frame and focus indicator use system colors.

## Manual QA

Record browser, OS, assistive technology, language, theme, and input method with each result.

1. Reach the sample with Tab. Confirm a visible focus indicator and a complete, localized button name for attribute and slotted labels.
2. Activate with Enter, Space, touch, and pointer. Confirm the consuming action happens once. Cancel `en-action` and verify that a click handler respecting `defaultPrevented` does nothing.
3. Check disabled behavior. Confirm missing or invalid paint still leaves an enabled action available, and replacing a valid color with an invalid one clears the old fill.
4. Review light, dark, forced-colors, narrow layouts, enlarged text, and RTL. Verify the true-color fill remains bounded by a visible frame and external text communicates the sample's purpose.
5. Check square sizing, width stretching, explicit small/medium/large, and deliberate `inherit`. Change a scoped token and confirm the corresponding sample updates.
6. For a copy consumer, confirm exact copied text, repeated announcements, retained focus, pending/stale-result handling, failure feedback, and manual copying. For a picker consumer, verify both the sample trigger and reachable native color input, then confirm accepted changes update the displayed sample.

Manual screen-reader acceptance has not been established by this document. Automated browser and accessibility checks support the work; record actual announcements and task outcomes for each tested browser/OS/assistive-technology combination.
