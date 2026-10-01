# Inspired toast delivery audit — 2026-09-15

The first toast used page-surface tokens and a semantic border. That delivered theme
consistency, but did not capture each source's notification treatment.

| Inspiration | Primary evidence | This pass | Remaining adaptation |
| --- | --- | --- | --- |
| Spectrum 2 | [S2 implementation](https://github.com/adobe/react-spectrum/blob/main/packages/@react-spectrum/s2/src/Toast.tsx) | Saturated semantic fills, white ink/icon, 12px corners, 336px preferred width, 8px gap, elevation. | Existing reviewed light semantic ink is reused as fill in both modes; these are approximations, not newly pinned S2 color values. Uniform padding and protected close targets differ from source geometry. Expandable stack and centered placement are separate work. |
| Fluent 2 | [Toast styles](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-toast/library/src/components/Toast/useToastStyles.styles.ts), [usage](https://fluent2.microsoft.design/components/web/react/core/toast/usage) | Neutral surface, 4px corners, 12px inset, semantic icons, 16px region spacing. | Existing one-layer elevation approximates shadow8. Rich title/body content remains consumer composition. Max-visible queue and newest-at-edge policy are not implemented. |
| Astryx | [Toast source](https://github.com/facebook/astryx/blob/main/packages/core/src/Toast/Toast.tsx), [tokens](https://github.com/facebook/astryx/blob/main/packages/core/src/theme/tokens.stylex.ts) | Inverted surface and error-inverted red, contrasting content/close, 16px inset, 12px corners, 400px width. | Core inverted tokens supplement the existing branded-site recipe. Shared decorative status glyph and protected close target differ from the source's plain body row. Swipe and exit gestures remain separate work. |
| shadcn/Sonner | [Official Sonner wrapper](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/sonner.tsx) | Neutral popover-style surface, theme border/radius, status glyph and elevation. | Keeps the existing Sonner reference; the current docs URL now redirects to Base Toast. Shared glyphs are not Lucide copies. Collapsed stack, swipe and action placement remain adaptations. |
| Holotable | [Existing observed reference mapping](./holotable-theme.md) | Explicit local surface, ink, radius and elevation aliases preserve the inspected theme. | No toast-specific reference was observable in this audit. This is a coherent extrapolation, not a verified match. |

Source files above were read from official main branches on the audit date;
no new release-pin identity is asserted. Existing candidate provenance remains intact.

## Public customization

Managed `component.toast.*` roles cover background, color, border-color, icon-color,
radius, padding and shadow. Each of info/success/warning/danger can override its
background, color, border and icon. `component.toast-region.width` and `gap` cover
viewport geometry. Paired JSON generation emits light-dark colors as before.
Specific status paint wins over general toast paint. CSS Parts retain local control.
A decorative `icon` slot can replace the default without duplicating spoken content.

No timeout, announcement urgency, focus movement or queue policy changes are encoded
in a visual theme. Persistent defaults and explicit urgency remain intentional.
Consumers should compare the new status-variant demo in both modes and mobile RTL.

## Follow-up status

The subsequent bounded-stack pass implements max-visible admission, paused waiting
timers and explicit interrupt admission. See [the notification plan](./toast-notifications.md).
Visual layers indicate waiting messages; expandable history remains below.

## Follow-up candidates

- Expand the implemented bounded visual stack into optional navigable history with recoverable messages.
- Add logical horizontal placement and placement-aware entrance/exit transitions.
- Explore swipe dismissal while preserving scrolling, actions and canceled en-change.
- Consider optional direct notification-region keyboard navigation and return focus.
- Provide rich title/body/action recipes and per-toast icon visibility when required.

These are recorded for planning, not claimed as implemented or user-approved.
