# Pagination width and alignment review

Status: user accepted the recommendation; implementing the default with CSS Parts distribution surfaces. Original visual-review evidence follows. Published component source remains 384f338221221cf5ec81fc3ad534f6500a3b818a (Site 96). Trials use the actual built component with isolated experimental style sheets; no production CSS was edited.

## Findings

Current wide and intermediate actions shrink-wrap at inline-start, whereas compact actions and arrow buttons stretch. In the default theme at page 6 of 40, a 960px host has a 475.19px actions box; a 576px host has a 368.56px actions box. A 384px compact host has a 384px actions box, with each arrow button approximately 123.7px wide rather than its natural 44px.

Compared current, grouped-center, edge-distributed and recommended combined treatments in live browser rendering. Full comparison and light/dark recommendation screenshots are alongside this note.

## Recommended default

| Delivery | Host/actions relationship | Distribution |
| --- | --- | --- |
| Wide | Actions occupy available host width | Center one intrinsic-sized cluster: Previous, seven page positions, Next. Center status underneath. |
| Intermediate | Same full-width actions box | Same centered cluster and spacing, reduced to five page positions. |
| Compact | Same full-width actions box | Equal side tracks; natural-sized Previous at logical start, status/chooser group in the middle, natural-sized Next at logical end. |

Full-width actions should not imply stretched buttons or page cells. Avoid space-between across desktop controls: the measured cluster expands from 467px to 952px between the arrows at a 960px host, leaving the arrows visually detached. The same distribution is useful on compact widths because there are only three functional destinations and the span is short. It stabilizes arrow locations as the status changes.

Use safe center for wide/intermediate grouping rather than per-button margins. If outer auto margins are preferred, place them only around the whole cluster, not around every numbered button. Compact grid alignment is more explicit than margins: logical start/end on arrow buttons, centered middle. Preserve DOM/Tab order and RTL semantics.

Allow compact status to stay on one line when it fits, with wrapping when constrained. The trial relaxes the current 8ch cap to 14ch; final sizing must be checked with localized strings and long custom button labels.

## Customization and follow-up implementation

Keep the host block-sized to its consuming container, and keep existing action/control/status parts. Offer one documented logical alignment token for wide/intermediate (start, center, end), applied to both group and status; keep compact edge behavior intentional. Theme geometry, target sizes and focus clearance remain inherited. Do not introduce per-page margins, absolute positioning, or separate breakpoint-dependent DOM trees.

Before adopting: test themed densities, long and asymmetric slotted labels, small counts, unknown totals, enlarged text, forced colors, keyboard transitions at container breakpoints, and popover focus return. Native page-level reflow must remain intact. Retained focused numbered rows must retain reachable scroll origins in LTR and RTL.

## Evidence and limits

Prototype checks passed in Chromium, Firefox and WebKit: 24 engine/direction/width combinations (LTR/RTL at 320/384/576/960px), five page positions each. Actions matched host width, default controls did not overflow the actions scrollport, and Previous/Next positions remained stable. Light/dark screenshots were visually inspected in Chromium. These are exploratory checks, not production regression tests or physical-device/assistive-technology sign-off. Independent accessibility/usability review agreed on grouped wide/intermediate and compact edge controls.

CSS overflow alignment supports safe centering that falls back toward the scrollable start when content is too large: https://www.w3.org/TR/css-align-3/#overflow-values . This supports implementation safety; it does not mandate a visual alignment choice. Reflow guidance: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html .
