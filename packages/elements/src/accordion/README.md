# en-accordion

Group disclosure sections using one array of open item keys. Without `multiple`, opening a section closes the previous section. Closing the open section is allowed. Use unique, nonempty item values; unknown keys remain available for later children.

```html
<script type="module">
  import '@en-reve/elements/define/accordion.js';
  import '@en-reve/elements/define/accordion-item.js';
</script>
<en-accordion id="details">
  <en-accordion-item value="layout">
    <span slot="label">Layout</span>
    <p>Choose how content is arranged.</p>
  </en-accordion-item>
  <en-accordion-item value="appearance">
    <span slot="label">Appearance</span>
    <p>Choose colors and typography.</p>
  </en-accordion-item>
</en-accordion>
```

`value` is a property, such as `details.value = ['layout']`; it is not a serialized array attribute. `multiple` is a Boolean property/attribute. For an initial server render, author each item's `open` state to match the group value. The group reconciles its direct slotted items on the client; it does not discover children during server rendering.

A grouped trigger dispatches one bubbling, composed, cancelable `en-change` from the group. `detail` contains `previous`, `proposed`, and `reason: 'toggle'`. During the listener, `details.value` already contains the tentative keys. Item expansion and associated focus cleanup wait until the event settles. Grouped items do not emit an additional change event.

```js
details.addEventListener('en-change', event => {
  if (event.target !== details) return;
  if (event.detail.proposed.includes('appearance') && !canEditAppearance) {
    event.preventDefault();
  }
});
```

Cancel synchronously to restore the previous keys. An explicit `value` assignment, even with the same keys, is authoritative and silent: it supersedes the transaction's remaining default work or rollback. An accepted nested transaction also supersedes an outer transaction. Collection rollback restores contents and order; array reference identity is not guaranteed. For asynchronous approval, cancel before awaiting and apply only a still-current response through `value`.

`en-change` is a tentative decision point, not a guaranteed committed notification; there is no second event. The former `controlled` mode and `en-request-change` event are removed. Read the settled property after synchronous dispatch before performing commit-dependent effects.

The default slot accepts `en-accordion-item`; Part `base` styles the group wrapper. Child labels and content remain authored composition. `size` follows the shared medium default and explicit `inherit` policy. This migration's browser verification is pending integration; it makes no new browser or assistive-technology coverage claim.
