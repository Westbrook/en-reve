# Tree item

`en-tree-item` is the slot-authored child of `en-tree`. See the
[tree contract](../tree/README.md) for state ownership, hierarchy, keyboard,
SSR/hydration and customization. The item exposes `key` (legacy alias: `value`), `label`, `disabled`
and the standard `size` scope; it emits no separate state-change event and has
no independent selected/expanded API.
