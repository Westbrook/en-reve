# Eager scoped element registries

`@en-reve/elements/element-scope.js` creates an explicit owner for new DOM. It uses a native registry when the owning browser supports the required operations and otherwise uses that document's `window.customElements`. Importing it registers nothing and is safe on the server; creating a scope requires an explicit browser document.

```ts
import {html, render} from 'lit';
import {createElementScope} from '@en-reve/elements/element-scope.js';
import {datePickerDefinition} from '@en-reve/elements/definitions/date-picker.js';
import {splitViewDefinition} from '@en-reve/elements/definitions/split-view.js';

const scope = createElementScope({document});
scope.register([datePickerDefinition, splitViewDefinition]); // dependencies first
const region = scope.createElement('section'); // ordinary element, no shadow required
region.setAttribute('aria-label', 'Scheduling');
document.querySelector('main')!.append(region);
render(html`
  <en-date-picker today="2026-09-20"><span slot="label">Review date</span></en-date-picker>
  <en-split-view><div slot="primary">Details</div><div slot="secondary">Preview</div></en-split-view>
`, region, {creationScope: scope.creationScope});
```

For a shadow boundary, use `const root = scope.attachShadow(region)` and render into `root` with the same `creationScope`. Nested library components use their actual registry at each new shadow boundary, subject to the documented adopted global render-root case below. Reuse one scope for repeated components; its import bridge is cached with weak registry keys. No per-instance registry is created by the base class.

For an eager whole-library example, import `registerAll` from `@en-reve/elements/catalog.js` and call `registerAll(scope.registry)`. This imports the entire catalog. Definition subpaths keep dependencies explicit. `scope.register()` uses the existing identity preflight: identical definitions are idempotent; incompatible constructors throw. There is no global lookup fallback inside a native registry.

`{document, registry: explicitRegistry}` must honor that registry or throw. `{document, registry: 'global'}` explicitly retains global construction. Existing `define/*` entry points and globally constructed hosts keep their global behavior. This phase does not automatically give global hosts private registries: doing so would split their already-registered dependency graph and change established global consumption. An explicitly scoped host gets scoped internals; public slotted children keep their own associations.

`scope.get()`, `whenDefined()` and `upgrade()` call the chosen registry. Definition availability is not rendering or interaction readiness: await the relevant components' `updateComplete` and the application's own readiness contract before handing off focus. Registration errors are propagated; they never trigger a retry in the global registry.

## Existing and dormant DOM

Registry association belongs to each node. Moving globally created DOM into `region` does not rebind it. Use `scope.createElement()` or the scope's Lit creation option from the beginning. A native scope can coexist with another version using the same tags; global fallback cannot.

Existing shadow roots remain authoritative, including global DSD from current SSR. The base element does not pre-attach roots, replace Lit's style adoption, or change its hydration setup. Explicit Lit `shadowRootOptions.customElementRegistry` is also honored, including closed roots. A subclass can override protected `getRenderRegistry()` to explicitly request a pre-registered registry; a conflicting existing root throws. Explicit null is preserved during root creation. Cross-document adoption follows native ownership: a browser may promote a null root to a global registry, and initialization cannot reverse that association. When scoped ownership must survive adoption, initialize null roots into the chosen scoped registry before moving them. Class definitions are not cached through constructor inheritance, so subclasses cannot accidentally inherit another definition map's private registry.

Native-only deferred markup may be parsed in a container created with `{customElementRegistry: null}`. `scope.register()` alone leaves that tree dormant. `scope.initialize(root)` explicitly associates null light descendants, and `scope.upgrade(root)` attempts detached upgrades. Initialization does not cross shadow boundaries or convert an existing global association. Initialize each owned null shadow root separately. The optional `elementScopeCapabilities(document).dormant` behavior check reports whether the internal Lit dormant parser is qualified. Unsupported eager construction falls back globally; unsupported dormant construction throws before rendering.

This is eager adoption. A lazy loader, activation scheduler, arbitrary renderer integration and production scoped SSR are later phases. In fallback browsers, keep deferred custom markup in inert templates until activation; connected globally associated tags cannot remain independently dormant once defined.

## Factories, authored children and renderer recipes

