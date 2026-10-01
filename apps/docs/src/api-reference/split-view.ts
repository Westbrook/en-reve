import { html } from 'lit';
export function splitViewReference(href: (path: string) => string) {
  return html`<section class="api-section" id="api-split-view-guide" tabindex="-1">
    <h3>Pane sizing and visibility</h3>
    <p>Try the <a href=${href('/api-examples/split-view')}>responsive navigation, content and inspector workspace</a> and its complete source. Slots keep the application’s content mounted through resizing, collapse and restore.</p>
    <pre><code>${`<en-split-view value="30" min="15" max="60"
  collapsible="primary" primary-label="Navigation" label="Resize navigation">
  <nav slot="primary">…</nav>
  <main slot="secondary">…</main>
</en-split-view>`}</code></pre>
    <h4>Independent state</h4>
    <p><code>value</code> is the expanded primary-pane percentage, including while collapsed. Current <code>min</code>/<code>max</code> bounds clamp it. <code>collapsible="none|primary|secondary|both"</code> controls offered actions; the default is none. <code>collapsed="none|primary|secondary"</code> is independent authoritative visibility. An author-collapsed pane gets a restore action even if it is not user-collapsible. Only one pane can be hidden at a time; hiding the other restores the first.</p>
    <h4>Transactions and application control</h4>
    <p><code>en-change</code> retains its numeric resizing contract. Buttons, Enter on the owned separator, and <code>collapse(pane)</code>, <code>restore()</code>, or <code>toggle(pane)</code> propose a bubbling, composed, cancelable <code>en-collapse</code>: <code>{previous, proposed, reason}</code>. Visibility values are <code>none</code>, <code>primary</code> or <code>secondary</code>; reasons are <code>button</code>, <code>keyboard</code> or <code>programmatic</code>. During listeners, <code>collapsed</code> is tentative; rendering and focus effects wait for acceptance. Cancel synchronously. The methods return <code>committed</code>, <code>canceled</code>, <code>unchanged</code> or <code>superseded</code>.</p>
    <pre><code>${`split.addEventListener('en-collapse', event => {
  if (event.target !== split) return; // Nested views own their events.
  if (mustKeepPaneOpen) event.preventDefault();
});
split.collapsed = 'primary'; // Silent, authoritative; preserves value.
split.value = 35; // Sets the retained expanded size, even while hidden.
split.restore(); // Requests restoration to that size.`}</code></pre>
    <p>Public state writes, including equal writes, supersede pending transactions. Accepted nested work also wins. Cancel before awaiting an application decision, then apply only a still-current result. There is no second committed notification. <code>disabled</code> prevents user and method requests; direct property writes remain authoritative.</p>
    <h4>Keyboard, focus and responsive layouts</h4>
    <p>The separator supports axis arrows, Shift for larger changes, Home/End and RTL. Enter collapses the primary pane when eligible, otherwise the secondary. Explicit buttons make both choices discoverable. The separator is hidden while collapsed; Restore stays outside the panes. Hiding a focused pane or separator moves focus to its Restore button. If an author collapses a disabled view, focus moves to the remaining pane instead. Restoring leaves focus on the action; Tab continues into the expanded content. If that action disappears because the pane is not user-collapsible, focus moves to the restored pane. Collapse uses hidden/inert and preserves the same slotted nodes.</p>
    <p><code>orientation="horizontal"</code> places panes side by side; <code>vertical</code> stacks them and requires an authored block size. The demo changes orientation at 48rem without replacing content or resetting state. Breakpoints, automatic collapse policy and persistence across page loads belong to the application. Server-rendered panes honor authored visibility before hydration; resize and collapse controls require JavaScript. Essential content should remain expanded when no-JavaScript access is required.</p>
    <h4>Localization and styling</h4>
    <p><code>primary-label</code>, <code>secondary-label</code>, <code>controls-label</code> and the <code>collapse-label</code>/<code>restore-label</code> templates (with <code>{pane}</code>) name the controls. Parts include <code>base</code>, <code>primary</code>, <code>secondary</code>, <code>separator</code>, <code>controls</code>, <code>primary-action</code>/<code>secondary-action</code> button hosts, and exported <code>primary-toggle</code>/<code>secondary-toggle</code> native button surfaces. Buttons use the shared small secondary theme styling. Consumers can reposition the control group via Parts or provide external buttons using the public methods. Keep a visible, reachable restore action whenever hiding the built-in controls.</p>
  </section>`;
}
