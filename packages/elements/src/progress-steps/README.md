# Progress steps

`en-progress-steps` renders a named navigation and ordered list of native buttons.
Supply `.items` (`ProgressStep[]`) and a current `value`. The application owns
completion, availability, validation and panel rendering. `readonly` renders a
static status list; `disabled` prevents interaction while preserving state.

The single cancelable `en-change` exposes the tentative value during the handler.
Cancel to roll back; explicit author writes win. Silent `.value` assignment is the
application update API. Neither moving forward nor setting a value marks steps
complete. Unknown/removed current values are retained, with no current UI marker.
Array items and authored descriptors both require unique nonblank string values
and pending/complete/error statuses. Invalid data renders the error part and no
partial step list. Values are never trimmed; child precedence is preserved.

`slot="step-{value}"` customizes a label with noninteractive phrasing content.
The fallback label and pending/current/complete/error text are localizable.
Keep controls out of label slots. The component owns the native buttons and list
semantics. Alternatively, author direct `en-progress-step` children with unique
`value`, `status`, `disabled`, `hidden`, and noninteractive rich label content.
The optional `label` attribute supplies plain compact text and empty-slot fallback.
Children take precedence over `items`; removing the last restores the array.
Insertion, removal, reordering, property, attribute and text edits are observed.
Hidden children are excluded; malformed or duplicate children show an authoring
error rather than silently falling back. Wrappers and forwarded lists are not
traversed. Original child nodes and bindings are preserved. Do not author their
internal generated slot names. Use `@en-reve/ssr` `renderToString()` for the same
child-derived initial HTML and hydration. The parent still owns all navigation.

SSR produces the same native list and state as hydration. Native buttons have
ordinary Tab/Enter/Space behavior, not tab-widget arrow navigation. Consumer
validation, panel navigation and focus remain JavaScript/application responsibilities.

Shared action, color, focus and spacing tokens apply in every theme. Above 30rem of container width the complete list is visible. At or below 30rem,
a native compact disclosure shows “Step 2 of 3 · Review date”; expanding reveals
the same ordered list. It also works without JavaScript. Accepted selection closes
it; a veto leaves it open, and Escape closes it. Resizing preserves focus.
Localize `summary-label` (`{current}`/`{total}` placeholders) and `completed-label`
(`{total}`); `slot="summary"` can replace the whole summary with noninteractive
content. The fallback uses the current item's plain `label`, even when its full
step uses a rich label slot. Completed items produce “All 3 steps complete”.
`disclosure-control` and `disclosure` Parts complement the list/control Parts. CSS Parts expose each layout/label/status surface, and
`--en-progress-steps-gap` overrides spacing. Hover is capability-gated by shared
button styling. No versions are bumped in the current iteration.
