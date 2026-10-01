# Holotable-inspired theme

Status: local review ready on build `edd09329014f`. Authenticated reference
audit, code-owned paired recipe, managed JSON/CSS and browser verification are
complete for this slice. Root inspected palette, controls and an open select;
dark follows the observed reference and light is explicitly adapted. Thirty appearance checks across five themes pass in three installed engines; ten
themed-asset checks pass in Chromium. Physical/manual-AT acceptance and user
adoption remain separate.

Reference: [SWCCG Holotable](https://swccg-holotable.reve-ai-0869.chatgpt.site/).
[Source/build receipt](../artifacts/asset-browser-followups/verification.json),
[review guide](../artifacts/asset-browser-followups/README.md) and
[paired artifact manifest](../artifacts/theme-candidates/asset-followups-edd09329014f/manifest.json)
retain the exact identity and limits. Holotable and the other four pairs remain
review proposals. Future reference/library changes require the maintenance
checks below; completed local implementation is not ongoing adoption approval.

## Delivery and review

1. **Audit the reference.** Record the inspected reference version/date and
   representative surfaces and states. Map color roles, typography, density,
   geometry, elevation and interaction feedback to existing token and component
   hooks. Separate observed design decisions from proposed adaptations.
2. **Author a reusable recipe.** Keep source and derivations in code. Prefer
   existing semantic roles and component overrides; record customization gaps
   for specialist discussion. Support system appearance and explicit light/dark
   selection with the existing paired-theme processing. If an appearance is not
   present in the reference, identify its adaptation explicitly.
3. **Prepare managed candidates.** Produce build-bound JSON/CSS artifacts that
   can be reopened, edited, applied to the page or a scope, reset and exported
   through Theme Review. Preserve granular customization and existing defaults.
4. **Review across the system.** Include the full sticker sheet, isolated API
   demos and reference workflows, including menus, selects, comboboxes, toolbars
   and the command palette. Verify contrast, complete focus contours, state
   distinction, sizing/density, enlarged text, RTL and narrow layouts. Retain
   scoped browser/visual evidence and explicit manual-review limits.
5. **Maintain the theme.** Track source recipe, reference provenance, compiler,
   token schema, component/build identity and review evidence. When relevant
   tokens, styling hooks or component surfaces change, assess impact, regenerate
   compatible candidates and rerun affected coverage. Refresh affected review
   cards while preserving earlier artifacts and acknowledgments. Reference-site
   changes are assessed during theme maintenance; no scheduled monitoring is
   implied.

The first review checkpoint is the actual candidate with light/dark comparisons,
documented fidelity gaps and exact-build evidence. Preview, review and adoption
remain distinct under the [token ownership contract](./tokens.md). Adding this
theme does not complete a component pattern or change package versions.