`en-toast-region.notify()` uses the region's actual registry and synchronously returns its upgraded `en-toast`. Register the region definition, including its hard dependency closure, before calling it. A globally registered toast never fills a missing scoped dependency. Slotted authored toasts retain their own association.

Create a node through the scope before passing it to an application renderer or portal:

```ts
const picker = scope.createElement('en-date-picker');
picker.value = '2026-09-20';
portalContainer.append(picker); // association stays with picker
const copied = scope.creationScope.importNode(inertTemplate.content, true);
region.append(copied);
```

A renderer calling ordinary `document.createElement()` still creates globally associated nodes, even when it later mounts them in a scoped section. Use a renderer's documented custom factory/creation-scope integration, supply already-created scoped nodes when supported, or retain global registration for that renderer. React/Vue/Svelte mounting alone is not registry integration. `cloneNode()` preserves source association; explicit scope imports select the destination registry for construction. Subsequent insertion into an adopted global shadow root follows native registry association, as described below. DOM cloning does not copy application property state or event subscriptions.

Use `scope.initialize(root)` for null-associated authored children. Radio groups, accordions, tabs and other library owners reconcile delayed definitions and initialization without requiring a synthetic DOM mutation. Definition availability is still not aggregate rendering readiness. Raw native `registry.initialize()` bypasses this owner notification; follow it with `scope.initialize(root)` to coordinate existing library owners. Calling the helper again for the same association is safe. Keep hard dependencies eager for synchronous methods.

Same-document moves preserve the source registry. Same-origin adoption preserves native scoped association. Future construction in a global render root selects the receiving document's global definitions. This selection alone does not make a foreign-realm constructor valid in that document; component construction and readiness still have to succeed. See the [deferred date-picker construction limits](src/date-picker/README.md). After insertion, some engines expose the previous global registry on the existing root and on those new descendants, even though a successfully constructed child keeps its destination constructor and owning document. This native association is not rewritten: a destination constructor does not prove that the child's exposed registry is the destination global. Passing an exposed foreign global registry explicitly to a native shadow-root operation can still fail; that failure is not retried through a different registry. The base element remembers a root's proven global origin to select future render construction. For a new, automatically selected child shadow root inside that exact library render root, compatible EnElement copies can share this proof through a versioned internal protocol. The child's exposed non-null registry must match that exact root's proven global registry, and parent, root and child must have the same current owning document. The new root then uses that document's global registry. Ordinary current-global hosts, explicit registry requests, existing roots, and actual scoped or null associations retain their existing rules. Missing or incompatible proof keeps the strict native path; native failures are not caught and retried globally.

This internal protocol is not a public extension API. It stores no DOM nodes or registries globally and changes only the new shadow root and its render creation scope. It does not rebind existing nodes or roots, replace constructors, or change the raw registry used by synchronous factories and child-upgrade tracking. Native scoped/null ownership is never inferred from constructor-time association: a constructor can run while its node appears global and the same returned node can later be null-associated and explicitly initialized scoped. Register compatible destination global dependencies before creating new descendants. CSSResult-based library styles survive adoption; native-sheet-only extensions and unqualified third-party editing backends should be recreated from destination-realm constructors. Transfer supported state explicitly rather than relying on a move to preserve an active editing session. See the Phase 2 plan for the qualified paths and tests.

## Lazy code and definitions (Phase 3)

The registry owns definitions; importing a definition does not register it. Use an explicit loader against the same registry used to create the tree:

```ts
import {createElementScope} from '@en-reve/elements/element-scope.js';
import {createElementLoader} from '@en-reve/elements/lazy.js';
import type {EnCommandPalette} from '@en-reve/elements/command-palette.js';

const scope = createElementScope({document});
const elements = createElementLoader(scope.registry);
const root = scope.createElement('section');
const palette = scope.createElement('en-command-palette') as EnCommandPalette;
palette.setAttribute('label', 'Commands');
root.append(palette);
document.body.append(root);

// Invoke from an explicit action; see the settings workflow for loading,
// errors, retry and cancellation. Type-only imports load no component code.
async function openCommands() {
  // The registry upgrades its associated connected tags when ensure defines them.
  await elements.ensure(['en-command-palette']);
  // ensure is definition readiness, not layout, paint, focus or render readiness.
  await palette.updateComplete;
  palette.open = true;
  await palette.updateComplete;
}
```

