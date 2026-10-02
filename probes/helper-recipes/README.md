# Packed helper consumers

The [contract](../../packages/primitives/docs/helper-consumers.md) covers advanced
SSR coordination and a standalone scrolling composition. Packages are packed,
installed into an isolated consumer and checked through public declarations.
The production client bundle has no owning-element or workspace-source imports.

```sh
EN_EXECUTION_OUTPUT=/absolute/new/run tooling/test-pipeline/with-toolchain.sh npm run test:union -- --pathways=helper-recipes
```

The application renderer uses actual Lit SSR, explicitly installs the server DOM
shim, and marks only its leading static-style chunk. A separate browser entry
loads hydration support before registering the application host. Tests cover
JavaScript-disabled first paint, edited-input/node/focus retention, repeated/fresh
sheet identity, consumer cascade, cross-document moves, marker fallback, slot
changes and invalid metadata. Internal marker attributes remain internal.

Scrolling tests exercise ordinary capability detection and a controlled absence
of the container dictionary member, forcing the fallback while preserving native
scrollIntoView for comparison. Nested shadow/slot ancestry, margins/padding,
logical sticky insets, native/fallback alignment in vertical/sideways writing,
RTL, returned event targets, smooth cancellation and superseding corrections are
included. Each test uses a fresh document and its own per-document capability cache.

After a fresh production build, the `helper-owners` pathway reuses existing
virtual scroll options/smooth, data-tree and activity-history specs against the
built application. Those results are separate from this packed helper fixture.

Pinned engines are not retail Safari or physical/AT acceptance. This does not
qualify arbitrary transformed/zoomed scrollports or all framework SSR backends.
