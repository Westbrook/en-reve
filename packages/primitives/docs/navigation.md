# Navigation elements and native recipes

Use `en-navigation` and `en-breadcrumbs` as the primary component APIs. Both own a
named native navigation landmark around authored native children. `en-navigation`
uses an ordinary default slot for links; `en-breadcrumbs` projects links and plain labels
into a private ordered list. Pure Lit data recipes remain public lower-level building
blocks. Skip links remain native document recipes.

## Primary element consumption

```html
<en-navigation label="Workflow pages">
	<a href="/workflows">Sign-in</a>
	<a href="/workflows/settings" aria-current="page"><strong>Design</strong> settings</a>
	<a href="/workflows/chat">Chat</a>
</en-navigation>
<en-breadcrumbs label="Project location">
	<a href="/projects">Projects</a>
	<a href="/projects/studio"><strong>Studio</strong> studies</a>
	<span aria-current="page">Cover image</span>
</en-breadcrumbs>
<script type="module">
	import '@en-reve/elements/define/navigation.js';
	import '@en-reve/elements/define/breadcrumbs.js';
</script>
```

Resolve package names through the consuming application's import map or module tooling.
The `label` attribute names each element's internal navigation landmark. Neither element
infers the current location or introduces a router, selection event or extra host Tab stop.

### Authored page and section links

Supply native `<a>` children in the default slot of `en-navigation`, in the intended
reading and keyboard order. Rich labels are ordinary noninteractive phrasing, such as
emphasis or a decorative icon with visible text. Do not nest buttons, inputs or other
links inside an anchor. The component is not a content validator or sanitizer.

Each native child owns its `href`, `aria-current`, `target`, `rel`, `download` and event
listeners. Author `aria-current="page"` or `"location"` where appropriate; no current
link is inferred from the URL or position. The component does not add a `rel` value or
rewrite URLs. Native activation, modified clicks, synchronous click cancellation and
browser history remain native. Each link stays in normal Tab order without arrow-key
selection or an extra host stop.

The public host surface is `label`, boolean `sticky` and inherited `size` (medium by
default, with small/large and explicit inherit). The only CSS Part is `base`, its private
native landmark. There are no `link` or `label` Parts: use ordinary selectors to style
your own anchors and rich descendants. The element supplies token-backed baseline
presentation and focus affordances while application CSS can customize the light DOM.
Positioning belongs to the host; pass it as the alignment utility's `navigation` argument.

The former element `.items` property and element-level `NavigationItem`/`NavigationCurrent`
exports are removed. Render an array into native children using normal framework iteration
or DOM creation if needed. The pure `sectionNavigationTemplate({ label, items, sticky })`
recipe and its item types remain unchanged; that separate API still renders data into markup.

The reusable `slottedNavigationTemplate({ label })` from `templates/slotted-navigation.js`
renders only the private landmark and default slot. The client and normal Lit server
renderer use native named slot assignment. Direct
anchors need no `slot` attribute, generated key, item count or mapping metadata; there is
no navigation projection controller or custom mapping adapter. Author the same children
and host properties for server rendering and hydration. Native links are available in
initial HTML and retain their identity/listeners through hydration. Updates act on those
native nodes; focus continuation after consumer removal/replacement/reordering remains
the application's responsibility. A framework-specific hydration path still needs its own
integration evidence. See the [SSR integration](../../ssr/README.md).

### Authored breadcrumb children

`en-breadcrumbs` has no `.items` property. Supply direct native HTML `<a>` or noninteractive
`<span>` children in ancestor-to-current order, including in RTL. Rich inline content is
ordinary authored DOM: native JavaScript and framework templates can create or update
it without a Lit value or renderer callback. Whitespace/comments between entries are
ignored; put visible text inside an anchor or span. Keep their descendants valid
noninteractive phrasing rather than nesting links, buttons or controls. The component
does not validate or sanitize arbitrary rich content.