This works with a scoped ordinary subtree as well as a scoped shadow tree. Use `scope.createElement`, `scope.creationScope`, and the existing null-root initialization contract; putting an already global-associated element inside a scoped tree does not reassign its registry. When native scoped registries are unavailable, the same loader targets the document's global registry, so the first definition upgrades all matching global-associated tags. Per-tree upgrade containment is therefore a native capability, not a fallback guarantee.

`lazy.js` provides a generated allowlist of all canonical definitions with literal dynamic imports. It imports no component classes at startup. For a known application surface, avoid even the full manifest by importing the small `lazy-loader.js` factory and a selective allowlist:

```ts
import {createDefinitionLoader} from '@en-reve/elements/lazy-loader.js';
const loaders = Object.freeze({
  'en-command-palette': () => import('@en-reve/elements/definitions/command-palette.js')
    .then(module => module.commandPaletteDefinition),
});
const commands = createDefinitionLoader(scope.registry, loaders);
await commands.ensure(['en-command-palette']);
```

Reuse the manifest object to deduplicate module requests across loaders and scopes. Registration requests are shared per registry and manifest; each scope registers its own complete dependency closure. All requested modules must resolve before registration begins, then the synchronous registration helper preflights the entire closure and defines dependencies first. Unknown names reject before any import. Never construct an import URL from a tag or other user input.

`load(tags)` fetches/evaluates definitions without registration and can support deliberate prefetching. `ensure(tags, {retry: true})` retries a rejected module loader only after an explicit user retry. The browser may itself cache a failed module evaluation, so a retry cannot promise recovery without a reload. `DefinitionLoadError.stage` distinguishes `lookup`, `load`, and `registration`. Registration failures remain cached for that request; there is no rollback for a native failure after partial definition. Native upgrade constructor exceptions may be reported by the browser independently of `define()`, so successful `ensure()` does not certify working component instances.

Keep manifests immutable. Import caches contain code definitions and are keyed by manifest; registry caches are weakly keyed, with no global registry inventory. A consumer must still release its own loader and scope when disposing an otherwise unreachable registry. Browser module caches intentionally live for the realm; this API does not unload JavaScript.

Whole component families are the first lazy boundary. Canonical `ElementDefinition.dependencies` remain required-at-start; importing a parent still loads its static dependency closure. No edge is marked optional while the parent imports or renders that feature. Optional features currently live at application boundaries (the settings command palette), and author-supplied content keeps the Phase 2 ownership contract. Finer edge metadata belongs with canonical definitions if future implementations truly split those imports.

Keep essential buttons, navigation, visible forms, feedback and the active interaction unit eager. The settings workflow demonstrates a visible eager command trigger, a persistent loading/error live region, explicit retry, keyboard/touch first use, and cancellation on Escape, reset, disposal or focus moving elsewhere. Modules may finish loading after cancellation; the canceled interaction must not open or steal focus. Imports defer code, not authored DOM creation. Larger DOM savings require the Phase 4 activation/creation work.

Packed tests inspect emitted static import closures and browser network requests, including an explicit hydration-support boot boundary. Dynamic import syntax alone is not proof of a split. Run `npm run test:lazy-registries`; the separate performance campaign is documented in `probes/lazy-registry/README.md`.

## Explicit activation boundaries

`@en-reve/elements/activation.js` exports `createElementActivation`. It composes the existing scope and lazy loader without installing observers or scanning the document. `load()` shares module fetch/evaluation only. `activate()` registers and associates/materializes the selected boundary, then awaits the application's required `ready(root, signal)` callback. The callback must check real render readiness and honor cancellation before its own asynchronous side effects. No arbitrary input events are replayed.

Two native policies are supported. `group` requires a dedicated registry and roots/descendants already created with that scope; defining a tag activates all its associated matching hosts. `dormant` requires null-associated roots/descendants and can share a registry across independently activated islands. Supply nested shadow roots explicitly because `initialize()` does not enter them. An individual null-associated custom host is also a valid native root. Do not associate dormant content through a global renderer before passing it to the controller.

