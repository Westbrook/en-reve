# Link

`en-link` provides a standalone link with a private native anchor and decorative
`prefix` and `suffix` slots. The application owns its destination and routing.

```html
<en-link href="/projects">All projects</en-link>
```

For items inside `en-navigation`, its sidebar/nested groups, and `en-breadcrumbs`,
author native `<a>` elements instead of `en-link`. These composites consume
light-DOM anchors and their `aria-current`, focus and routing semantics. The
private anchor inside `en-link` does not participate in that contract;
`en-breadcrumbs` accepts only direct native `a` or `span` entries.

```html
<en-navigation label="Projects" layout="sidebar">
  <a href="/projects" aria-current="page">All projects</a>
</en-navigation>
<en-breadcrumbs label="Breadcrumb">
  <a href="/projects">Projects</a>
  <span aria-current="page">Current project</span>
</en-breadcrumbs>
```

Do not query a component's private shadow anchor to establish navigation
membership. A future public link-participation capability would be a separate
feature; Context Protocol adoption does not broaden this boundary.
