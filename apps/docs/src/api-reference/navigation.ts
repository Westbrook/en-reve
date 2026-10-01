import { html } from 'lit';
export function navigationReference(href: (path: string) => string) {
  return html`<section class="api-section" id="api-navigation-guide" tabindex="-1">
    <h3>Nested navigation and responsive sidebars</h3>
    <p>Try the <a href=${href('/api-examples/navigation-sidebar')}>responsive workspace and complete source</a>. Native anchors own destinations, current state and modified activation. Disclosure headings only expand groups; navigation is not an ARIA menu and uses ordinary Tab order.</p>
    <p>Use native <code>&lt;a&gt;</code> items in navigation, sidebar groups and breadcrumbs. <code>en-link</code> wraps a private shadow anchor and does not participate in their light-DOM current-link and focus contract. Breadcrumbs accepts direct native <code>a</code> or <code>span</code> entries. Keep routing listeners and <code>aria-current</code> on the native anchor.</p>
    <pre><code>${`<en-navigation label="Project navigation" layout="sidebar" collapse-at="48rem">
  <a href="/overview">Overview</a>
  <en-navigation-group label="Project" open>
    <a href="/project">Project overview</a>
    <en-navigation-group label="Library" open>
      <a href="/references" aria-current="page">References</a>
    </en-navigation-group>
  </en-navigation-group>
</en-navigation>`}</code></pre>
    <h4>State and application ownership</h4>
    <p>Use localized <code>label</code> values. Group <code>open</code> is a reflected boolean; user activation first emits cancelable <code>en-change</code> with boolean previous/proposed and reason toggle (or escape for compact Escape). The open property is tentative during the listener. Accepted changes emit noncancelable <code>en-toggle</code> with <code>detail.open</code>; external native toggles emit only the terminal notification. Authoritative property writes are silent. Check <code>event.target</code> to distinguish nested groups from the outer navigation. Author group destinations as separate anchors. Do not put an interactive link inside the disclosure heading.</p>
    <p>The application sets <code>aria-current="page"</code> or <code>aria-current="location"</code>; the component does not infer a router or URL. A changed current link opens its ancestor groups. <code>navigation.revealCurrent()</code> explicitly restores that branch after manual collapse without moving focus or opening the compact sidebar. Authored <code>hidden</code> content stays hidden; removing hidden from the current link restores its branch. Add or remove direct links and nested groups without rebuilding the navigation.</p>
    <h4>Responsive behavior and initial delivery</h4>
    <p><code>layout="sidebar"</code> makes links vertical. Optional <code>collapse-at</code> accepts a CSS viewport length, such as <code>48rem</code>. At or below it, a native summary controls the inline navigation panel; above it the panel is always expanded. The navigation’s <code>open</code> property retains the compact preference across resize. One set of authored nodes remains mounted. Escape closes the compact panel and restores summary focus. Narrowing while focus is inside keeps it open; widening while its summary is focused moves focus to the current visible link or first available control.</p>
    <p>Navigation and navigation-group expose <code>requestOpen(boolean)</code>: a vetoable proposal with reason api and a ChangeOutcome result. Accepted requests produce the existing terminal en-toggle notification. Direct open assignments remain silent. Navigation open retains its compact state even in the expanded wide layout.</p>
    <p>Without JavaScript, server-rendered responsive navigation is expanded and its native disclosure remains usable. Hydration measures the viewport and applies compact state; set <code>open</code> to retain expansion on first mobile load. Render the active ancestor groups open on the server to expose deep links before hydration. Groups remain native details/summary controls. An application needing a modal sidebar can compose the same navigation inside <code>en-drawer</code> instead.</p>
    <h4>Styling</h4>
    <p>Navigation exposes <code>base</code>, and in responsive mode <code>disclosure</code> and <code>control</code>. Groups expose <code>base</code>, <code>control</code> and <code>content</code>. Native anchors remain authored light DOM, styled with ordinary selectors. Shared <code>--en-navigation-*</code> tokens control gap, colors, current background, border and radius; <code>--en-navigation-indent</code> controls group indentation. Logical spacing supports RTL. Hover styling is restricted to hover-capable devices.</p>
  </section>`;
}
