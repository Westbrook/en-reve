# Native presentation consumers

`@en-reve/primitives/templates/patterns.js` supplies native HTML recipes, not a
custom-element runtime. Applications own data, action callbacks, labels, URLs,
form submission, and responsive composition. Import the required public styles
as Lit adapters or portable CSS inside the same rendering root.

The [packed consumer](../../../probes/presentation-recipes/recipes.ts) composes all
14 recipes without importing `@en-reve/elements`. Its strict compiler and bundle
resolve installed tarball declarations and runtime files, not workspace aliases.

## Choice ownership

`choiceCardTemplate({type, name, value, label, checked?, onChange?})` uses a native
checkbox or radio within its label. Pass an explicit `checked` boolean and update
it in `onChange` when the application owns selection. Every render reconciles the
live property, including rejecting a native change with the same authored value.
Omit `checked` to leave native selection intact across unrelated renders. The
boolean attribute preserves the initial server snapshot; browser-only property
synchronization avoids serializing a misleading `checked="false"` attribute.
Native form reset uses the current authored checked attribute as its default.
Keep action links outside the choice label and group radios with a shared name.

```ts
choiceCardTemplate({
  type: 'checkbox', name: 'updates', value: 'yes', label: 'Send updates',
  checked: this.updates,
  onChange: event => {
    this.updates = (event.target as HTMLInputElement).checked;
    this.requestUpdate();
  },
});
```

These callbacks receive native events; the recipe does not invent element-level
transactions. `joinedFieldTemplate` similarly requires its caller to update the
value on native input. It is a lightweight native template, not a replacement for
the draft/composition/FormController contracts of custom elements. Use those
controllers for richer accepted/draft semantics. `localDateTimeTemplate` exposes
native timezone-free local values and constraints; timezone interpretation remains
application-owned.

## Composition and customization

Use the documented `.en-*` native classes with their matching public style entry.
A native recipe has no shadow parts; caller-created shadow roots must receive the
styles themselves. Scoped `--en-*` pins still inherit through those roots.
`buttons`, `links`, `radio`, `controls`, `typography`, `patterns`, `recipes` and
`foundations` are available in both `.js` and `.css` delivery.

- `appShellTemplate` supplies named navigation and one main; choose `embedded`
  inside a page that already has its own main landmark.
- `navigationFlyoutTemplate` is native disclosure and links with normal Tab order;
  Escape closes it and restores summary focus. It does not become an ARIA menu.
- Joined actions retain separate native buttons and disabled semantics. Attachment
  download and removal are separate targets; downloaded bytes/transport are owned
  by the application.
- Code content is escaped; `onCopy` owns clipboard permissions/transport. A system
  message can opt into status semantics, while its detail remains native disclosure.
- A named scroll area retains native scrolling and keyboard interaction. Media has
  independent alternative text, caption and actions.
- `chartModel` filters nonfinite data and includes zero in its domain. `barChart`
  is decorative; provide a complete native table for accessible data, with
  `chartDetailTemplate` only as supplemental detail. The fixture covers signed,
  zero and empty data rather than claiming every chart input is qualified.

The companion receipt covers 114 cases across Chromium, Firefox and WebKit and
both stylesheet deliveries, plus 32 existing gallery regressions and initial SSR
choice serialization. It does not establish native assistive-technology speech,
physical input, full hydration, retail Safari, or every application composition.