The application owns each child's `href`, `target`, `rel`, `download`, `aria-current` and
event listeners. Native clicks, synchronous cancellation, modified activation and browser
history remain native. The component neither rewrites destinations nor adds `rel` values;
author the intended relationship yourself, such as `rel="noopener"` for a new context.
A link without `href` retains its native non-link behavior. The current crumb may be a link
or a span; explicitly supply `aria-current="page"` or `"location"` where appropriate.

Original nodes are projected rather than copied. Updating a label, link attribute or
listener operates on the same native node. Retained children keep stable list wrappers;
replacing/removing a child and the resulting focus continuation remain the application's
responsibility. Node preservation is not a promise to repair focus after every authored
reorder or framework replacement.

The element's supported Parts are `base`, `list`, `item` and `separator`. Its landmark,
ordered-list wrappers and decorative separators remain private Shadow DOM. There are no
`link` or `label` Parts because those nodes belong to the application. Use normal selectors
to customize your links and rich descendants; the component supplies token-backed baseline
link/focus affordances and list layout. Slotted content remains subject to application CSS.
No document stylesheet is required for the internal list. Native skip links and
`.en-navigation-target` destinations still use the public recipe stylesheet.

Ordinary `hidden` on a direct child also hides its wrapper; separators follow the visible
path and revealing an entry retains its node. `hidden="until-found"` is unsupported.
Do not author, remove or replace direct-child `slot` attributes, including `slot=""`,
or author/edit the host's private SSR projection metadata. These are adapter-owned
mechanics, not a second public source of breadcrumb data. Unsupported direct entries
and conflicting projection attributes produce diagnostics rather than silent rewrites;
the component README defines the exact observation boundary.

### Breadcrumb SSR and hydration

New client-created breadcrumb roots use manual slot assignment. For server rendering,
register the component and use `renderToString` from `@en-reve/ssr`; it automatically
creates a fresh buffered breadcrumb adapter, derives projection from the authored children
and delivers a native ordered path in Declarative Shadow DOM. There is no author-facing
plan/count property or manual slot-preparation step. See the [SSR integration](../../ssr/README.md).

Server-created roots use named slots and keep that mode during hydration. Hydrate with
the same authored children and element properties: the controller retains the original
native links/labels and their listeners, rather than rendering copies from item data.
The adapter finalizes the complete buffered output before delivery; it is not a streaming
boundary API or automatic integration with a different framework/raw Lit SSR renderer.
Client-only children are ordinary native content before upgrade, while the component or
server-rendered shadow root supplies the ordered-list structure.

The reusable projection controller lives in `interactions/breadcrumbs-projection.js`, and
its canonical structure template is `breadcrumbsTemplate` from `templates/breadcrumbs.js`.
They support this element's lifecycle. The pure `breadcrumbTemplate` recipe below is a
separate, unchanged data-to-markup API; removing `.items` from the element does not remove
that recipe's `items` option.

## Lower-level native templates

Import pure Lit templates from one modular entry:

```ts
import {
	sectionNavigationTemplate,
	breadcrumbTemplate,
	skipLinkTemplate,
} from '@en-reve/primitives/templates/navigation.js';
```

The existing `templates/*.js` package export covers this entry. It registers no custom
elements and creates no state, event listeners, observers, timers, routes or browser-global
reads. The same template works during SSR and client rendering when given the same data.
Serve the package's `navigation.css` at an application URL and load it with a native
`<link rel="stylesheet" href="/styles/navigation.css">` for document styles, or adopt `navigationStyles`
from `@en-reve/styles/navigation.js` in the root where the recipe is rendered. The markup
remains semantic and navigable before JavaScript; styles provide its visual presentation.

## Page and section navigation

