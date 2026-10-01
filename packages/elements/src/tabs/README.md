# en-tabs

Switch among persistent panels with a native tab interaction model. Each `en-tab` and `en-tab-panel` pair has the same unique `value`. Tabs use `slot="tab"`; panels use `slot="panel"`. Supply a concise group `label`.

```html
<script type="module">
  import '@en-reve/elements/define/tabs.js';
  import '@en-reve/elements/define/tab.js';
  import '@en-reve/elements/define/tab-panel.js';
</script>
<en-tabs id="project-tabs" label="Project information" value="overview">
  <en-tab slot="tab" value="overview" id="overview-tab" role="tab"
    aria-controls="overview-panel" aria-selected="true" tabindex="0">Overview</en-tab>
  <en-tab slot="tab" value="activity" id="activity-tab" role="tab"
    aria-controls="activity-panel" aria-selected="false" tabindex="-1">Activity</en-tab>
  <en-tab-panel slot="panel" value="overview" id="overview-panel" role="tabpanel"
    aria-labelledby="overview-tab" tabindex="0">Project overview.</en-tab-panel>
  <en-tab-panel slot="panel" value="activity" id="activity-panel" role="tabpanel"
    aria-labelledby="activity-tab" tabindex="0" hidden>Recent activity.</en-tab-panel>
</en-tabs>
```

Author stable IDs and initial roles, relationships, selection, and hidden state for server rendering, as above. Client reconciliation preserves authored IDs. Client-generated IDs are a convenience, not an SSR identity mechanism.

`value` is a string property/attribute. Initial client discovery silently selects the first enabled tab only when no explicit value was supplied. Any public property/attribute assignment, including `value=""`, suppresses that fallback. Initialization and author writes do not emit change events.

`orientation` is `horizontal` by default or `vertical`. Arrow keys move along that orientation, respecting RTL for horizontal tabs; Home/End reach the first/last enabled tab. `activation="automatic"` selects when arrows move focus. `activation="manual"` moves focus without selecting until Enter/Space. Disabled tabs are skipped.

User selection dispatches one bubbling, composed, cancelable `en-change` with `previous`, `proposed`, and `reason` (`pointer` or `keyboard`). During dispatch, `value` is the tentative selected key. Panel visibility and selected semantics remain at the previous presentation until the event settles. Cancellation restores the previous key without undoing keyboard navigation focus.

```js
const tabs = document.querySelector('#project-tabs');
tabs.addEventListener('en-change', event => {
  if (event.target !== tabs) return;
  if (hasUnsavedWork) event.preventDefault();
});
```

Explicit `value` writes are silent and authoritative, including equal writes. They supersede remaining default work or rollback, as does an accepted nested transaction. For asynchronous decisions, cancel before awaiting and author-write only a still-current result. `en-change` is tentative, not a guaranteed committed notification; there is no second event. The former `controlled` mode and `en-request-change` event are removed.

Parts are `base`, `tab-list`, and `panels`; individual tab/panel elements own their own public parts. `size` follows the shared medium default and explicit `inherit` policy. This migration's browser verification is pending integration; no additional SSR or assistive-technology coverage is claimed.

The focused tab paints above neighboring tabs, wrapped tab rows and the panel surface. This stacking is isolated within the tabs component so it does not elevate tabs above page overlays. Outward focus contours remain unclipped; consumer overflow clipping or separate application stacking contexts still belong to the consuming layout.
