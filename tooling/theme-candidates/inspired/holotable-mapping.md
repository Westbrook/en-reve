# Holotable-inspired paired theme

This is a review candidate, not an adopted official theme. The authenticated [SWCCG Holotable reference](https://swccg-holotable.reve-ai-0869.chatgpt.site/) was inspected by the parent agent on **2026-09-11 UTC**, including its opened Side select. The observed stylesheet was [`index.BKbit8v0.css`](https://swccg-holotable.reve-ai-0869.chatgpt.site/_next/static/css/index.BKbit8v0.css). Its filename is an asset identifier, not a verified release or content hash. Anonymous requests returned sign-in chrome, which is excluded from this theme.

The dark branch uses the inspected charcoal/amber palette. The light branch is a **proposed warm-paper adaptation**; no light reference appearance was established. Exact observations, recipe hashes and all adaptations are recorded in [the provenance record](./holotable-provenance.json).

| Surface/role | Observed dark reference | Candidate mapping |
| --- | --- | --- |
| Page/card/popup | `#0c0e10` / `#131619` / `#181c20` | Canvas, surface, raised surface; deck-tile card override `#15181b` |
| Main/muted text | `#f2efe8` / `#969b9e` | Shared main/muted roles; observed input ink `#d6dadc` remains independent |
| Brand/action | Amber `#edac62`, primary ink `#1e1a15` | Brand/action and readable amber action-text; explicit dark ink on fills |
| Current navigation / focused option | `#29241f` / `#262a2d` | Selected/accent-subtle and hover/active row fills; selected/pressed option mapping is a cross-surface adaptation |
| Danger | `#ef7474` | Danger text; warning takes amber and success retains the library mode default |
| Boundaries | Subtle `#292d31`, field `#32373c`, opened popup `#f2efe8` | Decorative line keeps source `#292d31`; functional boundary uses stronger source-muted `#969b9e` |
| Fonts | Body Arial14px; buttons/select12px; options14px/20px | System sans;14px body; shared16px/24px control and option metrics; independent400/600 weights |
| Geometry | Button5px, card7px, select/popup8.4px, row6.4px | Managed button6px, card/control/popup8px, row6px;16px button and12px field inline padding |
| Focus | Button/link2px amber contour,4px offset | Same global contour; options retain safe contextual inset focus |
| Motion | Trigger180ms; popup entry150ms fade/zoom | Fast180ms and new surface enter150ms; anchored menus add elevation, while popovers, combobox suggestions and enhanced select pickers fade without transforming their calibrated geometry |

The candidate retains comfortable density, selected-size derivations, shared minimum control geometry, coarse-pointer target budgets, text-growth behavior, forced-color contours, reduced-motion alternatives and public overrides. Source43px buttons/41px inputs are represented by the shared content/target envelope; the theme never forces a literal height or shrinks text to make a match.

Popup4px inset and8px symmetric row inline padding use the current shared list contract. The source’s32px trailing reserve is represented by the library’s own check/shortcut layout. A6px row within an8px popup is an explicit source-inspired override, not the default concentric formula. Existing one-layer elevation substitutes for the source two-layer shadow. The more subtle source search/card variants do not justify new component families.

All existing field, menu, combobox, enhanced-select, toolbar, command-palette and asset supporting surfaces use the same semantic graph. Card images remain authored content and are not tinted or replaced by the theme. The new global entry duration also affects the dialog family; that extension is an adaptation because only the opened select’s entry timing was observed. Exit duration, easing, zoom amount and translation retain baseline behavior because the reference values were not established.

Palette arithmetic in the drafting handoff checks opaque text/fill/focus/boundary pairs. It is not browser evidence: actual composed states, image surroundings, errors, selected labels, keyboard focus, narrow layouts, enlarged text, RTL, reduced motion and forced colors still require exact-build review. The generated pair now passes managed replay, exact reopen/export and the maintained cross-browser candidate journeys on build `edd09329014f`; see [the checkpoint receipt](../../../artifacts/asset-browser-followups/verification.json). No theme adoption, source-fidelity certification or manual assistive-technology coverage is asserted.
