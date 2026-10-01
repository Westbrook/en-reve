# Rendering and hydration

`@en-reve/ssr` renders registered Lit elements to HTML with Declarative Shadow DOM. It has no browser registration side effects. Each `renderToString()` call receives a fresh Lit render context; `renderRequest()` additionally creates its template from a request snapshot. Component Signals remain instance-local.

```js
// Node entry: install before evaluating component definitions.
import '@en-reve/ssr/install.js';

const { html } = await import('lit');
const { registerAll } = await import('@en-reve/elements/catalog.js');
const { renderRequest } = await import('@en-reve/ssr');
registerAll();

const markup = await renderRequest(
  { title: 'Project notes', notes: 'First line\nSecond line' },
  snapshot => html`<en-textarea
    label=${snapshot.title}
    name="notes"
    value=${snapshot.notes}
  ></en-textarea>`,
);
```

Use explicit per-component registration in applications which need only a subset of the library. The server registration set is fixed for the process; request data must not live in module-level mutable Signals. Applications requiring incompatible element versions can opt into the experimental request-isolated renderer below. The ordinary rendering entry remains process-global.

`renderToString(template, options)` accepts additional `elementRenderers` and an `onCustomElementRendered(tagName)` callback. It buffers the result. A future streaming API needs its own cancellation and backpressure contract; this API does not imply streaming.

## Native field references

The common native fields declare their semantic target through
`shadowRootOptions.referenceTarget`. The renderer preserves this as
`shadowrootreferencetarget` on each component's declarative root, including nested
fields and roots produced by the buffered select/textarea adapters. Request-local
renderer records determine the target; a tag-name search does not guess it. The
internal recording attribute is removed before returning markup, and all existing
Lit hydration markers remain intact. Custom renderer classes keep their existing
selection order. Null/absent targets emit no forwarding attribute.

Scoped island wrapping preserves these per-component targets. Inert-template
materialization passes the declared target and focus-delegation option when it
creates each shadow root. Native input nodes, drafts and selection remain under
the existing hydration/editing contract.

Supporting browsers can resolve external native labels before hydration. Other
engines retain the field's internal label before enhancement and use the
component-owned reflected-reference bridge after hydration. Keep an internal
visible label for no-JavaScript naming across engines, or compose light-DOM native
fields when external relationships must work without enhancement. This does not
serialize arbitrary cross-root ARIA element references or establish manual AT
coverage. See the [field contract](../elements/src/forms-private/README.md).

## Experimental scoped SSR (Phase 5)

The opt-in `@en-reve/ssr/scoped.js` entry exposes `createScopedRenderer()`,
`renderIslandMarkup()` and `serializeHydrationManifest()`. It runs each request in
an isolated Node worker with its own DOM shim, definitions and Lit template cache.
The calling realm's registry is never replaced or populated. A trusted file-URL
allowlist selects application modules; request data cannot specify an import URL.
Workers are bounded (two active and 32 queued by default), time out after 30 seconds,
and terminate after rendering, cancellation or disposal. Worker startup is a real
server cost, not an advertised performance gain. No reusable worker pool is promised.

Choose server execution independently of the client hydration policy:

- Use ordinary `renderToString()` for a process with one compatible definition set.
  Keep request state out of mutable module globals.
- Generate island HTML at build time or cache it where content, versioning and
  personalization permit. Server generation cost is then outside browser navigation.
- Use `createScopedRenderer()` per request when fresh registry/module/template-cache
  isolation is required. Its buffered render cost is on the response path.

The Phase 5 browser campaign serves pre-rendered HTML; its startup and first-use
timings do not include server generation. The frozen server comparison measured
0.39 ms for a warm process and 127.07 ms for a fresh worker. A separate diagnostic
reproduced about 129 ms: most elapsed time was environment/module setup, with
about 7 ms in the first render. A prewarmed **single-use prototype** measured
8.64 ms after request submission, excluding 123.24 ms of advance preparation.
This moves setup earlier; it does not establish CPU, capacity or memory savings.
It is not a shipped pool API. See `probes/scoped-hydration/ssr-profile/README.md`
for the separate campaign and its limits.

