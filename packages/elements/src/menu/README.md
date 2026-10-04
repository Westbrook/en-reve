# Menu

`en-menu` is an application command menu with checkable choices and nested submenus. Its external trigger is a native
`button` or `en-button` identified by literal `for` in the same Document or
ShadowRoot. Supply the menu's own accessible `label`.

```html
<en-button id="asset-actions">
  Asset actions<en-icon slot="suffix" name="chevron-down" size="inherit"></en-icon>
</en-button>
<en-menu for="asset-actions" label="Asset actions">
  <en-menu-item action="download" size="inherit">Download</en-menu-item>
  <en-menu-item action="duplicate" size="inherit">Duplicate</en-menu-item>
  <en-menu-item action="rename" disabled size="inherit">Rename</en-menu-item>
</en-menu>
```

```js
import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/icon.js';
import '@en-reve/elements/define/menu.js';
import '@en-reve/elements/define/menu-item.js';
```

Use the official `chevron-down` icon in the root button's `suffix` slot to make
its menu behavior visible. `size="inherit"` keeps the decoration at the button's
size. The icon is decorative, so the accessible button name remains the action
label; `en-menu` manages `aria-haspopup="menu"` and `aria-expanded` on its trigger.
A native button is also supported; author its own decorative icon consistently.

This is an authoring convention rather than automatic light-DOM insertion. It
keeps the caret in the initial SSR delivery, avoids a width change when trigger
behavior connects, and preserves custom icons or labels. An explicit icon-only
More actions button can use its own recognizable glyph and complete hidden
label. Submenu items supply their own inline-direction chevron; do not add a
second suffix caret to them.

The default slot owns original direct `en-menu-item` children. Noninteractive
separators may appear between them. Named slots inside each item support rich
noninteractive labels and decorations. Links and interactive children inside a row are outside this command contract.
Submenus are separate `en-menu` siblings of their trigger items, not slotted
triggers or nested interactive content inside a button.

`open` is boolean and public author writes are silent, including equal writes.
`show(reason?)` and `hide(reason?)` request a single tentative, cancelable
`en-change` with `{previous, proposed, reason}`. During that event `.open` already
exposes the proposed state; canceled owned state rolls back before focus or the
native top layer changes. Explicit author writes and accepted nested open changes
supersede older defaults.

Each enabled item emits one bubbling, composed, cancelable `en-action` with
`{action, data: undefined}`. The menu does not re-emit it or run application code.
After the complete action dispatch, an uncanceled action requests closing only
if the application has not authoritatively changed open state. Canceling the
close keeps the menu open and does not undo a command already executed by the
application. For work that should run only after default dismissal is accepted,
use one application owner:

```js
const menu = document.querySelector('en-menu');
const actions = new Map([['download', downloadAsset], ['duplicate', duplicateAsset]]);
menu.addEventListener('en-action', event => {
  const item = event.composedPath()[0];
  if (event.defaultPrevented || item?.localName !== 'en-menu-item' || item.parentElement !== menu) return;
  const action = event.detail.action;
  queueMicrotask(async () => {
    if (event.defaultPrevented) return;
    await menu.updateComplete;
    if (!menu.open) actions.get(action)?.();
  });
});
```

Do not also execute the same command in a native click listener. `action` is an
application key, not a callback, URL, form submit action or native commandfor.
No keyboard shortcut is registered by a displayed shortcut hint.

Enter/Space or pointer activation opens at the first command; ArrowUp can open
at the last. Within the menu, Up/Down and Home/End move focus, and printable
characters find labels. Disabled commands remain focusable for discovery but
cannot activate. Hidden/inert commands are excluded. Escape returns focus to an
eligible opener. Tab closes and advances from the external trigger's position,
so controls between the trigger and menu host remain reachable. Shift+Tab closes
and returns to the trigger. Canceled closes, authoritative state writes and
consumer focus redirects retain ownership of that transition. Removing the
focused item chooses an adjacent surviving item while the menu owns focus.

The native manual popover remains in its theme tree. Positioning follows the
visual viewport with the same empirical coordinate-origin and precision policy
used by combobox. Focus enters only after placement has a usable row. Confirmed
lack of room requests `hide('layout')`; if the application vetoes that close, it
owns keeping a constrained scroll surface visible. An extremely small viewport
or authored height ceiling can still make a command hard to reach; the component
does not blur an editor, scroll the document, or create a different modal UI.

The inherited size defaults to medium without an attribute. Put `size="inherit"`
on items when the menu's explicit size should govern them. `::part(surface)` and
the shared `--en-option-list-*`/`--en-overlay-*` hooks customize the surface.
Item `::part(control)`/`::part(option)` and `--en-option-*` hooks customize rows.
System-color focus and disabled distinctions remain visible in forced colors.

Ordinary menu widths are content-sized. Optional `--en-menu-min-inline-size`
and `--en-menu-max-inline-size` refine their minimum and maximum; unset inputs
preserve the shared panel/form-width fallbacks. An explicit
`--en-overlay-max-inline-size` remains above the menu maximum default. Both
bounds stay capped by the controller's measured viewport, and narrow space can
reduce the minimum. Replacement submenus retain their existing parent-width
and viewport rules. These hooks style only menu surfaces, including the native
`.en-menu` recipe; comboboxes and command-palette shells are independent.

SSR emits the original slotted markup and native menuitem buttons. The closed
popup needs no child mapping or cloning. Hydration adds trigger/focus behavior;
no JavaScript-free command execution or initial native top-layer opening is
claimed. Explicitly register both public tags for client and server consumers.

### Optional surface motion

