# en-navigation

Page or section navigation with an encapsulated, named landmark and an ordinary default slot. Author native links as children; no JavaScript data assignment or framework-specific renderer is required.

## Native HTML

Resolve bare module specifiers with your application's import map or bundler, then import this element's definition:

Use native `<a>` items, including in sidebar and nested-group recipes. `en-link`
contains a private shadow anchor and is not a supported replacement: its anchor
does not participate in the composite's light-DOM current-link/focus contract.
Breadcrumbs additionally requires direct native `a` or `span` entries. Keep
`href`, `aria-current`, routing listeners and rich noninteractive label content on
the authored native anchor. See [Link composition](../link/README.md).

```html
<script type="module">
	import '@en-reve/elements/define/navigation.js';
</script>

<en-navigation label="Workflow pages">
	<a href="/workflows.html">Sign-in</a>
	<a href="/workflows/settings.html" aria-current="page">Settings</a>
	<a href="/workflows/chat.html">Chat <strong>preview</strong></a>
</en-navigation>
```

The same native children work in HTML, React, Vue, Svelte and Lit. An application with an array of destinations can use its normal iteration mechanism to author anchors. The element has no `.items` property; its class entry no longer exports `NavigationItem` or `NavigationCurrent` types.

`label` names the internal native `nav` and defaults to `Navigation`. Supply a contextual, localized name, particularly when several navigation landmarks occur on one page. The inherited `size` API defaults to medium without a size attribute; `small`, `large` and explicit `inherit` remain available. `sticky` is a reflected boolean and defaults to false.

Class-only use is available through `import { EnNavigation } from '@en-reve/elements/navigation.js'`; this does not register the tag.

## Link and content ownership

Direct native anchors are the intended navigation items. Each anchor owns its visible and accessible name, `href`, `target`, `rel`, `download`, `aria-current` and event listeners. Use `aria-current="page"` for the current document or `aria-current="location"` for an in-document location. The element does not infer current state from order, the URL or scrolling, and does not rewrite native navigation attributes or supply a `rel` value.

Rich labels can contain valid noninteractive phrasing such as `strong`, `em` and `span`. Author content follows normal HTML rules; the slot is not a content validator or sanitizer. A native anchor without `href` retains its non-link behavior. Ordinary `hidden` content remains hidden. The element does not copy, reorder or assign projection metadata to its children; it uses a normal unnamed slot, not the breadcrumb projection controller.

Links retain native navigation, history, Enter activation, sequential Tab stops and modified/new-context activation. The host has no duplicate navigation role or tab stop. Native listeners on a link or the host work normally; synchronous `event.preventDefault()` can cancel a click. Applications taking over routing remain responsible for modifier keys, downloads, targets and other native activation rules. The component emits no custom selection/action event and owns no routing policy. Responsive disclosure manages focus only when visibility changes.

## Sticky presentation and styling

`sticky` opts the **host** into sticky presentation when `--en-navigation-position: sticky` is supplied after measuring its height; the internal landmark stays in normal flow. The optional `attachAnchorNavigation({root, navigation: host})` utility from `@en-reve/primitives/interactions/anchor-navigation.js` can measure the host and maintain document-fragment alignment. The consuming root owns target placement and offset CSS. Connect after rendering, refresh after relevant changes, and disconnect when removed. This optional utility remains separate from the element, which leaves sticky measurements to the consumer.

In flat mode the public Part is `base`, the native navigation landmark. Links and their rich descendants belong to the application and can be styled with ordinary selectors such as `en-navigation > a` and `en-navigation > a strong`; there are no `link` or `label` Parts. The shadow stylesheet provides token-backed presentation for direct anchors, while application styles can customize the owned light-DOM content. Style the host for external layout.

Supported properties include `--en-navigation-gap`, `--en-navigation-background`, `--en-navigation-border-color`, `--en-navigation-color`, `--en-navigation-active-color`, `--en-navigation-active-background`, and `--en-navigation-link-radius`. Mechanical sticky settings are `--en-navigation-position`, `--en-navigation-offset` and `--en-navigation-z-index` in the consumer's scope. No document stylesheet is required for the element's built-in presentation.

