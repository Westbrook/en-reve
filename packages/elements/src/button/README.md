# en-button

An action uses a native `button` with `type="button"`, keyboard activation, disabled behavior and a complete accessible label. Applications own form submission and the action itself.

## Icon-only actions

```js
import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/icon.js';
```

```html
<en-button icon-only variant="secondary">
  <en-icon slot="prefix" name="plus" size="inherit"></en-icon>
  <span slot="label">Add collaborator</span>
</en-button>
```

The `iconOnly` boolean property reflects to `icon-only` and defaults to `false`. It declares an icon action explicitly; hiding a label with page CSS does not enable this mode. Supply one decorative icon through `prefix` or `suffix` and retain the full action label. The existing named label slot takes precedence over default label content. The component visually hides its label without removing it from the native button's accessible name.

The square uses the shared single-line text-button height minimum in the same theme and size scope, enlarged as needed for the icon/spinner and symmetric insets. It does not measure adjacent buttons. Missing `size` remains medium; `small`, explicit `medium`, `large` and `inherit` keep their shared meanings. Density, rhythm, enlarged text and coarse-pointer target floors apply in both axes. Icon-only geometry does not consume text-button inline-padding overrides. The existing button radius still applies: a pill radius produces a circle.

The layout uses an aspect ratio and intrinsic content width rather than a fixed clipping box. Normal square icons, including a larger explicit `--en-icon-size`, can grow the square. Arbitrary rectangular/multiple slotted content and incompatible author width/height constraints are outside this single-icon contract; choose suitable decorative content or deliberately customize the control Part. A containing layout must still leave room for the minimum target.

Setting `loading` hides decorative prefix/suffix content and shows the existing busy indicator, retaining the label and original slotted nodes. Its minimum size budgets both the configured icon and spinner. Loading still disables the native button; this feature does not change browser focus behavior when a focused button becomes disabled.

`focus()`, native `click`, disabled/loading behavior, popup attributes and description forwarding are unchanged. Toggling `iconOnly` does not replace the native button or label. Public Parts remain `control`, `label` and `indicator`; `--en-button-radius`, action colors/border and `--en-control-min-size` remain available. A consumer explicitly overriding geometry through Parts owns the resulting shape.

## External descriptions

Set `aria-describedby` on the host to reference description IDs in its own
document or shadow tree. After hydration, the native button receives the actual
description elements. Late insertion, removal, replacement and ID changes update
the relationship without replacing the button or moving focus. Moving the host
to another tree resolves IDs there; disconnecting releases subscriptions and
native references. Duplicate IDs follow the browser's first-match resolution.
This uses the shared per-tree ID observer; no global polyfill is installed.
It does not promise cross-root ID-string resolution or pre-hydration forwarding.

## Menu triggers

Use a decorative official icon in `suffix` for text buttons that open menus:

```html
<en-button id="study-actions" variant="secondary">
  Study actions<en-icon slot="suffix" name="chevron-down" size="inherit"></en-icon>
</en-button>
<en-menu for="study-actions" label="Study actions">
  <en-menu-item action="duplicate">Duplicate</en-menu-item>
</en-menu>
```

Register the button, icon, menu and menu-item modules. `en-menu` manages the
button's forwarded popup semantics and expanded state. The authored caret
appears during SSR, is excluded from the accessible name, and is not injected
into consumer content. A custom suffix remains the consumer's choice. Nested
menu items already render an inline-direction chevron; they need no extra icon.

## Unavailable actions that retain focus

Use `disabled` for native disabled behavior. Use `aria-disabled="true"` when an
unavailable action should remain discoverable and keep its keyboard focus, such
as a calendar month action that has just reached its minimum or maximum. The
attribute is forwarded to the native button, uses the shared unavailable styles,
and prevents click/Enter/Space activation from reaching consumer click handlers.
Removing it or setting it to `false` restores activation. It does not replace
application-side authorization or validation of the underlying operation.