```js
import { createScopedRenderer, renderIslandMarkup } from '@en-reve/ssr/scoped.js';
const renderer = createScopedRenderer({
  settings: { module: new URL('./settings-island.js', import.meta.url), version: 'v1' },
});
const result = await renderer.render({ key: 'settings', snapshot }, { signal });
const { html, manifest } = renderIslandMarkup(result, 'settings-island');
// Deliver html plus safely serialized manifest and the same data snapshot.
// Dispose the renderer at application shutdown, not after every request.
```

The application module exports `version`, class-only `definitions`, and a
`template(snapshot)` factory. Server snapshots are structured-cloned at submission;
rendering remains buffered, including existing library adapters and the
`deferHydration: false` workaround. Each independent version is a separate render
request/island. Modules must be browser-safe if reused by the client loader.

`renderIslandMarkup()` adds a native section and null-associated declarative shadow
boundary, including null association on nested DSD templates. It preserves the Lit
marker bytes. Passing `'global'` as its third argument instead produces an ordinary
section for deliberate global enhancement. It does not retarget already global DOM.
Passing `'template'` keeps the optional SSR markup inert. Put essential native
content outside that template so it works with no JavaScript or a failed chunk.

The browser-only `@en-reve/ssr/client.js` entry exports `createHydrationIsland()`.
Load this entry before application LitElement modules (or install Lit's hydration
support yourself first). It dynamically loads hydration support before invoking
application loaders. The client module exports the matching `version`, `definitions`,
a synchronous `template(snapshot)` and an explicit `ready(root, signal)` callback
that awaits actual widget updates. Importing the client entry has no DOM side effects.

```js
import { createHydrationIsland } from '@en-reve/ssr/client.js';
const host = document.getElementById(manifest.id);
const island = createHydrationIsland({
  root: host.shadowRoot ?? host, manifest, snapshot,
  loaders: { settings: () => import('./settings-island.js') },
});
await island.load(); // Optional route-entry preparation: fetch/evaluate only.
await island.activate(); // The application owns loading/error announcements.
// On a load error: await island.activate({ retry: true });
// On removal: island.dispose();
```

Hydration establishes outer template properties/events before null roots are
initialized and definitions registered. Initial native hydration requires those
definitions to remain unregistered in its registry until all nested roots are
associated. Existing non-null associations must match. Roots have a single owner;
version/tag mismatches, pre-upgraded elements and incompatible registries are errors.
Disposed, disconnected or cross-document-adopted pending work cannot upgrade later.
Call `dispose()` on teardown to abort immediately even when a loader never settles. Retry is available for
loading failures; failures after hydration starts are terminal because registration
and partial hydration cannot be rolled back. Browser module failure caching still
applies. `ready` must observe its signal if it schedules its own work.

On browsers without native registries, this initial path enhances the existing
SSR tree globally. Defining a tag can upgrade matching elements elsewhere in the
document; independent dormancy and incompatible versions are not provided in that
mode. For independent dormancy, pass the direct `template[data-en-island-template]`
as the `template` option. Its `root` must contain only that template (plus whitespace),
or be an empty scoped shadow root whose host directly contains the template.
Activation imports that content through the selected scope, materializes open DSD,
and hydrates before releasing Lit connection. Existing global definitions may
construct detached elements during import; this path controls connection/hydration,
not arbitrary constructor side effects. Incompatible global versions remain unsupported.
Do not author the private `data-en-hydration-release` marker. Closed declarative
roots are unsupported by this materialization recipe. Do not place critical native
form functionality behind optional hydration.
Use the exact server data and template; native input attribute bindings can retain
user edits, but application property bindings that overwrite `.value` still own
that write. There is no generic editor-draft restoration layer.

