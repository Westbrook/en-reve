# en-accordion-item

A disclosure section with a native button, a heading, and persistent panel content. Supply a concise `label` or a named `label` slot containing noninteractive phrasing. The default slot is panel content. `heading-level` defaults to 3; choose a level that fits the surrounding document. The legacy `heading` slot remains a fallback.

```html
<script type="module">
  import '@en-reve/elements/define/accordion-item.js';
</script>
<en-accordion-item id="details" heading-level="2">
  <span slot="label">Delivery details</span>
  <p>Delivery takes two working days.</p>
</en-accordion-item>
```

`open` is a Boolean property/attribute. `disabled` prevents user toggles. `focus()` focuses the native trigger without exposing the shadow markup. Collapsing through an author write also restores focus to the trigger if focus would otherwise remain inside the hidden panel.

Standalone activation dispatches one bubbling, composed, cancelable `en-change` with `previous`, `proposed`, and `reason: 'toggle'`. The `open` property is tentative during the event; panel visibility and collapse focus cleanup wait until acceptance. Synchronous `preventDefault()` restores the prior Boolean. A public `open` write, including an equal write, is silent and authoritative and supersedes the outstanding transaction. An accepted nested transaction also supersedes it.

```js
details.addEventListener('en-change', event => {
  if (event.target !== details) return;
  if (!event.detail.proposed && hasUnsavedWork) event.preventDefault();
});
```

Inside `en-accordion`, the parent owns selection and emits the single group event with an array of keys. Set the group's `value`; do not manage the same item's open state independently. The child uses private owner delegation rather than forwarding another public event.

The former `controlled` mode and `en-request-change` event are removed. `en-change` is tentative, not a guaranteed committed notification. Cancel before awaiting asynchronous approval, then author-write only a still-current result. There is no second settled-change event.

Parts are `base`, `heading`, `control`, `indicator`, and `panel`. `size` defaults to medium without an attribute; use `size="inherit"` when surrounding size should apply. This migration's browser verification is pending integration; no new assistive-technology coverage is claimed.
