# Project selection review

The separate `/workflows/selection` page assigns a campaign brief to one of 40
local projects through `en-combobox`. The application records IDs only after an uncanceled `en-change` has settled and
the public value still matches its proposal. It reads real FormData on submission. Typing a query does not change the assignment.
Three unavailable projects and a long label exercise disabled and wrapping states.

The page has its own controller, catalog, template and styles. Its native scroll
region places the field below the brief for keyboard and viewport review. It
shares the workflow shell's theme, density, reading direction and reset controls.
Construction and initial rendering do not access browser globals; the server and
first client render use the same project snapshot.

The application handles the field's cancelable `invalid` event to present the
associated inline error and focus through the public component API after render.
Native validity and submission blocking remain intact. This avoids a Firefox
form-associated custom-element reporting path that can log a non-focusable host
even when the delegated native editor is visible and focused. Reset and disposal
invalidate pending focus work. This is an application validation policy, not a
change to every library field.

Open **Phone and tablet review** in the page for manual steps. Include phone and
tablet portrait/landscape, iPad split-screen and floating keyboards, Android
keyboards, zoom, screen readers and hardware keyboards. Browser tests separately
cover SSR input identity and early edits, actual selection/submission/rejection,
reset, narrow RTL scrolling, automated accessibility and independent navigation.
Emulated touch and synthetic viewport evidence do not establish physical-device
keyboard or assistive-technology acceptance.