Qualification covers concurrent server versions, snapshot capture, queue/abort/timeouts,
native and global hydration, independent versions where supported, native input
identity/drafts/focus/selection/reset, real `en-button` shadow identity, no-JS content,
load-only preparation, inert-template containment, incremental HTML transport,
synthetic composition events, real failed chunks, and disposal. Synthetic composition
is not physical IME evidence. Browser network failures may require reloading when
the browser caches a rejected module. The application owns useful native fallback,
loading/error announcements, retry controls and readiness/focus policy.

The reproducible packed Vite workload and protocol live in
`probes/scoped-hydration/production`. They compare the sealed Phase 4 eager SSR
recipe with prepared and cold Phase 5 islands. This is a new matched SSR series;
previous settings-workflow timings cannot be substituted for its baseline. Request
worker cost is reported separately from browser startup and first use.

The command-island example awaits two animation frames in its application-owned
`ready(root, signal)` callback after the first component update. Manual Safari
27/VoiceOver review found that immediately opening newly hydrated modal content
could leave the VoiceOver cursor outside even though DOM focus was correct; the
settling variant passed that review. The callback runs once per island activation,
so reopening does not repeat the wait. It cancels scheduled frames on disposal and
rejects if the boundary disconnects or moves documents. This policy is specific to
that application's modal content; `createHydrationIsland()` and ordinary dialogs
do not impose a frame delay. Frames can be suspended in background tabs, and
readiness is not proof of accessibility-tree synchronization on every platform.
See `probes/scoped-hydration/production/settle-before-focus.mjs`.

## Optional content at first paint

The buffered renderer determines `en-card` header/footer and `en-alert` icon
presence from the completed authored children. Empty regions are hidden in the
initial HTML; supplied regions are visible before JavaScript. This includes
forwarded slots and their fallback content in declarative shadow roots. A hidden
or empty ordinary element still counts as assigned content, matching the browser
components' existing presence rule; this is not a computed-visibility test.

Private `data-en-optional-slots` metadata carries the server's decision into the
first hydration render. Do not author or remove this metadata before hydration.
The component then removes it and reconciles the actual assigned nodes, including
changes made before hydration. Later insertion, removal and slot reassignment
continue through `slotchange`. With JavaScript disabled, the original server
decision remains in effect.

Forwarding slots may use different names from the receiving component's slots,
such as a wrapper's `heading` slot forwarding into a card's `header`. Card and
alert presence is reconciled at the receiving slot, including content added after
hydration, reassignment, removal and restored fallback content. The focused
`tests/browser/optional-slots.spec.ts` suite exercises these changes in Chromium,
Firefox and WebKit alongside first-paint geometry and hydration node retention.

The adapter modifies only library-owned optional-region visibility and metadata;
it preserves authored nodes, Lit markers and canonical templates. Consumer
renderers take precedence and own their own initial-presence contract. Unknown
manual projection modes remain conservatively visible. Component static styles
are delivered inline in Declarative Shadow DOM and can become shared constructed
stylesheets after hydration; document styles remain the application's concern.

## Slotted page and section navigation

Registered `en-navigation` uses the existing Lit renderer and an ordinary named default
slot. Author native anchors directly, with their rich noninteractive content, URLs,
`aria-current`, `target`, `rel` and native listeners. The host retains `label`, `sticky`
and inherited `size`; it no longer accepts `.items` or exports element item types.

```js
const markup = await renderToString(html`
  <en-navigation label="Workflow pages">
    <a href="/workflows">Sign-in</a>
    <a href="/workflows/settings" aria-current="page"><strong>Design</strong> settings</a>
    <a href="/workflows/chat">Chat</a>
  </en-navigation>
`);
```

No per-child mapping adapter, generated slot names or private projection metadata are
needed for navigation. Its native children appear once in light DOM and project through
the default slot in Declarative Shadow DOM. Hydrate with the same children/properties;
normal projection retains the original anchors rather than recreating them from item data.
Applications own native attributes/listeners and focus continuation when they replace or
remove a child. Custom renderers supplied before the library renderer own their resulting
markup and hydration contract.

