# Segmented item descriptor

`en-segmented-item` supplies a unique nonempty `value`, optional `disabled`/`hidden`, and noninteractive rich label content to its direct `en-segmented-control` parent. An unused default slot falls back to `label`. The parent renders the native radio and owns selection, keyboard entry and the form entry; this descriptor adds no focus stop.

Original label nodes are projected rather than cloned. Do not author `slot`, `selected` or `checked` on the descriptor, or place links/controls/editable content in its label. See [Segmented control](../segmented-control/README.md) for precedence, SSR and mutation behavior.
