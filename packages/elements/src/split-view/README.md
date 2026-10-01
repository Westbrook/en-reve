# en-split-view

Two resizable panes with an owned separator. The selective definition entry registers the split view, its internal splitter and its collapse/restore buttons.

```html
<script type="module">
  import '@en-reve/elements/define/split-view.js';
</script>
<en-split-view label="Resize editor and preview" value="50">
  <section slot="primary">Editor content</section>
  <section slot="secondary">Preview content</section>
</en-split-view>
```

`value` is the primary pane percentage, defaulting to 50. Numeric `min`, `max`, and `step` default to 10, 90, and 1. `orientation="horizontal"` places panes beside one another; `vertical` stacks them and needs an authored block size. The contained separator uses the corresponding divider orientation. Keyboard arrows, Shift, Home/End, pointer resizing, RTL, and `disabled` retain the splitter behavior.

The split view dispatches one bubbling, composed, cancelable `en-change` containing `previous`, `proposed`, and `reason` (`keyboard` or `pointer`). Its `value` already contains the tentative percentage while listeners run. Pane geometry and the private separator update after acceptance. Cancel synchronously to restore the previous percentage. A proposal is rechecked against the current bounds and disabled state after dispatch.

```js
const split = document.querySelector('en-split-view');
split.addEventListener('en-change', event => {
  if (event.target !== split) return;
  if (event.detail.proposed > maximumEditorShare) event.preventDefault();
});
```

Public `value` writes are silent and authoritative, including equal writes. They supersede rollback or remaining default work, as does an accepted nested transaction. Cancel before awaiting asynchronous approval, then apply only a still-current result. `en-change` is tentative, not a guaranteed committed notification; there is no second event. The former `controlled` mode and `en-request-change` event are removed.

The private splitter delegates its action directly to the owner before any standalone dispatch. Both capture and bubble observers therefore receive the parent transaction without a second child change. The owner connection uses no public attribute, property, event, or DOM discovery by consumers. Disconnecting removes that connection; reconnecting restores it.

## Collapse and restore

`collapsible="none|primary|secondary|both"` opts panes into user collapse (default `none`). `collapsed="none|primary|secondary"` controls visibility independently. `value` always retains the expanded primary percentage, clamped by current bounds. Switching the collapsed pane restores the other. No content is removed or cloned; a hidden pane is `hidden` and `inert`.

`collapse(pane)`, `restore()` and `toggle(pane)` request changes and return `committed`, `canceled`, `unchanged` or `superseded`. The bubbling, composed, cancelable **`en-collapse`** carries `{previous, proposed, reason}`. Values are `none`, `primary` or `secondary`; reasons are `keyboard`, `button` or `programmatic`. The getter exposes tentative state during dispatch; geometry and focus wait for acceptance. Cancel synchronously to retain the prior state. Check `event.target` in nested views. Direct `collapsed` and `value` writes are silent and authoritative, including equal writes, and supersede a pending transaction. Accepted nested work wins as well. Cancel before asynchronous approval and apply only a still-current result. Neither event is a committed notification.

```html
<en-split-view collapsible="primary" primary-label="Navigation" value="30">
  <nav slot="primary">Navigation content</nav>
  <main slot="secondary">Workspace content</main>
</en-split-view>
```

Visible small secondary buttons live outside the panes. Enter on the owned separator collapses primary when eligible, otherwise secondary. The separator hides while collapsed; the Restore action remains reachable. Hiding a focused descendant or separator moves focus to Restore. Restoring leaves focus on that action; if it disappears because the pane is not user-collapsible, focus moves to the restored pane. An authoritative collapse while disabled recovers focus into the remaining pane; `disabled` otherwise prevents button, keyboard and method requests, but never author writes. An author-collapsed pane gets a restore action even when `collapsible="none"`.

Use `primary-label`, `secondary-label`, `controls-label`, and localized `collapse-label`/`restore-label` templates containing `{pane}`. Default pane names are “Primary pane” and “Secondary pane”. The `label` property continues to name the separator.

Slots are `primary` and `secondary`. Parts are `base`, `primary`, `secondary`, `separator`, `controls`, `primary-action`, `secondary-action`, `primary-toggle`, and `secondary-toggle`. The action Parts expose button hosts; toggle Parts expose their native surfaces. Built-in buttons follow theme tokens. Consumers may restyle/reposition the controls or invoke methods from external controls; keep a reachable restore action if hiding the built-in controls. Use public APIs rather than querying the private handle.

Responsive orientation, automatic collapse and persistence across navigation remain application-owned. Change `orientation` without replacing slotted nodes. Give vertical layouts an explicit block size. SSR honors the authored visibility; JavaScript enables resizing and visibility controls. Keep essential panes expanded for no-JavaScript access. Physical mobile and screen-reader acceptance remain manual review, separate from automated browser checks.