This ordinary-slot path is distinct from the buffered breadcrumb adapter below. The pure
`sectionNavigationTemplate({ label, items, sticky })` recipe remains a separate unchanged
API. Verification of the new navigation migration is recorded independently of the earlier
breadcrumb and native-recipe receipts; full framework and manual AT coverage is not implied.

## Breadcrumb projection

Registered `en-breadcrumbs` components work through ordinary `renderToString()`
and `renderRequest()` calls. Author direct native `a` and `span` children, including
their rich phrasing, URLs and explicit `aria-current`; no item array, count or slot
mapping is required.

```js
const markup = await renderToString(html`
  <en-breadcrumbs .label=${'Project path'}>
    <a href="/projects">Projects</a>
    <a href="/projects/studio"><strong>Studio</strong> workspace</a>
    <span aria-current="page">Overview</span>
  </en-breadcrumbs>
`);
```

Each call creates a fresh request-local adapter. It captures the initialized
component's properties, derives a projection plan from the rendered direct
children, and renders the component's canonical shadow template. Structural
source edits add private mapping attributes while preserving original child
subtrees, whitespace and Lit markers. Labels and URLs are not duplicated into
metadata. The buffered result is finalized before the returned promise resolves;
documents without matched breadcrumbs pass through without a parser pass.

Named SSR slots project those original children into native ordered-list items as
the response is parsed, before component JavaScript loads. The component recovers
the private plan before hydration and retains that named root. Fresh client
instances use manual assignment. The preparation helper is shared with the
projection controller and does not add a public component method.

Ordinary hidden children retain their nodes and hidden attributes; their private
list wrappers are hidden too. `hidden="until-found"`, unsupported direct elements,
non-whitespace direct text, and consumer-authored `slot` or
`data-en-breadcrumbs-plan` attributes are diagnosed rather than silently replaced.
Author noninteractive phrasing inside each path entry. The adapter is not an HTML
sanitizer and does not validate arbitrary descendant semantics.

Application `elementRenderers` still take precedence, followed by the default
selection and breadcrumb adapters, textarea adapter, and ordinary Lit renderer. An application
renderer that deliberately handles `en-breadcrumbs` owns its SSR output and
projection contract. Registration remains explicit.

### Cooperating custom tags

`createBreadcrumbsSsrAdapter()` remains available for cooperating custom tags,
as exercised by
[`probes/breadcrumbs-ssr-adapter`](../../probes/breadcrumbs-ssr-adapter/README.md).

Create a fresh adapter for each render request. Pass its `Renderer` through
`elementRenderers`, then await `adapter.finalize(markup)` before sending any of
that markup to the browser. The adapter captures real component properties,
derives projection metadata from the rendered direct native children, and renders
the canonical shadow template using that metadata. It preserves authored child
subtrees and Lit markers through source-location edits. The temporary shadow
placeholder is never suitable for delivery.

The cooperating component supplies the canonical rendering contract. In the
prototype directory, a server module can use the same fixture modules:

```js
import '@en-reve/ssr/install.js';
import { createBreadcrumbsSsrAdapter, renderToString } from '@en-reve/ssr';
import { EnBreadcrumbsProbe, registerProbeElements } from './component.mjs';
import { fixtureTemplate } from './template.mjs';

registerProbeElements();
export async function renderBreadcrumbExample(snapshot) {
	const adapter = createBreadcrumbsSsrAdapter({
		tagName: 'en-breadcrumbs-probe',
		elementClass: EnBreadcrumbsProbe,
		capture: element => ({ label: element.label }),
		prepare(element, keys, captured, { hiddenKeys }) {
			element.setSSRPlan(keys, hiddenKeys);
			element.label = captured.label;
		},
	});
	const markup = await renderToString(fixtureTemplate(snapshot), {
		elementRenderers: [adapter.Renderer],
	});
	return adapter.finalize(markup);
}
```

