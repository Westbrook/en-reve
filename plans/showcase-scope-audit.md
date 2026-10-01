# Showcase scope audit

Requested 2026-09-11: a dense, interactive page inspired by the shadcn/ui homepage, using existing patterns, with whole-page theme JSON drops and an explicit list of unbuilt/unplanned gaps.

The audit compared the current 46-tag CEM, element/style/primitives sources, all 16 existing Markdown plans, and the 72-pattern inventory with the [homepage](https://ui.shadcn.com/) and official component catalog. Tag counts and pattern counts measure different things; neither is an acceptance claim.

## Neither implemented nor explicitly planned

| Dedicated pattern | Reference relevance | Current substitute / boundary |
| --- | --- | --- |
| Data charts and visualization | Contribution bars and analytics in the homepage | Showcase uses an authored semantic figure with a data table. A reusable chart family needs series/scales, legends, inspection, accessible alternatives, and theme roles. |
| QR-code generation/display | Device connection tile | A genuine copyable/openable link; pairing services remain application-owned. No fake QR graphic. |
| OTP/PIN entry | [Input OTP](https://ui.shadcn.com/docs/components/input-otp) in broader catalog | Ordinary text entry exists; coordinated paste, autofill, and presentation do not. |
| Hover-preview card | [Hover Card](https://ui.shadcn.com/docs/components/hover-card) in broader catalog | Tooltip and click-triggered popover foundations exist, but no rich preview hover/focus lifecycle contract. |
| Custom scroll area | [Scroll Area](https://ui.shadcn.com/docs/components/scroll-area) in broader catalog | Native scrolling exists. No dedicated cross-browser scrollbar presentation. |

These remain discussion candidates. This audit does not expand the committed 72-pattern scope.

## Already retained scope

Calendar/date picker, carousel, table, pagination, upload, toast, tree, rich text, progress steps, nested navigation/sidebar disclosure, menu submenus/checkable/radio items, and richer chat/transcript/composer/attachments are already retained in the inventory or supporting plans. The current native `en-date-input` can serve date fields now. The implementation has a limited nine-glyph icon set; matching every reference icon is an asset coverage gap, not a new UI pattern.

Cards, metadata, headings, dividers, keyboard-key labels, generic input groups, and layout use native composition or existing recipes. Do not inflate scope by counting synonyms as missing elements.

## Delivered review surface

`/showcase` composes 16 cards in explicit responsive columns, preserving visual and DOM order. Each stateful card has a reset outside the reset subtree. The page has SSR, theme selection, Auto/Light/Dark, reading direction, keyboard/mobile file intake, and per-theme JSON downloads. Inspired presets are generated from the canonical candidate inputs; imported files use the existing integrity and exact-build validator. Theme application updates document tokens and preserves control instances/drafts and open overlays. Theme Reset does not reset example data.

The page is a local simulation: no authentication, outbound invitations, real chat service, or cloud persistence is implied. Its source separates fixture data, interaction ownership, templates, styling, and preset generation. Future changes should extend these boundaries rather than copying demo markup into library components.