```ts
const pages = [
	{ href: '/workflows', label: 'Sign-in' },
	{ href: '/workflows/settings', label: 'Settings', current: 'page' as const },
	{ href: '/workflows/chat', label: 'Chat' },
];

sectionNavigationTemplate({ label: 'Workflow pages', items: pages });

sectionNavigationTemplate({
	label: 'On this page',
	sticky: true,
	items: [
		{ href: '#appearance', label: 'Appearance', current: 'location' },
		{ href: '#review', label: 'Review notes' },
	],
});
```

`SectionNavigationOptions` contains the required landmark `label`, ordered `items`, and
optional `sticky` flag (default `false`). Each `NavigationItem` supplies `href`, visible
`label`, and optional `current`, `target` and `rel`.

The template renders a native `nav.en-section-nav` and real `a.en-navigation-link` anchors.
`sticky: true` adds `en-section-nav--sticky`; the style layer provides positioning. The
application owns the containing scroll region, inset/offset configuration and any optional
anchor-measurement controller. Merely rendering the template does not start observation.

Use `current: 'page'` for the actual current document and `current: 'location'` for a
location within a document. Omit it for other links. No current item is chosen from the
URL, fragment, scroll position or item order. Typically one link in each navigation set is
current. An application can pass updated data when its own location state changes.

Native links keep their href, browser history, keyboard activation, modified-click and
new-browsing-context behavior. These recipes neither cancel clicks nor turn links into
buttons, menus or tabs. Each link remains in normal sequential keyboard navigation; no
roving tabindex or arrow-key selection is installed. Supply your complete desired URL,
including query/fragment values. The application owns URL trust and navigation policy;
HTML escaping is not URL validation.

An omitted or empty `rel` defaults to `noopener` when `target` is `_blank` (case-insensitive).
An explicitly supplied nonempty `rel` is preserved. Labels may be strings or authored Lit
`TemplateResult` values containing noninteractive phrasing, for example emphasized text or
a decorative icon plus visible text. Do not put a link, button, input or other interactive
content inside an anchor label. Plain strings render as text rather than HTML.

## Breadcrumbs

This lower-level recipe retains its data-array API; it is not the `en-breadcrumbs`
child-content contract described above.

```ts
breadcrumbTemplate({
	label: 'Breadcrumb',
	items: [
		{ href: '/projects', label: 'Projects' },
		{ href: '/projects/studio', label: 'Studio studies' },
		{ label: 'Cover image', current: 'page' },
	],
});
```

`BreadcrumbOptions` requires a labelled landmark and ordered `BreadcrumbItem` values. A
breadcrumb item has the same fields as a navigation item, except `href` is optional. An
explicit href, including an empty string, renders a native anchor. Omitting href renders
plain `span.en-breadcrumbs__label` text. The current crumb may be either an anchor or text;
its `current` value is always supplied by the application, never inferred from its position.
`target` and `rel` apply only to items rendered as links.

The markup is `nav.en-breadcrumbs > ol.en-breadcrumbs__list > li.en-breadcrumbs__item`.
The ordered list also has `role="list"` to preserve exposed list semantics when list-marker
styling is reset. Separators are `span.en-breadcrumbs__separator` with `aria-hidden="true"`;
assistive technology reads the path entries rather than decorative slash characters.
Preserve ancestor-to-current DOM order in RTL. The style layer can wrap long labels; the
template does not truncate a path, hide ancestors or add an overflow menu.

## Skip links

```ts
import { html } from 'lit';

html`
	${skipLinkTemplate({ href: '#main-content', label: 'Skip to content' })}
	${sectionNavigationTemplate({ label: 'Workflow pages', items: pages })}
	<main id="main-content" tabindex="-1">
		<h1>Design settings</h1>
	</main>
`;
```

`skipLinkTemplate({ href, label })` renders a native `a.en-skip-link`. Its stylesheet reveals
it on focus. Put it early in document order and supply a real destination in the intended
context. The application supplies a focusable destination when needed and verifies that
keyboard navigation continues from that destination. The template does not assign IDs,
change destination tabindex, move focus or simulate fragment navigation.

