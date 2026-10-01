# Validation summary

`en-validation-summary` consumes an ordered `.items` array of `{target,message}`.
Targets are field IDs in the same document/shadow root as the host. Messages must
match field-level feedback. Empty items render nothing. The `heading` attribute
is a fallback for its named slot. The `description` attribute/property supplies
plain guidance as a fallback for the retained `description` slot. Assigned slot
content always wins, including an empty assigned element. Removing assigned
content restores the current fallback; property writes never replace authored nodes.

On failed validation, render the items, await `updateComplete`, then call
`summary.focus()`. No automatic focus stealing or alert announcement occurs.
The internal section is a named, programmatically focusable region. Public
`focus(options)` forwards to it. Native links are included in SSR. On enhanced
activation the target's public `focus()` handles native or encapsulated controls.

Before focusing, a cancelable `en-action` command is emitted with
`{action:'focus',data:{target,message}}`. Cancel to reveal another step or resolve
a cross-root target yourself, then focus it after rendering. This command does
not change values; all state-control consumers still use only `en-change`.
Modified clicks preserve native link behavior. Missing/hidden targets retain
native fragment navigation; applications must keep their error targets valid.

This component does not discover fields, validate business rules or submit forms.
The supplied multi-step recipe demonstrates those application responsibilities.
Use shared theme tokens plus `base`, `heading`, `list`, `item`, and `link` Parts.
`--en-validation-summary-padding` and `--en-validation-summary-radius` provide
local geometry overrides. Hover decoration is enabled only for hover capability.

Alternatively, author direct native `<a href="#field-id">Rich error text</a>`
children. URI-encode IDs as needed. They take precedence over `items`; removing
the last child restores the array. Live insertion, removal, reordering, `href`,
`hidden`, and text changes are observed. Hidden links are excluded. Wrappers and
forwarded lists are not traversed. Use noninteractive content inside the links.
Malformed links produce an authoring error (`error` Part), not an array fallback.
Original anchors and bindings are retained, including native modified-click,
`download` and `target` behavior. Style these anchors directly; `link` Part is
for array-rendered links. Use `@en-reve/ssr` `renderToString()` to render the
child-derived list on the server. Generated slots and snapshot metadata are
internal; consumers never author them.
