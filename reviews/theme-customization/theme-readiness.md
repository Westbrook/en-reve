# Readiness for three divergent themes

**Current status — September 19, 2026:** THEME-01–08 are published. CSS-source authoring and the three-theme proof are accepted. Review the [remaining follow-up plan](#theme-decisions-follow-up-implementation-september-19-2026) and [delivered proof](/theme-proof.html?progress-report). The following preserves the original audit and readiness criteria, not an outstanding implementation backlog.

## Historical audit context

The next theme phase should demonstrate range of expression, not three new accent palettes. It is future work after the audit decisions and cleanup. The directions below are candidate stress tests, not approved designs.

## Why the current presets do not prove the full range

The five inspired presets intentionally adapt related application design systems. Their recorded rationales repeatedly retain system fonts, protected targets, conventional control shapes and limited elevation. Four use compact density, while Holotable uses comfortable. Their adaptations are useful baselines, but do not establish that a radically different typographic, spatial or material language is easy to deliver. Evidence: `tooling/theme-candidates/definitions.json:1` and the paired inputs under `tooling/theme-candidates/inspired/`.

Do not remove these existing presets to make the new examples look more different. Use the same component demonstrations and application tasks so visual differences can be attributed to supported themes.

## Three independent directions to test

| Candidate direction | What it would stress | Avoid |
| --- | --- | --- |
| Editorial workspace | Distinct heading/body/control typography, generous rhythm, restrained surfaces and borders, strong hierarchy with little elevation. | Styling only the page headings while controls retain the old visual language. |
| Precision instrument | Dense information layout, crisp geometry, tabular data, carefully separated control families, strongly legible status and focus. | Shrinking interactive targets below the shared accessibility floors to manufacture density. |
| Expressive studio | Bold shapes and color relationships, contrasting surface treatments, richer elevation/material, distinctive but optional motion. | Using color alone for meaning or adding decorative motion that ignores reduced-motion settings. |

Change at least typography, geometry, spacing, surface treatment and interaction-state language across the set. Palette and light/dark differences alone are insufficient. Final art direction can be selected when that phase starts.

## Required evidence before describing themes as robust

| Scenario | Expected result |
| --- | --- |
| System theme replacement | One theme artifact changes the application and its native controls coherently without per-page fixes. |
| Buttons only / inputs only / both | Each documented family scope changes only its declared members; a shared scope reaches every promised member. Composite controls follow the documented rule. |
| One visual concept | Radius, typography, spacing or state paint can change without unintentionally flattening other concepts. Explicit component pins follow the adopted precedence. |
| Local application region | A sidebar or inspector can vary without changing siblings. Full nested themes clear theme pins; partial scopes retain unrelated values. |
| Shadow roots and overlays | Internally rendered dialog/popover/menu/tooltips inherit the correct theme. Application portals have an explicit boundary recipe. Named selectors inside shadow roots are demonstrated honestly. |
| Early and late components | Buttons, text fields, options, editors, color controls, dates, tables, trees, toasts, carousel and activity feed all exhibit the intended theme. |
| Interaction states | Rest, hover, pressed, selected, focus, disabled, readonly, invalid and loading remain distinguishable where applicable, including combinations. |
| Size and density | Small/medium/large, explicit inherit and all density contexts preserve layout and documented touch-target floors. |
| Access preferences | Touch, keyboard, forced colors, reduced motion, zoom and text enlargement retain usable content and focus. Hover remains gated by hover capability. |
| Appearance and writing direction | Both appearances and mixed nested appearances work; logical geometry survives RTL. Vertical writing support is evaluated only where claimed. |
| Long/variable content | Multiline labels, localization, long drafts, dynamic data and empty/loading states avoid clipping or an unexplained style fallback. |
| Customization escape hatch | Required departures use documented hooks, Parts, slots or authored content; no private shadow access. |

## Reusable verification, not one-off screenshots

Create one small theme-contract fixture with outside siblings, a partial region, a full nested region, controls with explicit sizes and their composite equivalents. Add computed-style assertions for representative roles, then use the same fixture in Chromium, Firefox and WebKit. Maintain deliberate exceptions as data rather than spreading browser or component skips through tests.

Visual review should use unchanged representative application layouts plus selected interaction states at desktop and narrow sizes. Record a workaround ledger: public token, public CSS hook, Part, authored content, or missing capability. Any workaround that uses internals becomes either a library issue or an explicitly rejected requirement before the theme is advertised as supported.

Produce documentation showing the same customization at system, family, concept, region and instance levels. Include one complete export/import example and one partial theme example with its dependency behavior. This is how learning one part of the library should make the rest easier to use.

## Exit conditions for the cleanup phase

- Public hooks are classified and have an owner, fallback and full-theme reset policy.
- Family membership and precedence decisions are documented and exercised by contract tests.
- Missing early/late capabilities and forwarding promises identified in this audit have explicit dispositions.
- The theme editor, token compiler and ordinary CSS paths clearly state their respective capabilities and limitations.
- Functions/mixins have either passed a bounded pilot or remain optional future authoring tooling.
- The three-theme phase has approved visual directions and a shared review fixture; its delivery and user review remain separate checkpoints.
