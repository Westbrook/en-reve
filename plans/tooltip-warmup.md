# Shared tooltip warm-up

Implementation started after the drawer-edge and tooltip-motion review correction. The user requested that adjacent buttons in a toolbar skip the pointer warm-up once a tooltip is showing. This is implementation work in the existing selection/overlay scope, not a calendar automation. Browser verification is complete; manual acceptance remains pending for this slice.

Today each `en-tooltip` owns its own `show-delay` (300ms), `hide-delay` (150ms) and pointer transit window (1000ms). Keyboard focus already requests opening immediately. Paint duration is independent of these interaction timers.

The implementation uses an explicit toolbar or group scope. Resolve membership from the external `for` trigger, since tooltip hosts may sit outside the toolbar. Keep coordination isolated to that scope and its document/root; avoid SSR state shared across requests. The public API is `warmup-group="existing-group-id"` (`warmupGroup` in JavaScript). The connected group element must contain the external trigger in its root; it need not contain the tooltip host. Missing or unrelated groups leave a tooltip independent.

- A cold group's first pointer hover keeps its own configured delay. Only an accepted, actually displayed pointer-triggered tooltip warms the group. Canceled or superseded `en-change`, missing anchors and failed native opening must not warm it.
- Subsequent eligible triggers in that group bypass the delay while the group is warm. Keep a bounded cooldown after leaving all triggers, content and valid transit corridors; test an initial 500ms value as a product choice, not a standards requirement.
- Accepted Escape cools the group and retains the existing dismissal suppression. Canceled Escape keeps current state. Other groups remain independent. Touch does not start or warm hover behavior.
- Keyboard focus remains immediate. Displaying the next pointer tooltip dismisses preceding unattended pointer help immediately through cancelable `en-change`, without its hide-delay. Help whose trigger is focused or whose content is hovered remains available.
- Rebinding, reparenting, removal and disconnect release old membership and pending work. Old timers cannot open a tooltip in its new scope.

Verification should follow real pointer movement across a toolbar before and after first display, late cancellation, cooldown expiry, independent toolbars/shadow roots, Escape, toolbar keyboard navigation, hovered tooltip content and safe transit, disabled/missing/replaced triggers, pending-timer cleanup and touch. Demonstrate it in the sticker sheet, isolated API review and a settings toolbar. Retain actual trigger descriptions and existing single cancelable `en-change` ownership.

The [APG tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) describes trigger focus and description relationships, but remains a work-in-progress pattern and specifies no shared warm-up timing. [Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) supplies the dismissal, hoverability and persistence requirements to preserve. Manual assistive-technology and physical-device checks remain separate acceptance work.

## Authored review surfaces

The resettable `tooltip-warmup` sticker-sheet specimen and `/api-examples/tooltip-warmup.html` share one template. Two Editing guidance triggers share a group; Export guidance demonstrates isolation. The `en-tooltip` API reference uses this case and preserves `for` and `warmupGroup` while offering public timing controls. Settings Save and Restore saved opacity supply the workflow counterpart, with the tooltip hosts outside their toolbar. Focused documentation tests use the `tooltip-warmup:` title prefix. These are implementation and test additions, not a claim of passing verification or user acceptance.

## Verified implementation — 2026-09-12

The isolated group lifecycle suite passes 87 checks across Chromium, Firefox and WebKit; nine documentation/workflow checks and 12 existing SSR tooltip/motion checks also pass. Native `beforetoggle` mutations are revalidated after opening so moving a trigger cannot warm its old group. The sticker sheet exposes a resettable Shared tooltip warm-up specimen, the API reference uses its isolated demo, and the settings toolbar supplies a workflow example. The 500ms cooldown remains an initial library interaction choice; physical-device and assistive-technology review remain open. Package versions are unchanged.
