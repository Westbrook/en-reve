# Nested navigation and responsive sidebar (NAV-1/2)

## Contract

- Preserve `en-navigation` flat native-link behavior by default. Opt into a
  vertical sidebar with `layout="sidebar"`; `collapse-at="48rem"` adds a
  viewport-responsive disclosure. Applications own routing and `aria-current`.
- Add `en-navigation-group` with a localized `label`, reflected `open`, native
  details/summary and authored links or nested groups in its default slot.
  Disclosure changes expansion only; a destination is a separate native anchor.
- Keep one DOM instance of each link across resize. Expose `revealCurrent()` to
  open the active branch. Observe authored current-link changes without
  continually undoing a user's explicit collapse. Never unhide authored hidden
  content or infer route ownership.
- The compact disclosure is in normal flow, not modal: no trap, backdrop or
  duplicate landmark. Escape closes it and returns focus to its summary.
  Narrowing with focus inside retains the open navigation; widening transfers
  summary focus to the current visible link or first available control.
- Server output stays expanded and usable with native group disclosures before
  hydration. The client determines the viewport and applies the requested compact
  state. Authors can set `open` to retain expansion. No viewport inference on SSR.

## Delivery

1. Components, theme-backed styles, CSS Parts and registration metadata.
2. A responsive project workspace demo with deep links, nested groups, dynamic
   current-state changes, long labels and complete source; API guide.
3. Chromium/Firefox/WebKit keyboard, resize, RTL, dynamic content, SSR/hydration
   and visual checks, including existing flat-navigation regression coverage.
4. Publish to the authorized existing Site and expose a focused review card.

Drawer delivery remains an application composition choice. This slice implements
the planned narrow disclosure option; collapsible split panes remain SPLIT-1.

## Implementation and verification

Implemented NAV-1/2 with `en-navigation-group` and the responsive `en-navigation`
API above. API documentation and the themed `/api-examples/navigation-sidebar`
workspace include the authored source and interactive review scenarios.

39 focused Playwright cases passed across Chromium, Firefox and WebKit: nested
links, route ownership, current branch restoration, dynamic links, Escape, resize
focus, SSR with JavaScript off, pre-hydration interaction preservation, RTL, all
five inspired themes and existing navigation regressions. Native details needed
explicit closed-content hiding in WebKit; group initialization now adopts early
SSR disclosure state. Physical-device and manual screen-reader review remains
with the user.

## Drawer comparison recipe

The documentation now includes a second workspace at
`/api-examples/navigation-sidebar#drawer-sidebar-example`. Its documentation-owned
wrapper projects one authored navigation into a desktop sidebar or `en-drawer`
using named slots. At 48rem and below a button opens the start-edge modal; a
preview button exposes the same interaction at larger sizes. Group state and
focused links survive layout changes. Accepted native destinations close the
Drawer; group disclosure and canceled link activation do not. This recipe does
not introduce a public sidebar custom element API.