Use the recipe in the consuming document/root where its native destination is available.
A shadow-root import scopes its styles; it does not create cross-root fragment resolution
or Reference Target support. Do not wrap a document bypass destination in an opaque shadow
component solely to reuse the skip-link appearance.

## Optional sticky anchor alignment

Import `attachAnchorNavigation` and type `AnchorNavigation` from `@en-reve/primitives/interactions/anchor-navigation.js`. Call `attachAnchorNavigation({ root, navigation })` once the actual navigation is rendered; pass the `en-navigation` host for the component, or the native nav for a direct recipe. The navigation must belong to the supplied root/document. An SSR document with no browsing context receives inert methods; no DOM globals or Lit runtime are imported.

- `followInitialAnchor()` follows the current native fragment after rendering/hydration. It does not restart following after observed user input.
- `refresh()` remeasures the same navigation and maintains an active fragment, until user input ends following. It does not claim a new fragment.
- `disconnect()` releases listeners, ResizeObserver and frames. It restores prior inline values/priorities only while they still equal the utility’s writes. Call attach anew on reconnection or after replacing the navigation element.

The only style outputs are root-scoped `--en-navigation-height` and `--en-navigation-position:sticky`. Height is measured before enabling sticky, and only changed values are written. Shared CSS defaults navigation to static before JavaScript and owns scroll margin/offsets. Avoid using the measured height to determine navigation height; that would create a consumer-authored feedback loop.

Native links retain URL/history/focus behavior; this utility never prevents activation, changes history or focuses a target. Anchors in an open shadow root are recognized through the composed event path within the supplied consumer root. Targets remain literal decoded light-document IDs contained by that root, without selector interpolation or shadow-root piercing; recognizing an anchor event does not broaden destination lookup. Native `scrollIntoView` can scroll ordinary ancestor scrollers; it does not promise confinement to a custom scroller. Browser text-fragment targeting is not interpreted by this utility.

An eligible click must have no modifiers, no cancellation, no download, an empty/self target (including inherited base target), and an identical origin/path/query. Its actual native URL must match before correction runs. Cancellation is checked after propagation. Hash changes resolve the current target afresh; missing/empty fragments clear stale following. Pointer/touch/wheel input, nonmodifier keyboard input (including Tab), or focus leaving the active target stops correction. Enter on a native link subsequently starts a new activation. The utility tracks input after attachment; it cannot reconstruct user input that occurred before it attached.

A window resize or changed navigation height maintains an active anchor with two guarded animation frames. Later input cancels even already-queued click/hash/layout correction. Two roots have separate style outputs/observers/listeners and only resolve their own targets. They share native document scrolling, as ordinary fragments do.

## Scope and verification

This slice provides primary native-child navigation/breadcrumb elements and native bypass
links. Navigation uses a default slot; breadcrumbs use projection and a canonical list
template. Both older pure data recipes remain available independently.
This does not complete the broader Navigation inventory category:
nested groups, responsive disclosure and their task-specific behaviors remain separate
work. Neither these wrappers nor the recipes depend on the pending component
value-ownership event decision.

Meaningful verification operates actual links: current-location semantics, keyboard bypass,
modified activation, navigation/history, direct fragments and browser context behavior.
Check optional anchor alignment with narrow/RTL layouts, text growth, scroll containers,
independent instances and disconnect/reconnect. Standalone consumers must work without
the docs site's CSS; SSR/hydration checks must retain native anchors and authored values.
Exercise breadcrumb rich-child edits, direct visibility, projection diagnostics and native
listener/identity retention as well. Record each native-child element migration separately
from earlier array-based wrapper results, pure recipe checks and template typechecking.
The navigation default-slot migration passed its own scoped component and built-documentation
checks; the [review checkpoint](../../../plans/review-session.md) preserves the results
separately from the earlier breadcrumb evidence.
This document does not claim completed browser or assistive-technology coverage.