## SSR and reusable layers

Authored native anchors remain usable before the element is defined. Standard Lit SSR can additionally render the private landmark, styles and ordinary named-mode default slot into Declarative Shadow DOM. Render and hydrate the same authored content and initial properties to retain those native nodes. This element needs no child discovery, manual slot assignment, reserved attributes, item count or special SSR adapter.

The pure `slottedNavigationTemplate({label})` is independently available from `@en-reve/primitives/templates/slotted-navigation.js` for shadow-root compositions, with styles from `@en-reve/styles/navigation.js`. The separate `sectionNavigationTemplate({label, items, sticky})` data-based recipe and its types remain available from `@en-reve/primitives/templates/navigation.js`; that recipe creates native links for consumers choosing the lower-level Lit template API.

Nested groups and responsive sidebar composition are available as described below. Plain document skip links remain a separate native recipe. Browser and SSR receipts identify their exact tested artifacts and installed engines; this migration does not establish full current-minus-one, framework or physical-device coverage. Manual screen-reader testing has not been run for this change.

## Nested groups and responsive sidebar

Import `@en-reve/elements/define/navigation-group.js` alongside navigation.
Use `layout="sidebar"` for vertical links and optional `collapse-at="48rem"`
for a viewport-responsive inline disclosure. Groups accept localized `label`
and reflected `open`. Author native links or nested groups in their default slot.
Group destinations remain separate anchors; disclosure activation never navigates.

```html
<en-navigation label="Project navigation" layout="sidebar" collapse-at="48rem">
  <a href="/overview">Overview</a>
  <en-navigation-group label="Project" open>
    <a href="/project" aria-current="page">Project overview</a>
  </en-navigation-group>
</en-navigation>
```

Changing a non-hidden current link opens its ancestor groups. Explicitly closed
groups remain closed until current state changes or `revealCurrent()` is called.
Neither this method nor current-link observation changes focus, routing, hidden
attributes or compact expansion. The first non-hidden current anchor is used;
authors should supply only one current destination per landmark.

Compact `open` state is independent of the always-open wide layout. Escape closes
the compact panel and focuses its summary. A focused descendant keeps navigation
open when narrowing; widening a focused summary moves focus into the visible
links. The component neither clones links nor installs a modal focus trap.
User disclosure changes emit `en-toggle` with `detail.open`; property writes are
silent. Events bubble from groups, so check `event.target`.

SSR responsive navigation is expanded and usable without scripting. Hydration
measures the viewport and applies the compact preference (`open` defaults false).
Author `open` to retain expansion; render current ancestor groups open for SSR.
A native disclosure is usable before hydration; no viewport is inferred on the
server. App-owned `aria-current` should reflect deep links or router state.

The optional responsive Parts are `disclosure` and `control`, in addition to `base`.
Groups expose `base`, `control` and indented `content`. Shared navigation tokens
style links and group chrome; `--en-navigation-indent` adjusts nesting.
Links remain light DOM and ordinary selectors remain the customization surface.

User summary activation now proposes `en-change` with boolean previous/proposed
and semantic reason `toggle`; compact Escape uses `escape`. The `open` property
is tentative during the synchronous event. Veto with preventDefault; explicit
open writes and accepted nested transactions supersede older defaults/rollback.
`en-toggle {open}` remains a noncancelable terminal state notification after an
accepted proposal or an external native details toggle. Subscribe to proposals
for policy and notifications for observation; do not process both as two changes.
Author open writes remain silent. Native disclosure before upgrade remains usable.
Progress-steps compact disclosure is internal and does not promise this facet.

```ts
import type { DisclosureChangeEvent } from '@en-reve/elements/navigation.js';
function guardDisclosure(event: DisclosureChangeEvent): void {
  if (event.target !== navigation) return;
  if (!event.detail.proposed && mustStayOpen) event.preventDefault();
}
navigation.addEventListener('en-change', guardDisclosure);
```
