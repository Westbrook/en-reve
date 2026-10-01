# Holotable reference refresh

Inspected September 20, 2026 UTC, in the authenticated in-app browser: [Holotable](https://swccg-holotable.reve-ai-0869.chatgpt.site/) home and Card archive, including the opened Side select. The current observed stylesheet is [index.KHRTEubt.css](https://swccg-holotable.reve-ai-0869.chatgpt.site/_next/static/css/index.KHRTEubt.css). This is an observed asset identity, not a release or content hash. The public web retriever could not access the page; authenticated DOM/computed-style and stylesheet-rule inspection supplied the findings.

The charcoal/amber palette is unchanged: canvas `#0c0e10`, card `#131619`, popup `#181c20`, main ink `#f2efe8`, muted ink `#969b9e`, amber `#edac62`. No light appearance was established; the light theme remains an explicitly authored warm-paper adaptation.

## Applied refinements

| Detail | Fresh source observation | Current theme implementation |
| --- | --- | --- |
| Font | Arial, Helvetica, sans-serif; body 14/21 | Exact local stack across body, UI, input, metadata and headings. No font asset required. |
| Heading hierarchy | Home hero 42/45.36, archive title 25/37.5, secondary card heading 19/28.5; weight 500 | Large/medium/small roles now use these sizes, line heights and weights. They are semantic mappings of different source contexts. |
| Corners | Button 5px, card 7px, popup/field 8.4px, option 6.4px | Exact dimensions in rem in trusted source baseline; previous managed rounding removed. |
| Popup elevation | Two visible layers: 0 4px 6px −1px / 0 2px 4px −2px, both black 10% | Structured two-layer `shadow.overlay` using existing typed API; no one-layer approximation. |
| Popup border | 1px main text color in dark | Option-list border now follows main text in dark. Light retains its functional boundary adaptation. |
| Selected option | Selected option has no persistent fill; highlighted option uses `#262a2d` | Transparent selected fill; hover/active roles retain subtle surface; checkmark remains. Prior navigation-brown fill removed from selected options. |
| Hover | Source global button `filter:brightness(1.1)` | Primary dark hover is the equivalent clamped fill `#ffbd6c`, with stable readable ink; filter is deliberately not applied to component content or semantic danger buttons. |
| Focus | Global 2px amber/4px offset; catalog controls 2px `#e3b76b`/3px offset | Shared contour retained; separate input-family focus color and offset now reflect catalog controls. Light uses its contrast-adjusted focus. |
| Toast | Source Sonner focus/elevation pattern includes black 10% 0 4px 12px | Dedicated toast shadow separated from popup elevation. Previous source toast audit remains the basis for other toast roles. |
| Timing | 180ms transitions and 150ms popup entry | Exact source durations retained via code baseline. Anchored geometry stays stable. |

## Deliberate adaptations and remaining limits

- Source controls are 12px, options 14/20, search text 11px. The existing 16/24 control and input metrics remain an explicit usability adaptation, including native mobile picker behavior, text growth and protected targets. A theme does not replace source application layout or card artwork.
- The source uses role/context-specific tracking (hero −1.5px, archive title −0.6px, secondary heading −0.3px), uppercase eyebrow labels and image/gradient compositions. Current typed typography lacks tracking; those are possible through public CSS/Parts but are not carried by the portable JSON theme. No global uppercase or image treatment is added to unrelated component content.
- Input-only border/radius state hooks would allow the catalog/search distinction without broad shared-control pins. Current common input geometry follows the source select as the most reusable reference.
- Source button brightness affects nested ink and images as well as fill. Semantic state tokens preserve readable ink and avoid that broad filter effect. Pressed amber remains a documented authored state because a distinct source pressed value was not established.
- Light has no observed source, so geometry and typography are shared while colors are independently authored. Its source-fidelity claim is intentionally narrower than dark.

Recipe replay for both branches with their trusted baselines returned zero compiler diagnostics. Rendered checks and current artifact identities are recorded in the consolidated [refresh report](theme-refresh-report.md).