`capture` must return detached request state. `prepare` receives read-only key
sequences and must leave the instance ready to render; the adapter does not rerun
`connectedCallback` or `willUpdate` after preparation. Finalization consumes the
adapter even when it rejects, so retries use a fresh factory instance.

The cooperating client component recovers the same private plan before its first
hydration render. Named SSR slots project the original children as the browser
parses them; hydration retains that root. Fresh client instances may use manual
assignment. Consumers author one set of native links and labels rather than
maintaining a second item count or server mapping.

This adapter targets the installed Lit SSR integration. It does not establish
other frameworks' tolerance of generated `slot` attributes, a streaming protocol,
or scoped-registry SSR. Direct author-supplied projection attributes are diagnosed
instead of silently overwritten. The fixture and its focused tests document the
supported child contract and remaining adoption work.

The replacement shadow template cannot introduce another matching adapted
component during finalization. Breadcrumbs already discovered in another
component's ordinary shadow output are supported. The finalization restriction
keeps recursive template discovery outside this bounded adapter. The public
breadcrumb template contains native list and slot markup and does not require
recursive finalization. Staged delivery of an already finalized response is
distinct from a streaming rendering API.

## Child-authored select and segmented choices

Registered `en-select` and `en-segmented-control` derive their initial choices through
ordinary `renderToString()` and `renderRequest()`. Author direct `en-select-option`
descriptors or `en-segmented-item` labels; callers provide no private plan or duplicate
item array. Recognized children take precedence over `.items`. Removing all recognized
children restores the `.items` fallback; invalid recognized children are diagnosed and
never silently reveal that fallback.

```js
const markup = await renderToString(html`
	<en-select label="Workspace" name="workspace" value="studio" required>
		<en-select-option value="studio">Studio</en-select-option>
		<en-select-option value="archive" disabled>Archive</en-select-option>
	</en-select>
	<en-segmented-control label="View" name="view" value="grid">
		<en-segmented-item value="grid"><strong>Grid</strong> view</en-segmented-item>
		<en-segmented-item value="list">List view</en-segmented-item>
	</en-segmented-control>
`);
```

The parent owns selection and reset defaults. Set its `value` attribute for an authored
baseline or write its `.value` property for application authority. Child `selected` and
`checked` attributes are unsupported. Select descriptors require an explicit unique
value (including the empty string); segmented values must be unique and nonempty.
Select labels use normalized nonempty authored text, falling back to the `label`
attribute. Rich select markup is not copied into native options. Segmented labels retain
their original noninteractive content through private named slots. Child-authored slot
attributes and the reserved parent `data-en-selection-children` attribute are diagnosed.

The buffered adapter captures each initialized instance's public rendering properties,
derives normalized records with the same validator used in the browser, and renders its
canonical shadow template. Select renders actual private native options before JavaScript;
its authored descriptors are metadata rather than native controls. Segmented renders
same-root native radios and labels, with the original rich children projected once.
Private metadata contains derived select labels and choice values; it is generated output,
not another authoring source. Both selection roots use ordinary named slot assignment.
Original child subtrees and Lit markers are retained. Ordinary hidden choices remain
hidden and unavailable; `hidden="until-found"` is unsupported.

An early native choice can be adopted during hydration through a cancelable `en-change`
with reason `hydrate` when the baseline is attribute-authored and no public `.value`
write occurs during upgrade. Cancellation restores the accepted baseline. **Any public
property write during upgrade is authoritative**, including an equal pre-upgrade write
and a containing Lit template replaying `.value=${initialValue}`. In those property-bound
cases, the application value takes precedence over an early native edit. Hydrate the same
initial template and snapshot; do not infer early-edit preservation from equality. There
is no new public hydration preparation API. ElementInternals form participation still
begins at upgrade, as described below.

