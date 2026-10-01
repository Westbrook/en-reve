# Shared modal trigger relationships

The user approved optional `for` associations for dialogs and drawers. A literal
ID resolves a native button or `en-button` within the modal's own Document or
ShadowRoot. Drawer and command palette inherit the same dialog relationship;
there must be only one controller and one opening transaction per activation.

Keep imperative `show()` and authoritative `open` assignments available without
a trigger. `for` is an optional opener, not a requirement for rendering a modal.
Use the shared ID-reference observer for late insertion, replacement, rebinding
and cleanup. Preserve consumer-owned ARIA when releasing an old trigger.

Opening follows the existing synchronous cancelable `en-change` contract with
reason `trigger`. Honor already-canceled click events and disabled/loading
openers. Applications should cancel `en-change` to reject opening independently
of click-listener registration order. Native form buttons must not submit as a
side effect of an associated activation. Prefer explicit `type="button"` in
authored native markup, including the server-rendered initial state.

Record the actual accepted opener for focus return, including pointer activation
on platforms that do not focus buttons on click. An unrelated authoritative
state write or rejected proposal must not leave a stale opener. Programmatic
opening keeps the existing previous-focus behavior. Missing or removed openers
must not cause focus to move to an unrelated replacement element.

Demonstrate the relationship in shared sticker/API examples, the themed motion
comparison and single-opener Showcase actions. Preserve application-driven
multi-opener flows. Verify keyboard/pointer use, cancellation and ownership,
ARIA, same-root isolation, dynamic relationships and focus across the installed
browser engines. Physical assistive-technology acceptance remains separate.

This pass does not implement the separately discussed file-upload `for` drop
association or add direct element-reference properties.
