# Packed choice, command and overlay consumers

The [contract](../../packages/styles/docs/choice-overlay-consumers.md) defines
native input/tab/disclosure/card, combobox, menu/palette/toolbar and dialog/drawer
compositions. No owning elements, workspace source aliases or internal element
imports are used. State, filtering, native popup/modal actions, geometry and focus
ownership are explicit application code; the style entries do not implement them.

```sh
EN_EXECUTION_OUTPUT=/absolute/new/run tooling/test-pipeline/with-toolchain.sh npm run test:union -- --pathways=choice-overlay-recipes
```

Preparation extracts public tarballs, checks their declaration resolution under
strict TypeScript, bundles production ESM and records all CSS/input/asset hashes.
The same native scenarios run with CSSResult and portable CSS in Chromium,
Firefox and WebKit. Each application has its own shadow root, preventing incidental
class bindings from styling the rest of the page. Browser roots and isolated
fixtures are disposed after each case; the service uses a fresh reserved port.

The matrix exercises native successful controls, tentative/veto/superseding choice
transactions, manual tab activation, roving focus/RTL, disclosure visibility,
intrinsic card layout and scoped tokens; combobox draft/candidate/commit, disabled
and empty results, native light dismissal, responsive positioning and reconnect;
menu/toolbar navigation, native checked actions, palette filtering/candidate IDs,
short-height result scrolling and family paint; native modal naming, cancellation,
focus return, live dialog-to-drawer resize, scrolling, reduced motion and forced
colors. WebKit uses its native Option+Tab sequential-navigation policy.

This is named-scenario evidence for ten style entries. It does not qualify nested
menu hover, every selection/surface export, remote results, actual IME/AT, physical
mobile use, retail browser products, full SSR/hydration or every possible theme.
No application event name in this example is a new delivered-component API.
