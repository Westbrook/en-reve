# Mixed toolbar and API phase

> Current planning status (2026-09-16): the [accepted follow-up backlog](component-follow-up-backlog.md) supersedes historical next-phase ordering below. Baseline exclusions describe the original pass; newly committed follow-ups are identified in that backlog. Implementation of those follow-ups has not started.

The pagination layout and customization review is accepted. Complete its human API guidance, then address the mixed-control toolbar gap already recorded in the selection/navigation plan.

- Explain pagination's three responsive layouts, CSS Parts, alignment tokens, slots, page chooser, cancellation and SSR/RTL behavior alongside the live API demo.
- Preserve button-only toolbar roving navigation in `auto`. Add explicit `keyboard-navigation="tab"` for groups containing fields and selectors; expose labelled group semantics in initial HTML and let each control own its editing keys.
- Fall back conservatively when mixed interactive descendants are detected. Release previously owned tab stops without replacing nodes or moving focus. Document opaque-wrapper and SSR limits.
- Share an isolated mixed editing specimen with the sticker sheet. Integrate output controls into the Settings workflow without changing its button-only command toolbar or application state ownership.
- Verify keyboard editing, Tab order, dynamic changes, SSR, narrow RTL layout, workflow restoration and human API links in Chromium, Firefox and WebKit. Publish a private review checkpoint.

This bounded phase does not complete the broader selection/navigation workstream. Tree view, further compositions, physical-device and assistive-technology review remain. The virtual table VoiceOver traversal finding stays open for enhanced manual investigation.
