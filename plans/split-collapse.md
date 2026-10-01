# SPLIT-1: Collapse and restore

- Preserve the existing numeric `value` / `en-change` resize contract. `value`
  remains the expanded primary-pane percentage, including while collapsed.
- Add `collapsible="primary|secondary|both"` (default none) for offered controls;
  `collapsed="none|primary|secondary"` is independent authoritative visibility.
  `collapse(pane)`, `restore()` and `toggle(pane)` propose cancelable `en-collapse`
  transactions. Direct assignments are silent and supersede pending proposals.
- Retain authored slots and DOM. A collapsed pane and separator are hidden/inert;
  a visible en-button restores the pane. Restoring clamps the remembered size to
  current bounds. No pointer proximity or resize-to-zero collapse heuristic.
- Enter on an enabled owned separator collapses the primary eligible pane (or
  secondary when only it is eligible). Existing resize keys and pointer behavior
  remain unchanged. Focus in a collapsing pane or separator moves to its restore
  action. Restoring keeps focus on the action; consumers may then focus content.
- Provide localized pane/action labels, CSS Parts, SSR state, vertical/RTL checks,
  cancel/author override checks and a navigation/content/inspector workspace.
- The demo stacks panes vertically at narrow widths using a documented
  application-owned orientation change, preserving DOM and collapse preferences.
  Device and spoken screen-reader review remains separate from automated checks.
