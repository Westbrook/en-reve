# En Rêve elements

Register individual elements through `@en-reve/elements/define/<name>.js`.
Class-only entrypoints are available at `@en-reve/elements/<name>.js`; the catalog
provides the dependency metadata used for selective registration and SSR.

Create eager native scopes with global fallback through `@en-reve/elements/element-scope.js`. See [scoped registry usage and ownership](SCOPED-REGISTRIES.md).

## Chat composition

`en-chat-message` renders an authored article with author, avatar, metadata, body,
attachments, actions and status slots. `en-chat-composer` composes a slotted
`en-textarea` or native textarea with attachment/tool/status slots and a shared send
button. Import `@en-reve/elements/define/chat-message.js` and
`@en-reve/elements/define/chat-composer.js` for registration.

Send and Control/Command + Enter request a cancelable `en-action` with
`detail.action === 'send'` and `detail.data.value`. Enter remains newline; IME
composition blocks send. `requestSend()` reports acceptance, not delivery. The
component never clears drafts/files. Use `sending` to guard duplicate requests
and let the application retain or clear the matching draft after its transport
settles. A replacement `send` slot triggers the same request; reflect its disabled
state on the supplied button. See [the integration contract](../../plans/chat-patterns.md).

## Typed events

Data notifications and tentative changes use `CustomEvent<Detail>` with exported
semantic event aliases. The API-01 feed, tree, table, navigation, overlay and editor
surfaces provide component-local listener maps. Native listener options, objects,
removal and AbortSignal work unchanged. No runtime class check is needed:

```ts
import type { PageChangeEvent, ActivityLoadRequestEvent } from '@en-reve/elements';

function onPage(event: PageChangeEvent): void {
  if (event.detail.proposed > lastAllowedPage) event.preventDefault();
}
feed.addEventListener('en-page-change', onPage);
feed.removeEventListener('en-page-change', onPage);

function onLoad(event: ActivityLoadRequestEvent): void {
  const {cursor, signal} = event.detail;
  event.respondWith(Promise.resolve().then(() => {
    signal.throwIfAborted();
    return application.loadHistory({cursor, signal});
  }));
}
feed.addEventListener('en-load-request', onLoad);
```

A typed listener still needs an ownership check when descendants can emit the same
bubbling event. `en-change` is not globally assigned a single payload type. In Lit,
annotate the handler signature and pass it to `@en-change`; native EventTarget
listeners and template bindings share the exported event types.

See [API-01 contracts and migration](../../plans/api-01-events.md) for tentative
state, load response ownership, lifecycle notifications and compatibility paths.

## Reusable component definitions

Each `definitions/<name>.js` entry exports one side-effect-free definition,
including the same dependency objects consumed by the catalog and the
`define/<name>.js` registration entry. Import a definition for selective scoped
registration or SSR without loading the entire catalog:

```ts
import {colorPickerDefinition} from '@en-reve/elements/definitions/color-picker.js';
import {registerDefinition} from '@en-reve/primitives/interactions/registration.js';

registerDefinition(registry, colorPickerDefinition);
```

`registry` is the application's chosen custom-element registry. The helper
registers dependencies first, skips an identical existing definition, and rejects
conflicting constructor identities before writing any definitions. Browser-level
validation errors are not rolled back. `catalog.js` exports all roots as
`definitions` plus explicit `registerAll(registry)`; merely importing the catalog,
a class entry, a definition entry or the main barrel registers nothing.

Authored-child policy stays explicit: `define/menu.js` does not register menu
items; import `define/menu-item.js` when authoring them. Likewise the neutral
editor trigger does not choose or register an editor implementation. Components
that generate their children, such as tree and color picker, retain those
dependencies. Add dependencies to the component's definition module once;
`npm run test:tooling` checks graph identity, entry coverage and cycles.

## Content ownership across collections

| Surface | Application content | Component-owned structure |
| --- | --- | --- |
| Tree data | Validated plain-text labels; no renderer callback | Tree and item semantics, hierarchy, selection and focus |
| Authored tree | Rich noninteractive `label`, decorative `prefix`/`suffix` slots | The same tree and item semantics |
| Activity `renderItem(item, index)` | Body and author/avatar/metadata/attachments/actions slot content | Managed `en-activity-item`; do not return another list-item wrapper |
| Carousel `renderItem(item, index)` | Mounted item content | `en-carousel-slide`, or `li` in list reading mode; do not return either wrapper |
| Table column `renderCell(item, index)` | Cell content | Native `th`/`td` and `tr`; do not return cell or row wrappers |

Equivalent authored/data validation and SSR presentation do not require every
component to expose a rich renderer. Native-anchor navigation and breadcrumbs
also retain their explicit content boundary; see [Link composition](src/link/README.md).

## Opt-in delivery profiles and preparation

