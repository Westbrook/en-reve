# Tooltip logical placement

Implement `inline` and `block`, each `start | center | end`, as the preferred
region relative to the trigger. Defaults are inline center / block end.
Corners sit outside both trigger edges. Center/center resolves to block end so
help does not cover its trigger. Direction and writing mode come from the trigger.

Use CSS anchor() where usable, with a root-scoped ::part(surface) rule bridging
the external trigger and the tooltip's private shadow surface. Preserve author
anchor names and release owned names/rules on close, rebinding and disconnect.
Keep a measured path for unsupported CSS or unresolved anchors. Both paths use
the same flip-then-clamp collision policy and token-derived gap; viewport fit has
priority over the requested region. Retain the last position if a trigger goes
away. Do not change popover placement or tooltip interaction/description rules.

Verify every region, RTL/vertical writing, viewport collisions, scrolling,
resizing/content changes, live attributes, shadow roots, shared triggers and
cleanup in Chromium, Firefox and WebKit. Force the measured path as well. Run
existing hover/focus/transit tests, update API documentation and the live warm-up
example with a placement demonstration, then publish for review.
