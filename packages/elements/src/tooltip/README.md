# Tooltip

`en-tooltip` provides supplemental, noninteractive text for a same-root native button or `en-button` identified by `for`. The trigger keeps its own accessible name; the real light-DOM content is its description. Required instructions belong in persistent content. For the complete relationship, cleanup and safe-pointer-transit contract, see [overlays](../dialog/README.md).

```html
<en-button id="history-help">History</en-button>
<en-tooltip for="history-help"
  style="--en-duration-enter:180ms;--en-duration-exit:120ms">
  <span slot="content">View previous project revisions.</span>
</en-tooltip>
```

## Logical placement

`inline` and `block` each accept `start`, `center` or `end`. They select a region
around the trigger in its writing mode and direction. The default is
`inline="center" block="end"`: centered below in horizontal writing. This replaces
the previous implicit leading-edge alignment. These attributes position the
surface; use `::part(surface) { text-align: center; }` to center the text itself.

```html
<en-tooltip for="history-help" inline="center" block="start">
  <span slot="content">View previous project revisions.</span>
</en-tooltip>
```

| Inline | Block | Horizontal LTR preference |
| --- | --- | --- |
| center | start | Above, centered |
| center | end | Below, centered (default) |
| start | center | Before / left, vertically centered |
| end | center | After / right, vertically centered |
| start or end | start or end | Outside both corresponding edges (a corner) |

`center`/`center` resolves to block end so help never deliberately covers the
trigger. Missing or invalid values use the corresponding defaults. Inline
start/end reverse in RTL; vertical writing maps both axes to the trigger's
writing mode. `.inline` and `.block` are live properties of type `TooltipAxis`.
Changes reposition an open surface without closing it or moving focus.

Placement is a preference. Each axis flips when its opposite region fits better,
then shifts to stay inside the visible viewport with a token-derived gap. Near
edges, visibility wins over exact centering. Resizing, scrolling, content changes
and trigger replacement keep the same surface and description nodes.

Native CSS `anchor()` supplies the tether when both syntax and the actual
relationship work. An owned, root-scoped `::part(surface)` rule bridges the
external trigger and internal shadow surface. Existing trigger anchor names are
preserved and owned names/rules are released on close or disconnect. Unsupported
or unresolvable anchors use measured coordinates with the same collision policy.
JavaScript still measures collisions, manages lifecycle and computes pointer
transit; this is not a CSS-only tooltip. No consumer engine selection is required.
`for` remains a same-root ID reference. Popover positioning is unchanged.

Motion changes paint only. `--en-duration-enter`, `--en-duration-exit`, `--en-ease-enter` and `--en-ease-exit` opt into a fade without moving the anchored rectangle. The default durations are zero. Reduced motion and browsers without the required native discrete-transition support retain immediate paint. Native close and Escape take effect without waiting for a fade to finish; a closing surface does not receive pointer input. The tooltip never takes focus and its description relationship is not removed merely because its visual surface closes.

Keyboard focus requests opening immediately. Fresh pointer movement over the trigger starts `show-delay` (300 ms by default); entry caused by insertion, reveal, replacement or layout beneath a stationary pointer does not establish hover interest, even in a warm group. `hide-delay` (150 ms) and the bounded `transit-duration` corridor (1000 ms) let the pointer move onto the tooltip and back. Focus and hovering either endpoint keep it available, subject to the group focus priority below. Escape dismisses without moving focus. It suppresses the current focused interval and any pointer encounter already in progress; a fresh pointer entry can open hover-only help while native focus remains. Touch does not begin pointer-hover behavior; no long-press or tooltip-only essential action is supplied.

## Shared pointer warm-up

Opt adjacent tooltips into a group with `warmup-group` (the `warmupGroup` property). Its value is a literal element ID resolved in the external trigger's Document or ShadowRoot. The group must contain that trigger; tooltip hosts can live outside the group. Use a toolbar or a plain container—grouping adds no roles or keyboard behavior.

```html
<en-toolbar id="editing-tools" label="Editing tools">
  <en-button id="history-tool">History</en-button>
  <en-button id="comments-tool">Comments</en-button>
</en-toolbar>
<en-tooltip for="history-tool" warmup-group="editing-tools">
  <span slot="content">View previous project revisions.</span>
</en-tooltip>
<en-tooltip for="comments-tool" warmup-group="editing-tools">
  <span slot="content">Read comments on this revision.</span>
</en-tooltip>
```

