# Token theme and API review — 2026-09-15

The prior delivery gave static text chips almost no geometry and gave the color
button an unrelated 32px bordered box. Only three ad-hoc properties existed, and
they were absent from full-theme resets and the managed token editor.

The new delivery uses one inline token surface, legible untruncated content,
wrapping, neutral fill, border, consistent spacing, and state paint only for
actionable chips. Color swatches remain visual-only with a named wrapper.
Reference and tool tokens can also open their installed extension. Missing
extensions disable the action until registration returns. Hover is gated by
`(hover: hover)`; focus keeps the existing immediate contour and themed halo.

| Theme | Token interpretation |
| --- | --- |
| Default | Shared control contour, neutral subtle surface, text and line roles |
| Spectrum 2-inspired | 8px contour, neutral light/dark paint and shared Spectrum focus |
| Fluent-inspired | 4px contour, neutral selection tags and Fluent focus |
| Astryx-inspired | Pill contour, existing Astryx surface/text and focus roles |
| shadcn-inspired | Pill contour, restrained monochrome secondary-badge treatment |
| Holotable-inspired | 4px contour, existing warm light/cool dark surfaces and strong focus |

These are editor adaptations, not claims of pixel-identical source components.
Spectrum [S2 TagGroup](https://react-spectrum.adobe.com/TagGroup) and
[design data](https://opensource.adobe.com/spectrum-design-data/tokens/tag/)
provide tag sizing/spacing context. Fluent distinguishes selectable-value tags
and interaction tags from static badges in its
[Tag guidance](https://fluent2.microsoft.design/components/web/react/core/tag/usage).
The [shadcn badge](https://ui.shadcn.com/docs/components/base/badge) provides a
compact secondary/outline visual reference, not the editing behavior contract.
Astryx and Holotable retain the previously reviewed palette/focus interpretation;
no authoritative editor-token spec was established for either.

Managed paint/geometry settings are `component.editor-token.{background,color,
border-color,hover-background,pressed-background,radius,padding-inline,
padding-block,gap,min-size}`. Full theme resets clear their pins, paired themes
keep per-mode colors, and defaults use shared semantic roles. The demo exposes
Load sample chips, theme/appearance controls, and opt-in trigger restoration.
A consumer may use `::part(token)`, `::part(token-interactive)`,
`::part(token-content)` and a registered type-specific Part. Interaction targets
remain protected; CSS Parts can still intentionally override styling.

Review text and swatch alignment, focus visibility, wrapping in RTL and narrow
layouts, hover/pressed contrast, and actual mobile/VoiceOver editing. Native
chooser presentation remains platform-owned.