In global fallback, pass an empty native root and a trusted inert `template`. Content is imported into that root only after definitions are available. Other connected same-tag global hosts still upgrade when registration occurs; the controller cannot contain those. Keep optional hosts inside their templates until requested. Fallback does not provide multiple-version isolation. Template content is an initial markup snapshot, not a container for live drafts.

```ts
import {createElementScope} from '@en-reve/elements/element-scope.js';
import {createElementActivation} from '@en-reve/elements/activation.js';

const scope = createElementScope({document}); // Share this scope across dormant islands.
const root = scope.mode === 'scoped'
  ? document.createElement('section', {customElementRegistry: null})
  : document.createElement('section');
const template = document.createElement('template');
template.innerHTML = '<en-card>Optional details</en-card>'; // Trusted fixed markup.
if (scope.mode === 'scoped') root.innerHTML = template.innerHTML;
const activation = createElementActivation({
  scope, root, policy: 'dormant', tags: ['en-card'],
  loaders: {'en-card': () => import('@en-reve/elements/definitions/card.js').then(m => m.cardDefinition)},
  template: scope.mode === 'global' ? template : undefined,
  ready: async (root, signal) => {
    await (root.querySelector('en-card') as HTMLElement & {updateComplete: Promise<boolean>}).updateComplete;
    signal.throwIfAborted();
  },
});
document.body.append(root); // Keep an eager, meaningful control/status outside the boundary.
await activation.load();    // Optional preparation: no definitions or upgrades.
await activation.activate();
```

States are `dormant`, `loading`, `activating`, `ready`, `canceled`, `error` and `disposed`. Concurrent activations coalesce. `cancel()` rejects pending activation; cancellation after irreversible work is reported as `canceled`, never as a promise to undo upgrades. `dispose()` releases the controller's DOM references and rejects pending work without removing application-owned DOM. Disconnected roots cannot finish activation. Explicit `{retry: true}` retries module failures; native registration failure is permanent for that controller and cannot be rolled back. Readiness failure can be retried without replacing already materialized content. Ownership and fallback emptiness are checked again after asynchronous loading.

Do not defer essential controls, required form fields, status regions or user-activation-gated APIs. Preserve fallback dimensions and native semantics, drafts and focus. The controller does not assign widget semantics to undefined elements or conceal them. Applications own loading/error announcements and execute a current semantic action once readiness resolves. Call `cancel()` or `dispose()` when an intent or owning view is abandoned; import/evaluation already in progress may still finish.

The settings route begins nonblocking, load-only preparation when its entry module executes. It retains bounded focus/pointer-intent preparation and registers/upgrades only on explicit opening. This consumer policy spends the optional download on every settings visit; it is not a library-wide eager-loading default. Background preparation does not change focus, announce loading or schedule default idle/visibility work. Touch activation and immediate opening remain supported. This preserves current global SSR identity; scoped SSR ownership is a separate qualification phase. Controlled 500 ms intent benchmarks describe available lead time, not prediction accuracy, field INP or screen-reader acceptance.

For background preparation of several independent groups, yield a task between groups and check the owning view's signal. Keep direct `activate()` available for current input so the user does not wait behind a background queue. Constructors run synchronously once registration/initialization begins; choose small groups because a scheduler cannot interrupt a constructor.

```ts
for (const group of optionalGroups) {
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  viewSignal.throwIfAborted();
  await group.load(); // Or activate only when the application's policy permits it.
}
// The view's teardown cancels/disposes its activation controllers.
```

The Phase 4 policy comparison measured throttled immediate keyboard readiness at 251.30 ms for intent-only delivery and 73.70 ms for route-entry preparation, with 3,838 extra gzip JavaScript bytes on unused visits. See `plans/scoped-registry-phase-4-followup.md` and the frozen `scoped-registry-phase-4-followup-v1` campaign. Actions occurred after page readiness; opening during pending preparation remains a separately tested correctness path. Failed background preparation is quiet; explicit activation owns error feedback and retry. A retry calls the allowlisted loader again, but cannot clear the browser module map. Some engines cache failed network requests as well as evaluation failures. Preserve drafts and keep essential settings usable; if repeated retries fail, a user-controlled reload after saving work may be necessary. An ordinary reload may also retain a failed import in some engines; qualify recovery against the actual browser and production import path. Never automatically reload a form or append unbounded cache-busting URLs. See `DefinitionLoadOptions.retry`.