Request-local adapters finalize the complete buffered response before delivery. Application
renderers supplied first retain precedence and own the output for any parent they replace.
This selection adapter is shared by the two public parents; it is not a generic descendant
HTML validator, a streaming API, or a promise of compatibility with every framework's
handling of generated slot attributes. Focused Node and browser fixtures cover this bounded
contract; their current results must be recorded separately from older SSR receipts.

## Data-backed trees

`en-tree` accepts `.items` as a property alongside the child-authored mode below.
Omitting the property selects slots; an empty array explicitly selects an empty
data tree. Do not combine data with authored `en-tree-item` children.

```js
const markup = await renderToString(html`
  <en-tree label="Project files" virtualize .expanded=${['source']} .items=${[
    { value: 'source', label: 'Source', children: [
      { value: 'readme', label: 'Readme' },
      { value: 'tests', label: 'Tests', disabled: true },
    ] },
  ]}></en-tree>
`);
```

The canonical component template renders the initial expanded-visible window
deterministically, with nested treeitem/group ownership and level, sibling
position and sibling-count metadata derived from the full model. Virtualization
limits rendered rows; it does not limit the data necessary for navigation.

Private `data-en-tree-data` metadata carries a normalized copy of only `value`,
`label`, `disabled` and `children` into standalone Declarative Shadow DOM
hydration. Arbitrary application payloads are not copied. The serialized HTML
attribute is escaped, then the component validates and normalizes its contents
again when recovering it. Explicit application `.items` writes take precedence.
The metadata is removed after the first successful render. Supply the same
initial properties when hydrating an enclosing Lit template.

The complete normalized model is included in the HTML, so virtualization reduces
DOM cost rather than initial model transfer size. Remote loading, lazy child
fetching and partial-model hydration are separate future contracts. With
JavaScript disabled the initial window stays visible but cannot reveal unrendered
items. Applications that require complete no-JavaScript browsing should provide
their own fallback or render a finite nonvirtual tree. Automated hierarchy and
hydration checks do not replace manual screen-reader navigation testing.

## Finite child-authored trees

Registered `en-tree` and `en-tree-item` receive their first-paint hierarchy from
ordinary `renderToString()` calls. The parent owns selection and expansion; author
one set of items with unique nonempty values and no child selected/expanded flags.

```js
const markup = await renderToString(html`
  <en-tree label="Project files" value="readme" .expanded=${['source']}>
    <en-tree-item value="source" label="Source">
      <strong slot="label">Project source</strong>
      <en-tree-item slot="children" value="readme" label="Readme"></en-tree-item>
    </en-tree-item>
    <en-tree-item value="archive" label="Archive"></en-tree-item>
  </en-tree>
`);
```

The buffered adapter captures the initialized parent state and item properties,
derives branch state, levels, sibling positions/counts, selection, expansion, and
one visible initial tab stop using the same pure derivation as the browser. It
then renders each item's canonical shadow template once. Original labels, items,
named slots, and Lit markers remain in place; no generated projection slots or
duplicate item arrays are required. Collapsed descendants remain in their hidden
groups. A selected collapsed descendant retains selection while a visible item
provides the tree's entry point. Disabled items remain discoverable.

Root items must be direct children in the default slot; descendants must be direct
item children with `slot="children"`. Structural wrappers and forwarded structural
slots are rejected explicitly. Label, prefix, and suffix slots retain ordinary
named-slot behavior. Hidden, inert, and `aria-hidden="true"` item subtrees are
excluded from navigation; `hidden="until-found"` is unsupported. Missing/duplicate
values and authored item `selected`, `expanded`, or `checked` attributes reject
rendering instead of silently inventing ownership. Standalone items have an inert,
unselected presentation and no tab stop.

Private `data-en-tree-snapshot` and `data-en-tree-presentation` attributes carry
the parent state and item render baseline into hydration. Do not author or remove
them before upgrade. This also preserves property-only expansion when upgrading
standalone DSD without replaying a containing Lit template. Items retain the server
presentation through their first hydration render, then remove metadata and
reconcile current children and parent state. Application interactions require
JavaScript. Consumer renderers retain precedence; a custom parent renderer owns
its tree coordination contract, and a library-rendered tree requires library-rendered
owned items.