The first pointer hover keeps that tooltip's `show-delay`. Once its cancelable `en-change` is accepted and the native tooltip is displayed, later pointer entries in the same group skip the delay. The group stays warm while a member's trigger, content or valid pointer transit corridor is occupied. It cools after 500 ms without that pointer activity. This cooldown is a library interaction choice, not a WCAG requirement. Keyboard focus still opens immediately and does not warm the group; touch does not warm it either.

Accepted Escape immediately cools this group and preserves the dismissed tooltip's redisplay suppression. Canceled changes and consumer-superseded changes do not warm or cool peers. When the next pointer tooltip is actually displayed in the group, the preceding unattended pointer tooltip requests dismissal immediately, bypassing `hide-delay`. Focused help takes priority as described below; pointer handoff alone preserves hovered help. A canceled or superseded successor opening does not dismiss earlier help, and applications can cancel the preceding tooltip’s `en-change` dismissal. Missing, disconnected or non-containing group IDs fall back to independent delay behavior. Group elements, including identical IDs in separate shadow roots, have independent state. Trigger/group rebinding, reparenting and removal invalidate pending hover work and release old membership. Disabled, loading and `aria-disabled="true"` triggers do not open on pointer hover.

## Focus priority within a group

A displayed tooltip whose trigger has an undismissed focused interval owns its resolved `warmup-group`. Hovering another trigger in that group waits until focus leaves or Escape successfully dismisses the focused help. This applies to all focus origins; the library does not guess whether focus came from a mouse, keyboard or assistive technology. Tooltips in other groups remain independent.

When focused help appears, pending peer hover work stops and unattended pointer-owned peer help requests immediate dismissal. Already displayed help remains available while its trigger or content is hovered; the existing exit delay and pointer corridor apply when the pointer leaves. This intentional two-tooltip case preserves help the user is already reading. New competing hover openings remain blocked. After focus leaves or accepted Escape, a still-hovered waiting trigger resumes its normal delay; focus alone does not warm a group. After accepted Escape, native focus alone cannot reopen help or make a later hover tooltip sticky. Fresh hover on that same trigger opens through the normal pointer delay and behaves as hover-only help: pointer exit, safe transit, surface hover and group handoff work normally. If the pointer was already on the trigger or content when Escape was pressed, it must leave that encounter before re-entry can reopen help. A genuine blur and fresh focus restore immediate focus help. Temporary `for` rebinding does not revive the same dismissed focused interval; its tracking is released on blur or tooltip teardown. The focused trigger and its accessible description are preserved throughout.

All openings and dismissals retain the single cancelable `en-change` contract. A vetoed focused opening or a native opening that never becomes visible does not acquire priority. Canceling Escape retains priority; canceling a pointer peer's dismissal deliberately allows both surfaces to remain, without repeatedly requesting dismissal. Application-owned superseding property writes retain their normal authority. Removing, disabling, moving or rebinding the focused trigger or its group releases the previous group when that relationship is no longer valid. There is no global document-wide tooltip suppression.

Fade tokens only control paint; they do not change warm-up, hide-delay or transit timing.

Browser tests inspect native state, real pointer/keyboard interactions, description relationships and retained surface identity. These checks do not establish physical-device or screen-reader announcement behavior, and do not constitute a WCAG conformance claim.

## Optional pointer

Add `arrow` to `en-tooltip`, `en-popover`, or `en-hover-card` to draw a decorative pointer. It defaults off. The pointer uses the final collision-adjusted position, follows the trigger on scroll/resize, and stays clear of rounded corners. It hides when the available edge cannot truthfully point into the trigger. Tooltip logical `inline`/`block` placement, including RTL and vertical writing modes, still applies.

```html
<en-button id="help">Help</en-button>
<en-tooltip arrow for="help" block="start">
  <span slot="content">Supplemental help</span>
</en-tooltip>
```

`--en-overlay-arrow-size` sets projection length (default `--en-space-2`); the base is twice that length. The size is added to the surface-to-trigger gap. `::part(arrow)` exposes the decorative SVG and `::part(arrow-shape)` its path, in a 16 by 8 viewBox. For a softer shape, set `arrow-path="M0 0 Q4 0 7 6 Q8 8 9 6 Q12 0 16 0"` (the live `arrowPath` property); keep the base at y=0 and the tip within the viewBox. This attribute works across all supported engines; CSS `d` on the shape part is only an enhancement where the browser supports it. Placement owns the arrow's position and rotation. Fill and stroke inherit shared overlay background and boundary tokens. System colors are used in forced colors.

The `content` part scrolls independently when an arrow is enabled, leaving the arrow outside the scroll clip. Existing `surface`, `body`, `heading`, and `close` parts retain their meanings. Arrows never receive focus or pointer events and are hidden from assistive technology. Essential information remains in the content.
