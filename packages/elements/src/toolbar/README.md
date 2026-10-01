# Toolbar

`en-toolbar` groups related actions. Its default `keyboard-navigation="auto"`
uses a single remembered Tab stop when its interactive children are direct native
buttons or `en-button` elements. Arrow keys follow `orientation` (horizontal by
default); Home/End reach the first/last button. Horizontal arrows follow reading
direction. Tab leaves the composite. Disabled and loading buttons are skipped.

```html
<en-toolbar label="Artwork actions">
	<en-button>Save</en-button>
	<en-button variant="secondary">More actions</en-button>
</en-toolbar>
```

## Mixed controls

Use `keyboard-navigation="tab"` when grouping fields, selects, sliders, nested
composites or third-party controls with actions:

```html
<en-toolbar label="Artwork settings" keyboard-navigation="tab">
	<en-text-field label="Find a layer"></en-text-field>
	<en-select label="Layer type"></en-select>
	<en-button>Apply</en-button>
</en-toolbar>
```

This is a named **group**, rather than an ARIA toolbar composite: each control
keeps its ordinary Tab behavior, arrow keys, Home/End, text selection and popup
interaction. A compound field may have several Tab stops and a nested composite
may maintain its own single Tab entry. The outer group intercepts none of them.
Its label and native group semantics are present during SSR as well as hydration.
`orientation` controls layout in both modes; it does not remap editing keys in tab
mode. Label every individual control as well as the group.

Automatic mode also falls back to this delivery when it finds other interactive
light-DOM content, including native inputs/selects/links, wrappers containing
controls, and custom elements other than direct `en-button` children. Detection is
conservative: even an unknown decorative custom element selects Tab mode because
it may contain private interactive content. The toolbar does not inspect private
shadow trees or treat arbitrary `role="button"` nodes as supported roving controls.
Use the explicit tab attribute for mixed controls so the server can select the
same semantics without inspecting children. Automatic discovery happens after
connection; it is a hydration fallback, not an SSR child-introspection guarantee.

Inserting or removing content updates the mode. Switching to tab mode releases
owned button tab stops and restores authored native `tabindex` values without
replacing controls or moving existing focus. Returning to a button-only group
resumes roving navigation. Unavailable controls in tab mode follow their own
native/element behavior; `aria-disabled` alone does not disable a native button.

This distinction follows the [APG toolbar guidance](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/):
controls whose editing keys share the toolbar's navigation axis create conflicting
keyboard expectations. This initial mixed-control support preserves those keys;
it does not claim a fully roving mixed-widget toolbar. Applications needing a
visual group without these modes can also use `en-stack`.

## Customization and ownership

The `base` Part and `--en-space-actions` customize layout. Horizontal groups wrap
at narrow widths while retaining logical DOM order; they do not create an
overflow menu. `size` is medium without an attribute; children can explicitly use
`size="inherit"` to share a containing size. Set `label` to a localized name.

In roving mode the toolbar manages button tab stops through an encapsulated focus
adapter and restores them when they leave. It does not reinterpret clicks or
change values. Application handlers own commands, pending state and outcomes.
Before JavaScript upgrades an automatic button toolbar, authored buttons retain
their ordinary independent Tab stops. SSR keeps those same buttons through
hydration; it does not promise pre-upgrade roving.