Focused verification is in `tests/tree.test.mjs` and the isolated three-engine
`tests/tree/playwright.config.ts` suite. Run the latter after building the packages:
`npx playwright test --config packages/ssr/tests/tree/playwright.config.ts`.

## Browser bootstrap

Load Lit's hydration support before Lit and the component modules. Upgrade and hydrate a containing template in the same synchronous turn, using exactly the initial server template and snapshot:

```js
import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { registerAll } from '@en-reve/elements/catalog.js';
import { applicationTemplate, initialSnapshot } from './application.js';

registerAll();
hydrate(applicationTemplate(initialSnapshot), document.querySelector('#application'));
```

The renderer uses ordinary top-level upgrade behavior. Lit automatically defers nested shadow-root elements until their parent hydrates. In the installed Lit SSR 4.1.0, forcing `deferHydration: true` also defers static top-level elements without emitting their release markers; this adapter deliberately does not expose that broken path.

The documentation shell renders to light DOM. Its `createRenderRoot()` hydrates the existing root once before normal Lit updates. Its contained library elements hydrate their existing DSD. Theme CSS is emitted into the document head before first paint, outside the hydrated shell, and the browser subsequently updates that same style element.

## Shared static styles after hydration

The server keeps each component's static CSS in its declarative shadow root for
first paint. After its first successful update, an En Rêve element replaces the
renderer-owned style block with Lit's cached `CSSResult.styleSheet` objects through
`shadowRoot.adoptedStyleSheets`. Repeated hydrated elements and newly created client
elements share those same sheets. This needs no additional consumer bootstrap.

The renderer marks its own static block with private, versioned metadata. CSS
minification may change that block's text, so ownership does not depend on equality
between minified server CSS and the JavaScript CSS result. Template content, native
controls, focus, values, slots, Parts, and inherited custom properties stay intact.

The inline style remains when adoption is unsupported or fails, the ownership
marker is absent or unknown, or another DOM stylesheet would change the cascade.
That check includes styles added by the first `firstUpdated` or `updated` callback.
Existing consumer-adopted sheets keep their order after the component's sheets.
Moving a converted element to a different document restores a static inline
fallback; reconnecting within the same document does not duplicate sheets.

This removes repeated **live style nodes after hydration**. It does not remove CSS
from the initial HTML response or establish a measured load-time or memory gain.
Document-level theme styles remain independently owned by the application.

## Native initial state and editing

Native boolean defaults use boolean attribute bindings (`?checked` and `?selected`) so false values are absent. Native text inputs use stable initial `value` attributes, without live `.value` template bindings. Native editing controllers reconcile accepted state separately from draft, selection, and composition.

Lit cannot hydrate a dynamic child binding inside raw-text `textarea`. The package's textarea renderer collects the ordinary component shadow output, locates its static native textarea with an HTML parser, and inserts escaped initial text between the existing tags. It preserves Lit's original markers and template identity. A leading newline is supplied for HTML's textarea parsing rule. No user value is treated as HTML. This adapter depends on the component retaining one static native textarea and fails clearly if that contract changes.

Hydration adopts dirty pre-upgrade text in managed fields. Controlled fields retain their native draft while form submission continues to use the accepted application value until the application writes a new value. The tested text surfaces preserve node identity, focus, and selection; this does not certify every platform input method or pre-upgrade behavior of all choice controls.

Native form association supplied by ElementInternals begins when the custom element upgrades. Server output provides visible native controls and their same-tree labels; full custom-element form submission without JavaScript is not asserted. Application interactions still require JavaScript. Browsers without native DSD require a separately selected DSD fallback; no body-hiding bootstrap is used.

