# Menu item

Use `en-menu-item action="download">Download</en-menu-item` inside `en-menu`.
The native `button type="button" role="menuitem"` supplies Enter/Space/click
activation and never submits a containing form. `action` is a string application
key; the component dispatches cancelable `en-action` and executes no command.

`disabled` keeps the item discoverable by menu arrows and exposes aria-disabled,
while suppressing action dispatch. The default label must be noninteractive.
`prefix` and `suffix` are decorative slots; `shortcut` displays a hint without
registering it. Give icons meaningful command text through the default label.

`focus(options?)` targets the actual menuitem control. The menu borrows its tab
stop internally, preserving the native node and avoiding a second host focus
stop. Consumers need no shadow query or private control access. Size defaults
to medium; explicit `size="inherit"` follows the containing menu scope.

Parts: `control`, additive `option`, additive `option-disabled`, `label`, and
`shortcut`. Shared option row hooks supply rest, hover, active, pressed and
disabled paint. Use `type="checkbox"` or `type="radio"` for persistent `checked` state. Radio
`name` values group choices within their owning menu. These choices emit a single
cancelable `en-change` and stay open. `checkmark` reserves stable space whether
checked or not; `submenu-indicator` exposes the decorative library chevron.
See [menu](../menu/README.md) for command cancellation and dismissal timing.
