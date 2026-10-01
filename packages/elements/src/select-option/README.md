# Select option descriptor

`en-select-option` supplies an explicit `value`, optional `disabled`/`hidden`, and a plain label to its direct `en-select` parent. Nonempty text wins over the `label` fallback. The parent renders the actual native option and owns selection, validation, reset and the form entry.

Use `en-select.value`, not `selected`/`checked`. These descriptors are not native options and their DOM identity is not the identity of the internal option. See [Select](../select/README.md) for precedence, SSR and mutation behavior.