Other slotted groups without a dedicated adapter cannot discover their assigned children during ordinary SSR. Authors supply matching initial child state, such as a checked radio, selected tab metadata, hidden inactive tab panels, and expanded accordion items. The documentation examples demonstrate those explicit attributes.

For optional text that starts absent, render Lit's `nothing` sentinel instead of an empty string. In the installed hydration stack, an empty primitive can be remembered as an existing text node even though HTML parsing left only its boundary comments; a later text update then writes into a comment. The shared description template normalizes its empty fallback to `nothing`. Its browser regression covers empty → text → empty → text through both property and attribute writes, including the minified production sticker sheet. Initial visibility alone does not verify that a hydrated text binding can update.

Popover and tooltip triggers stay outside their overlays and use stable IDs referenced by `for`. Server output retains those IDs, references, and native buttons; hydration attaches the interaction and accessibility relationships without replacing the triggers. ID lookup remains within the overlay's document or shadow root. An already-focused tooltip trigger is recognized during hydration. Overlay interaction requires JavaScript.

## Documentation build

`apps/docs/scripts/build-ssr.mjs` builds the browser assets and a temporary Node render entry, renders a fresh `StickerApp`, and inserts its HTML into `dist/index.html`. It preserves the SSR output bytes rather than reparsing and reserializing textarea contents. The output is **build-time SSR for a static host**, not a request-time backend. `dist/evidence/ssr.json` records the rendered element types and HTML size. The reusable package API can also be called by a server host per request.

## Verification

- `npm test -w @en-reve/ssr`: Node DOM-parser tests for actual DSD/native semantics, textarea text escaping, and concurrent request isolation.
- `npm run build`: produces the complete SSR documentation page.
- `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright npx playwright test --config packages/ssr/playwright.config.ts`: built-page JavaScript-disabled and delayed-loading journeys plus real form hydration in Chromium, Firefox, and WebKit.
- `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright npx playwright test --config packages/ssr/tests/adopted-styles/playwright.config.ts`: shared stylesheet identity, SSR first paint, editing/focus preservation, consumer cascade, adoption failure and document movement.

These engine runs are implementation evidence, not the complete retail current-minus-one browser/OS/assistive-technology matrix. See `verification.json` for the latest recorded scope.

Primary upstream contracts: [Lit SSR authoring](https://lit.dev/docs/ssr/authoring/), [server usage](https://lit.dev/docs/ssr/server-usage/), and [client hydration](https://lit.dev/docs/ssr/client-usage/).

Form navigation accepts direct `en-progress-step` children and validation summary
anchors alongside data arrays. `renderToString()` buffers their authored children,
projects their original nodes into the canonical list, and emits hydration
metadata. Consumers must not author `data-en-form-children` or generated form
slots. Wrappers and forwarded whole lists are not traversed. Server validation
rejects duplicate/invalid steps, interactive nested labels and invalid fragment
links instead of rendering a different client list.

## Explicit delivery profile agreement

Scoped render entries/modules and hydration modules may declare an optional
`delivery` identity from `profile.identity`. The identity contains only
`schemaVersion`, `id` and `version`; never serialize the executable profile's
loaders. The renderer captures the entry identity and checks it against the
server module before registering definitions. `ScopedRenderResult` carries it
through `renderIslandMarkup()` into the hydration manifest. The client captures
the manifest identity and checks the loaded module before collecting definitions,
registering, materializing or hydrating the root. If either side declares a
profile, both must match exactly. Omitting it on both sides preserves existing
islands.

Select the same definition profile and pre-first-render properties on server and
client; matching identity does not substitute for matching the initial template,
attributes and snapshot. In particular the single-date shell requires
`calendarLoading='deferred'` and `selection='single'` on both sides. Essential
editors still need prompt hydration for custom-element form association. The
hydration island remains the only owner of its root; ordinary activation must not
also materialize or upgrade it. See the [delivery recipes](../../plans/lazy-delivery/recipes.md)
for the ordered support/module bootstrap and native fallbacks.
