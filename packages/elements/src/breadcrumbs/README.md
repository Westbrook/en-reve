# en-breadcrumbs

A named breadcrumb landmark around original native anchors and text labels.
The component provides an encapsulated ordered list; your children retain their
content, native semantics, destinations and event listeners.

Use native `<a>` items, including in sidebar and nested-group recipes. `en-link`
contains a private shadow anchor and is not a supported replacement: its anchor
does not participate in the composite's light-DOM current-link/focus contract.
Breadcrumbs additionally requires direct native `a` or `span` entries. Keep
`href`, `aria-current`, routing listeners and rich noninteractive label content on
the authored native anchor. See [Link composition](../link/README.md).

```html
<en-breadcrumbs label="Project location">
	<a href="/projects">Projects</a>
	<a href="/projects/studio"><strong>Studio</strong> studies</a>
	<span aria-current="page">Cover image</span>
</en-breadcrumbs>
<script type="module">
	import '@en-reve/elements/define/breadcrumbs.js';
</script>
```

Resolve the package name through your application's import map or module tooling.
For explicit registration, import `EnBreadcrumbs` from
`@en-reve/elements/breadcrumbs.js`; class imports do not register the tag.

## Native content and updates

Supply direct HTML `a` or noninteractive `span` children in ancestor-to-current
order, including in RTL. An anchor without `href` retains its native non-link
behavior. Whitespace and comments between entries are ignored; put visible text
inside an anchor or span. Rich label content is ordinary authored DOM, so native
JavaScript and framework templates need no Lit values or renderer callbacks.
Authors remain responsible for valid noninteractive phrasing; the component is
not an HTML validator or sanitizer.

Use native `href`, `target`, `rel`, `download`, event listeners and
`aria-current="page"` or `"location"` on your own children. The component neither
infers a current crumb nor changes native navigation attributes. Projection may
add its reserved slot metadata as described below. For a new browsing context,
author your intended relationship, such as `rel="noopener"`. Native activation,
modified clicks, browser history and synchronous click cancellation retain their
normal behavior. No custom selection/change events, router or extra host Tab
stop are introduced.

Your framework can add, remove, reorder and update these nodes normally. Retained
nodes keep their internal wrapper identity. Replacing a node produces a new item;
removal/focus continuation policy belongs to the application. Changes within a
rich label, to `href` or to `aria-current` operate directly on that native node.
The component does not copy its text or install subtree observers for those edits.

The `label` attribute/property names the internal navigation landmark and defaults
to `Breadcrumbs`; supply a contextual, localized name. The inherited `size` API
uses medium without an attribute; `small`, `large` and explicit `inherit` remain
available. The former `.items` property and `BreadcrumbItem` element type have
been removed. Arrays can be rendered into the same native child structure using
ordinary framework iteration or DOM creation.

## Styling and visibility

Public CSS parts are `base`, `list`, `item` and `separator`. Link and label content
is consumer-owned light DOM, so there are no `link` or `label` parts. Use ordinary
selectors for your anchors and their rich descendants; use parts for the private
landmark/list/wrappers. Slotted content remains subject to application CSS.

The component adopts the shared token-backed styles internally. Supported
properties include `--en-navigation-gap`, `--en-navigation-color` and
`--en-navigation-active-color`, together with shared theme/typography tokens.
Direct native links get link/focus affordances; non-link anchors and spans retain
plain-label presentation. No document stylesheet is needed for the internal list.

Ordinary native `hidden` on a direct entry also hides its stable wrapper. Revealing
it restores the same node, and separators reflect preceding visible entries.
`hidden="until-found"` is currently unsupported: applying hidden to its wrapper
would prevent the intended browser find behavior. Entry visibility changes are
observed without removing or cloning the original child.

## Projection ownership and diagnostics

Do not author, remove or replace `slot` attributes on direct breadcrumb children.
The component reserves them for named SSR projection. A conflict produces a
visible diagnostic and is not silently overwritten. Likewise, do not author or
edit the private SSR projection metadata on the host. Consumers supply no plan,
count, generated key, or second source of link data.

Direct child additions/removals and direct `slot`/`hidden` changes are observed.
Initial or newly inserted significant direct text is diagnosed; changing the data
of an already existing whitespace text node is outside that observation boundary.
Observers and still-owned projection attributes are released on disconnection.
Reconnection restores projection over the current original children.

## SSR and shared building blocks

With explicit component registration, ordinary `renderToString` from
`@en-reve/ssr` automatically derives projection from the authored children and
renders a meaningful native ordered path. Hydrate with the same authored
children and properties. The adapter adds private mapping metadata; there is no
public element method or property for preparing that mapping.

Server-created roots use named slots and keep that mode during hydration.
Newly created client roots use manual assignment. Both use the same native
list template and preserve original child nodes. The adapter finalizes its
buffered component output before delivery; this is not a streaming-boundary API
or automatic integration with every framework's SSR renderer. Client-only native
children remain ordinary content before upgrade; complete ordered-list semantics
come from the enhanced component or server-rendered shadow root.

The layers are separately reusable:

- `BreadcrumbsProjectionController` from `@en-reve/primitives/interactions/breadcrumbs-projection.js` owns projection and cleanup.
- `breadcrumbsTemplate` from `@en-reve/primitives/templates/breadcrumbs.js` renders the canonical ordered structure from the controller's view.
- `navigationStyles` and `breadcrumbHostStyles` from `@en-reve/styles/navigation.js` supply token-backed presentation.

The older `breadcrumbTemplate` native recipe remains available from
`@en-reve/primitives/templates/navigation.js` for direct Lit composition. The
public element no longer takes its data-array interface.

Focused component and adapter receipts retain their exact source/build/browser
scope and cover the installed Chromium, Firefox and WebKit engines. Manual
screen-reader testing has not been run for this change. Physical-device testing
and the full current-minus-one browser/framework matrix remain pending.
Automatic overflow menus and nested navigation remain separate pattern work.
