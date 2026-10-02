# API-09: Composition and authoring parity

Implementation completed, 2026-09-19. The initial Context slice is recorded
in `artifacts/api-09/verification.json`; completion evidence is recorded in
`artifacts/api-09-completion/verification.json`. Included in this production publication; user review remains separate.

## Delivered scope

- `@lit/context` 1.1.6 supplies context keys, providers, subscriptions, and
  late-provider replay. The old `@lit-labs/context` package is a compatibility
  wrapper and is not a dependency.
- Editor triggers and formatting toolbars share capability-based association.
  Explicit `.editor` wins, then same-tree `for`, then ancestor context. An
  unresolved explicit reference remains unresolved; it never falls back to a
  different contextual editor.
- Unknown editor elements are awaited in their owning custom-element registry.
  A null scoped registry is not replaced with the document registry. A stale
  definition callback cannot bind a superseded target.
- Rich editors provide command and extension capabilities to descendants; token
  editors provide extension capabilities. A common ancestor can provide either
  capability for sibling toolbars/triggers. Context does not search sideways.
- Editor/toolbar and color-picker/plane/wheel messages can inherit scoped defaults.
  Each defined local field wins over context, including an intentional empty
  string. Missing fields use the nearest provider, then built-in defaults.
- Carousel slides subscribe to a parent presentation service instead of a
  module-global receiver map. Existing slot/collection reconciliation still
  determines membership, order and per-slide visibility. Requesting context does
  not make an unowned descendant into a slide.
- Authored reorderable trees carry reorder presentation through buffered SSR and
  hydration. Enabled items have drag handles at first paint; shortcut metadata
  follows the existing authored/data rule, including disabled items.

## Using an ancestor provider

```ts
import {LitElement, html} from 'lit';
import {
  ContextProvider,
  editorMessagesContext,
  richEditorCommandContext,
  type RichEditorCommandHost,
} from '@en-reve/elements/context.js';

class EditingScope extends LitElement {
  private translations = new ContextProvider(this, {
    context: editorMessagesContext,
    initialValue: {commands: {bold: 'Gras', italic: 'Italique'}},
  });
  private editorProvider = new ContextProvider(this, {
    context: richEditorCommandContext,
    initialValue: undefined,
  });

  setEditor(editor: RichEditorCommandHost | undefined) {
    this.editorProvider.setValue(editor);
  }
  protected render() { return html`<slot></slot>`; }
}
customElements.define('editing-scope', EditingScope);
```

The application calls `scope.setEditor(editor)` when its sibling editor is ready.
Descendant toolbars without `.editor` or `for` consume that value. Replacing it
releases the prior editor listeners/bookmark before binding the next editor.
An extension service uses `editorExtensionContext` independently; a command-only
editor need not implement extensions.

There must be one provider for a given key on a host. Nested providers replace
the inherited context object; partial **local component** message overrides merge
with that object. Provider values are updated by replacing the value or calling
`setValue(value, true)` after an intentional in-place change.

## Runtime guarantees and boundaries

Internal consumers attach a reference-counted `ContextRoot` to their owner document
before requesting subscribed context. Unanswered requests can be replayed when a
Lit-compatible provider announces itself. A plain protocol implementation that
does not announce late providers must arrange its own retry/availability signal.

Subscriptions belong to one connection. Disconnect clears inherited values and
releases subscriptions. Reconnection requests fresh context. Callbacks from a
previous connection are rejected and disposed. Explicit association also watches
same-tree identity changes and retries after the correct registry defines a target.
Native scoped-registry support remains dependent on the browser.

The exported provider is a thin subclass of Lit's provider. Lit 1.1.6 stops event
propagation; the current community protocol requires **immediate** propagation
stop before delivery. Our wrapper supplies that behavior while retaining Lit's
subscription and provider-announcement machinery. Plain `@lit/context` providers
and consumers remain interoperable.

