# Application-owned navigation and choice projection

The [packed projection consumer](../../../probes/projection-recipes/recipes.ts)
composes the public helpers into application-owned Lit elements. It imports no
`@en-reve/elements` definition or catalog. The application supplies labels,
authored children, state, semantic controls, event acceptance and styling.

## Native breadcrumb projection

```ts
import { LitElement } from 'lit';
import { BreadcrumbsProjectionController } from '@en-reve/primitives/interactions/breadcrumbs-projection.js';
import { breadcrumbsTemplate } from '@en-reve/primitives/templates/breadcrumbs.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { navigationStyles, breadcrumbHostStyles } from '@en-reve/styles/navigation.js';

class ProjectPath extends LitElement {
  static shadowRootOptions: ShadowRootInit = { mode: 'open', slotAssignment: 'manual' };
  static styles = [foundationStyles, blockHostStyles, navigationStyles, breadcrumbHostStyles];
  private projection = new BreadcrumbsProjectionController(this);
  render() {
    return breadcrumbsTemplate({ label: 'Project path', ...this.projection.view });
  }
}
customElements.define('project-path', ProjectPath);
```

Author direct native anchors and noninteractive spans. Their URLs, rich phrasing,
listeners and explicit `aria-current` stay application-owned. The controller
projects the original nodes into keyed list wrappers. It observes child/visibility
changes and releases only its own assignments on disconnect. It does not route,
select a current entry, move focus, sanitize URLs or clone links.

The paired template supplies the named landmark, ordered list, decorative
separators and visible diagnostics. Preserve that canonical structure when using
the controller. Unsupported direct children and conflicting slot attributes
produce diagnostics; they are not silently rewritten. Do not author projection
slots or private plan metadata. Ordinary `hidden` is supported; `until-found` is
not. A pre-existing named root keeps named assignment; a new manual root avoids
adding slot attributes to the native children.

The consumer tests cover both client root modes. They do **not** prove server
rendering or hydration of an application-owned class. The delivered element's
buffered SSR adapter is a separate integration described in [navigation](navigation.md).

## Default-slot navigation

`slottedNavigationTemplate({ label })` from
`@en-reve/primitives/templates/slotted-navigation.js` renders a named native
landmark containing the ordinary default slot. Pair it with `navigationStyles`
and `navigationHostStyles` in the application-owned shadow root. Native links
retain sequential Tab order, Enter, fragments, history and cancellation. The
application owns `aria-current`; a URL change does not rewrite it. No roving
focus, automatic routing or new control role is introduced.

## Authored choices with native controls

`SelectionChildrenController(host, 'segmented')` consumes the documented
`en-segmented-item` descriptor vocabulary. This kind expects nonempty unique
`value` attributes and noninteractive rich labels. Descriptors do not own checked
state. They can remain ordinary unregistered custom-tag nodes in an
application-owned consumer; their tag names are the helper's fixed input
contract, not a configurable application schema.

Read `controller.view` when rendering. Its keyed entries provide values,
visibility, disabled state and diagnostic text; project original label nodes
through slots named with `SELECTION_SLOT_PREFIX + item.key`. The controller owns
these generated assignments and observes label/attribute changes. In the linked
recipe the application creates native radio inputs and associates each with its
projected label, using keyed rendering to retain native control identity.

The helper does not own selected value, form behavior or events. The recipe uses
synchronous cancelable `dispatchChange` for application state, stages tentative
selection, rolls back rejection, and rechecks `controller.current()` before
commit so newly hidden/disabled or invalid choices cannot be accepted. Silent
authoritative `value` writes advance the application's revision. Lit's `live`
directive reconciles native checked state after browser activation, including a
veto that leaves the model unchanged. These are application responsibilities,
not extra behaviors of the child-normalization helper.

This is a native-radio composition of the **segmented descriptor** mode. Other
select/choice/checkbox modes, form-associated wrappers, SSR plan preparation and
all owning-element behavior matrices retain their separate evidence. The
[36-case packed matrix](../../../probes/projection-recipes/README.md) checks rich
names, disabled and hidden choices, accepted/canceled changes, silent writes,
dynamic insertion, validation recovery, node identity, reconnect and transfer
between instances. Automated DOM/role checks do not establish screen-reader speech.