`--en-duration-enter` and `--en-duration-exit` default to `0ms`. Pin either independently (managed range 0–500ms in 10ms steps); `--en-ease-enter` and `--en-ease-exit` select their easing. Supporting browsers retain only visual exit paint through native `display`/`overlay` transitions. Accepted state, native modality, focus restoration and the single cancelable `en-change` keep their existing timing. A closed surface is inert; a canceled close stays usable. Reduced motion and engines without the required discrete-transition support dismiss immediately.

The focused menu stays opaque while its elevation enters; exit can fade. Its measured outer rectangle is never translated or scaled by theme motion. This preserves anchored positioning during viewport changes.

These hooks animate paint, not application transactions. Do not wait for an animation event to accept a value or execute a command. Reopen, disconnect and a changed reduced-motion preference require no delayed completion callback.

### Checkable choices and nested menus

```html
<en-button id="view-menu">
  View settings<en-icon slot="suffix" name="chevron-down" size="inherit"></en-icon>
</en-button>
<en-menu for="view-menu" label="View settings">
  <en-menu-item type="checkbox" checked>Show guides</en-menu-item>
  <hr role="separator">
  <en-menu-item type="radio" name="density" checked>Comfortable</en-menu-item>
  <en-menu-item type="radio" name="density">Compact</en-menu-item>
  <hr role="separator">
  <en-menu-item id="export-menu">Export</en-menu-item>
  <en-menu for="export-menu" label="Export">
    <en-menu-item action="export-png">PNG image</en-menu-item>
    <en-menu-item action="export-svg">SVG document</en-menu-item>
  </en-menu>
</en-menu>
```

Separate meaningful sets of choices with nonfocusable `<hr role="separator">`
elements. In particular, keep all radio choices with the same `name` contiguous,
with separators between that set and unrelated checkbox choices or commands.
The separator carries actual accessibility semantics as well as a visible rule;
changing `name` alone establishes selection ownership but does not communicate
the boundary to someone reading the menu. Several related checkbox choices can
share one section, and related ordinary commands can share another. Avoid a
separator between every row. Short menus containing only one kind of action do
not need extra divisions.

Keep items as direct children of their menu; arbitrary `role="group"` wrappers
are outside the current keyboard ownership contract. For a group needing an
explicit name, a labeled submenu is currently the clearest supported delivery.
This follows the [APG menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)
and [menuitemradio grouping guidance](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/menuitemradio_role).

Checkable items own `checked`, not application settings. They emit one cancelable
`en-change` with boolean `previous`/`proposed` and `reason: 'checked'`; no extra
`en-action` is emitted. During dispatch the proposed item and same-name radio
peers expose coherent checked properties. Cancellation restores unchanged-owned
states; synchronous author writes win. Accepted radio selection clears peers
only in the same owning menu and `name` group. Attribute/property writes are
silent, including programmatic radio selection. A checked radio cannot uncheck
itself through activation. Checkable choices stay open for successive edits.
Filter `event.composedPath()[0]` when listening at a menu, since its own open
changes and descendant checked changes deliberately share the `en-change` name.

Place each child `en-menu` immediately after its direct parent `en-menu-item`
trigger inside the parent's default slot. The literal `for` stays in the same
Document or ShadowRoot. Only `en-menu` accepts this additional trigger type;
other overlays keep native button/`en-button` triggers. The trigger forwards
`aria-haspopup="menu"` and `aria-expanded` to its internal native menu item and
uses the library chevron. Do not combine a submenu trigger with `action` or a
checkable type. Supply each submenu's own accessible label.

Click, touch, Enter, Space or the forward inline arrow opens a submenu at its
first item. The reverse arrow or Escape closes one level and returns focus to
its trigger; inline arrows mirror in RTL. Up/Down remain within the current menu.
Tab exits the whole hierarchy from the root trigger's position. Accepting a
root close tears down child surfaces as part of that structural dismissal;
children cannot independently veto becoming unavailable with their parent.
Command activation requests root dismissal after dispatch, preserving consumer
cancellation and authoritative open writes at every level.

Mouse hover can also open a submenu without moving keyboard focus. A safe
triangle protects pointer travel toward the child surface across adjacent rows.
Leaving the child menu by itself does not dismiss it; entering a different row
in an ancestor menu closes the previous branch. Explicit click, touch and
keyboard activation remain available.

With fine-pointer delivery and enough viewport width, submenus prefer the inline
end edge, flip when that edge has no room, and clamp to the visual viewport.
Narrow windows use one panel at a time: the child replaces the parent at the same
position and width. The width threshold is two panels at the parent menu's
current themed width plus the menu gap, rather than a device-specific breakpoint.
Window and visual-viewport resizing update an already-open hierarchy in place;
the child menu, original items, checked state and focused child command remain
intact. If expansion removes a focused Back action, focus moves to the first
available child command. Presentation changes do not emit `en-change`.

Touch delivery also uses replacement, even on wide screens. The last pointer
used in the parent decides the touch preference on mixed-input devices; without
a pointer interaction, coarse-pointer or non-hovering environments use the same
replacement delivery. Narrow mouse delivery requires click or keyboard
activation; hovering does not replace the visible parent panel. Its Back action
returns to the parent and restores focus
to the original submenu trigger; translate `back-label` for the application
language and customize the control with `::part(back)`. Escape and reverse
inline-arrow behavior remain available. Each visible panel remains
a scrollable native top-layer menu in its theme ancestry. Real touch and
screen-reader submenu traversal remain valuable manual review surfaces.

Behavior and structure follow the [WAI-ARIA menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/).
