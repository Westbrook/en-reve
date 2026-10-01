# en-splitter

A focusable separator that changes a numeric percentage. Use it with a containing layout that applies its value; `en-split-view` provides the two-pane composition and owns its internal splitter.

```html
<script type="module">
  import '@en-reve/elements/define/splitter.js';
</script>
<en-splitter label="Resize preview" value="50" min="10" max="90"
  orientation="vertical"></en-splitter>
```

`value`, `min`, `max`, and `step` are numeric properties/attributes; defaults are 50, 10, 90, and 1. Bounds remain within 0–100. `orientation="vertical"` means a vertical divider whose left/right movement changes the value. `horizontal` means an up/down divider. Arrow keys use one step, Shift uses ten steps, and Home/End reach the bounds. Horizontal movement respects RTL. Pointer dragging uses the handle's parent as the resize extent. `disabled` disables interaction and removes the handle from sequential focus.

A standalone splitter dispatches one bubbling, composed, cancelable `en-change` with `previous`, `proposed`, and `reason` (`keyboard` or `pointer`). Its `value` already exposes the tentative percentage during the event. The accepted separator semantics update after settlement. Cancel synchronously to restore the previous value. If a listener changes bounds or disables the splitter, the proposal must still satisfy those constraints before acceptance.

```js
splitter.addEventListener('en-change', event => {
  if (event.target !== splitter) return;
  if (event.detail.proposed < minimumAllowedPreview) event.preventDefault();
});
```

A public `value` assignment is silent and authoritative, including an equal assignment. Such a write or an accepted nested transaction supersedes the outer transaction's remaining work. Cancel before awaiting asynchronous approval, then apply only a still-current result. `en-change` is a tentative decision point; a listener must not assume acceptance or perform irreversible commit-dependent effects before settlement. There is no second event. The former `controlled` mode and `en-request-change` event are removed.

The splitter inside `en-split-view` delegates privately and does not emit a second event, including during capture. Listen to the split view and author its value. This owner connection is not a public splitter API.

Parts are `base` and `grip`. `size` defaults to medium without an attribute and supports explicit `inherit`. This migration's browser verification is pending integration; it does not claim additional pointer, keyboard, or assistive-technology coverage.