Capability types are separate from runtime shape checks. Formatting requires the
command, bookmark, selection geometry and state members it actually consumes.
Neither a context key nor a TypeScript type proves arbitrary provider behavior.
Editor state still changes through existing command/event contracts.

## SSR and migration

DOM context events do not run the server's render context. For localized first
paint, pass the same message object explicitly through `.messages` during SSR and
hydrate with that value. Context is an optional browser fallback; it does not
promise server-side ambient message discovery or infer locale from `lang`.
Existing explicit message bindings continue to work without a provider.

Importing `define/editor-trigger.js` now registers only the trigger. Applications
that relied on its former token-editor side effect must explicitly import
`@en-reve/elements/define/token-editor.js`. Catalog registration remains complete.
Normal class/context imports do not register custom elements.

Context keys are versioned, namespaced strings so independent bundles can agree
on identity. Incompatible contracts require a new key version. Providers should
expose public capabilities, never private shadow nodes.

## Reusable definition graph

All 77 components now have one definition in `src/definitions/<name>.ts`.
Definitions refer to other definition objects rather than copying nested tag,
constructor and dependency literals. The catalog and every side-effect-only
`define/<name>.js` entry consume those same objects.

```ts
import {colorPickerDefinition} from '@en-reve/elements/definitions/color-picker.js';
import {registerDefinition} from '@en-reve/primitives/interactions/registration.js';

// registry is the application's chosen registry, including a scoped registry.
registerDefinition(registry, colorPickerDefinition);
```

Class-only, definition-only, catalog and main-barrel imports register nothing.
Selective definition imports load only that component and its dependency closure.
Registration remains dependency-first and idempotent for identical constructors;
identity conflicts are rejected before registry writes. Native registry validation
errors are not transactional.

All 77 individual entry-point dependency closures match the previous entries.
Menu items remain explicit authored-child imports: `define/menu.js` registers only
`en-menu`; `registerAll()` still includes `en-menu-item` as its own catalog root.
The neutral editor trigger likewise does not register an editor implementation.

Metadata and API-reference generation statically read the shared graph without
executing components. Tooling rejects cycles, duplicate roots, copied dependency
objects, missing entry coverage and wrappers that bypass their canonical root.
The definition graph governs registration. Context governs runtime discovery;
they remain distinct mechanisms.

## Original finding closure

| Finding | Delivered resolution |
| --- | --- |
| E5 | Shared capability-based editor resolver, explicit-target precedence, owning-registry upgrades, guarded teardown and neutral trigger imports. |
| N1 | API-04 already unified progress-step authored/data validation and duplicate-key behavior. |
| C08 | Retained and documented plain tree data versus rich noninteractive authored labels; activity/carousel/table renderer documentation names the component-owned semantic wrappers. |
| OVL-03 | API-02 already repaired accordion key/slot and tab/panel ID reconciliation. No Context migration is needed to preserve these guarantees. |
| OVL-14 | Link, navigation, breadcrumb and sidebar guidance explicitly requires native light-DOM anchors; no private shadow-anchor inspection or implicit en-link participation. |
| T10 | Authored/data reorderable tree first-paint and hydration parity. Shared internal buffered-projection utilities remove duplicated restore, context-copy, traversal, text, escaping and edit helpers from form/selection adapters; family validation and generated-slot policies remain local. |
| T11 | One reusable component-definition graph, shared registration entry points, metadata/docs integration, source parity and browser registration checks. |

## Separate follow-up scope

The original API-09 implementation is complete. Further Context Protocol
adoption for owner families and tooltip warmup is separate improvement work, not
an unresolved original audit defect. Chat adapter and focus-participant redesign
remain research only, as requested. The broader API-10 public API graph is also
separate from this component-registration dependency graph.

See [the continuation backlog](component-follow-up-backlog.md#context-protocol-follow-ups).

## Sources

- [Community Context Protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md)
- [Lit context and ContextRoot](https://lit.dev/docs/data/context/)
- [Labs package graduation](https://github.com/lit/lit/blob/main/packages/labs/context/README.md)