All canonical tags retain `elementLoaders` and the existing `load()` / `ensure()`
contract. `createDefinitionPreparation(loaders)` provides the same shared load-only
operation without a registry. Its import cache remains manifest-owned: reuse the
manifest object across scopes. Loading never registers, constructs, hydrates,
focuses or establishes readiness.

The `lazy-loader.js` entry re-exports the generic definition lifecycle factories,
error constructor and types from `@en-reve/primitives/interactions/registration.js`.
Both entries share the same manifest import cache and registry request cache;
`DefinitionLoadError` has the same constructor identity through either entry.

Use `selectDeliveryProfile()` from `delivery-profiles.js` for the canonical eager
manifest, or explicitly select `en-reve/date-picker-single-deferred`. The latter
replaces only the date-picker definition entry with its same-constructor shell.
`delivery-date-picker.js` exports `datePickerSingleDeferredProfile` for selective
consumers that do not need the complete tag manifest. Both forms require
`calendarLoading = 'deferred'` and `selection = 'single'` before the first update;
profile selection never changes properties on an existing instance. Eager imports,
`define/*`, range date selection and `registerAll()` keep their existing behavior.

```ts
import type {EnDatePicker} from '@en-reve/elements/date-picker.js';
import {datePickerSingleDeferredProfile as profile} from '@en-reve/elements/delivery-date-picker.js';
import {createDefinitionLoader} from '@en-reve/elements/lazy-loader.js';
import {prepareDelivery} from '@en-reve/elements/delivery.js';

const loader = createDefinitionLoader(scope.registry, profile.loaders);
await loader.ensure(['en-date-picker']);
const picker = scope.createElement('en-date-picker') as EnDatePicker;
picker.calendarLoading = 'deferred';
picker.selection = 'single';
form.append(picker);
// Optional application-owned intent preparation; this does not open the picker.
await prepareDelivery(profile, ['en-reve/en-date-picker/calendar']);
```

`deliveryCatalog` from `delivery-catalog.js` is inert, generated discovery data for
the exact canonical catalog, profiles and assessed internal features. Construction,
optional code, registration, hydration, data and virtualization remain separate
costs. A discovered feature can be essential, conditional or inapplicable;
`prepareDelivery()` rejects anything without an implemented code binding. The
small selectors do not import the complete discovery catalog. Full profiles also
expose `en-reve/en-command-palette/root` for the existing application-owned
`createElementActivation` pattern; preparation does not own its root or readiness.

`createDeliveryProfile()` accepts consumer `DefinitionLoaders`, namespaced feature
descriptors, explicit optional preparation manifests and JSON-scalar initial
property requirements. The `en-reve/` namespace is reserved. Duplicate IDs, foreign
namespaces, unknown tags and malformed descriptors fail before imports. Repeated
options wrappers with the same source manifest share one immutable manifest
snapshot; a freshly copied loader record has a distinct identity. Mutating a
captured source manifest is rejected when it is reused. Loader closures remain the
consumer's responsibility; they must not capture request/DOM state in shared code.

Schema version `1` and exact profile ID/version govern compatibility. Feature
descriptors carry a string version too; changing a supported feature descriptor or
adapter requires updating its version and the containing profile version. Use the
frozen `profile.identity` for SSR transport; the executable profile itself is not
an identity. Additive metadata can introduce descriptors, but changing supported
profile behavior requires a new version, and removing or renaming supported IDs
requires documented migration. Independent consumer profiles do not participate
in a global ID registry; authors must keep their ID/version bindings truthful.

`DeliveryError` distinguishes profile validation and feature lookup. Definition
imports and registration retain `DefinitionLoadError` stages. Retry is explicit
and cannot force a browser to discard a failed module, undo partial registration
or unload evaluated code. Existing instance/application owners retain cancellation,
disposal and construction/readiness errors; never replay trusted native picker or
clipboard actions after an asynchronous import. See [delivery recipes](../../plans/lazy-delivery/recipes.md)
for intent, route, visibility, command and SSR ownership.


## Visible validation Parts

Text field, search input, textarea, number field, select, combobox, checkbox, radio
and switch expose `control-invalid` on the same native node as `control` while
associated application or reported constraint feedback is visible. This Part
follows the existing `aria-invalid`/error-message presentation. A pristine empty
required control may fail constraints without exposing `control-invalid`. Clearing
feedback removes the additional Part without replacing the control or changing
value, focus, validation, events or form participation.

Number field also exposes `stepper-invalid` on its grouped perimeter. An adorned
text field exposes `focus-frame-invalid` on its perimeter. These are additive
styling states; the ordinary `control`, `stepper` and `focus-frame` Parts remain.
Use `::part(control-invalid)` for visible error paint and preserve disabled and
forced-color treatment in author styles.
