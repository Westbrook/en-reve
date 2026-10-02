# Consumer-owned choices, commands and overlays

The [packed examples](../../../probes/choice-overlay-recipes/README.md) adopt
`selection`, `surfaces`, `combobox`, `commands` and `overlays` style entries without
owning elements. Each uses either CSSResult exports or linked portable CSS in its
own application shadow root, combined with foundations and native control styles.
This is a matching template/semantic recipe contract, not a way to style internal
classes of `en-*` elements. Use CSS Parts/custom properties for delivered elements.

## Choices and surfaces

Native grouped inputs supply names, values, disabled state, successful form
controls and the platform's checkbox/radio interaction. A segmented composition
uses `.en-segmented-control` with associated `.en-segmented-item` labels, hidden
native radios and `.en-segmented-label` text. The app mirrors accepted state to
`data-selected` and disabled state to `data-disabled`; paint does not set `.checked`.
A native `.en-choice-group` fieldset contains `.en-option` labels and real checks.
The example combines `createSelectionModel` for membership with `dispatchChange`
for the separate tentative single-selection transaction. Native state is staged
before dispatch and synchronously restored on veto. Authoritative writes remain
silent and supersede that transaction by revision.

Tabs use a named tablist, native `.en-tab` buttons, same-root IDs/controls and
labelled `.en-tab-panel` sections. `RovingFocusController` supplies navigation only;
the example uses manual activation and excludes disabled tabs. Its disclosure is
a native button with `aria-expanded`/`aria-controls` and a hidden panel, using
`.en-accordion*` paint. These are not automatic ARIA widgets from CSS alone.

`.en-panel`, `.en-card` header/body/footer, `.en-divider`, `.en-grid` and `.en-stack`
provide surfaces and intrinsic layout. Card background, surface radius and
stack/grid spacing remain independently scoped custom-property hooks. Narrow
content wraps inside its allocated area. This fixture does not qualify every
layout export: interactive splitters, ratings and nested trees retain other owners.

## Editable selection

`comboboxStyles` expects `.en-combobox`, an `.en-combobox-anchor` around a named
native `.en-combobox-input` and `.en-combobox-trigger`, then a
`.en-combobox-popup` containing `.en-combobox-listbox` and `.en-combobox-option`
rows. The input, options and `aria-controls`/`aria-activedescendant` IDs belong in
one root. Keep a missing candidate absent from the attribute; never reference an
option that filtering removed. `.en-combobox-check` is decorative selected paint;
`.en-combobox-status` supplies the app's named empty/count feedback.

The application owns filtering, disabled candidates, query preservation, keyboard
movement, committing/veto, popup state, dismissal and focus. It also measures the
anchor and supplies the private coordinate/width/visibility CSS inputs for this
matched recipe; they are not public theme tokens. The example uses native popover
state and viewport-bounded placement, observes resize/scroll and removes its
listeners on disconnect. This finite local-data fixture is not remote search,
full collision-positioning, IME acceptance or a form-associated custom element.

## Commands

`commands.js` exposes menu, menu-item, toolbar and palette fragments independently;
`commands.css` combines them. `.en-toolbar` only groups native buttons. The
example gives it its own `RovingFocusController`, distinct from the menu's vertical
controller, so toolbar navigation and menu navigation cannot consume each other.

A named native `.en-menu[popover]` contains buttons with menuitem semantics,
optional `.en-menu-item-label/prefix/check/shortcut` contents and a native separator.
Application `aria-disabled` handling and checked actions remain explicit. This
fixture does not implement nested menu hover/replacement behavior. The menu's
native popover provides light dismissal; the app synchronizes expanded state,
executes accepted actions and returns keyboard focus on Escape/activation.

Load the generic `overlayStyles` before `commandPaletteStyles` (or portable
`overlays.css` before `commands.css`), so palette placement overrides the generic
dialog inset and sizing rules. The palette composes native
`dialog.en-dialog.en-command-palette`, overlay
header/body and `.en-command-palette-content`, a labelled query input, an
`.en-command-list` and `.en-command-option` results. Search/candidate/active-ID
updates are owned by the app. The `.en-command-status` names empty/count state.
Arrow/Home/End move the candidate while input focus remains; Enter executes only
an available candidate. The inner result region scrolls; outer overflow preserves
query/close access at short viewport heights. Option-family hooks apply to both
menu and palette; the result list does not add another popup shadow.

## Dialog and drawer

Native `showModal`, `cancel` and `close` supply modal behavior for `.en-dialog` or
`.en-drawer`. The application owns opening, cancelable close policy, focus return,
responsive class choice and any persistence. It supplies the accessible title and
description, `.en-overlay-header/body/footer`, optional description fallback, and
real close/actions. The example switches the same live dialog to a logical-start
drawer at a 560px viewport, preserving the exact native input, draft and focus.
The breakpoint is an example application policy, not a new library default.

Overlay radius/background/padding/max size hooks stay scoped. Body overflow keeps
header/footer actions reachable. Reduced motion and forced-color styles retain
their library policy. This is not a full dialog controller, focus-trap polyfill or
cross-root ARIA bridge; native modality handles the background.

## Evidence limits

Both stylesheet deliveries use identical application semantics and assertions.
The tests use native actions and inspect geometry, values, names, current IDs and
focus. WebKit sequential native navigation uses Option+Tab under its platform
policy. Browser-engine results do not prove screen-reader speech, physical touch,
retail Safari, arbitrary theme acceptance, SSR/hydration or every exported rule.
