# Packed native collection stylesheet consumers

Independent native table, pagination and carousel applications consume public
packed primitive/style entries with no delivered elements or workspace aliases.
The [template contract](../../packages/styles/docs/collection-consumers.md) records
markup, state markers, scoping and the behavior the application must supply.

```sh
EN_EXECUTION_OUTPUT=/absolute/new/run tooling/test-pipeline/with-toolchain.sh npm run test:union -- --pathways=collection-style-recipes
```

The gate runs both Lit CSSResult and linked portable CSS delivery in Chromium,
Firefox and WebKit. It also runs the existing table element browser suite to
protect the original `en-table > table` styling contract. Preparation type-checks
against extracted tarball declarations, rejects owning-element/source inputs,
and records package, CSS and bundle hashes. The loopback fixture owns its server.

The native table checks naming, heading semantics, stable keyed selection and
veto, sorting, pagination, two-axis sticky geometry, RTL, scoped paint and print.
The pager checks wide/intermediate/compact container layouts, endpoint gaps,
validation, native popover completion/cancellation, focus retention through resize,
Tab order, boundary/veto and distribution hooks. The finite carousel checks bounded
thumbnail activation, constant counts, native scroll, RTL/resize, focus, scrollbar
policy, application veto, scoped pins and large-target overflow. Forced-color
checks retain non-color current indicators and native adjustment.

The `.en-table-native` alias adds a native wrapper to the existing table stylesheet;
it installs no controller. Carousel/pagination recipes are isolated in application
shadow roots; generic carousel classes are not a supported document-wide reset.
The fixtures own all behavior absent from their imported helpers, including page
and slide events. Those example event names are not library element APIs.

This adds bounded evidence for portable table CSS and both pagination/carousel
style deliveries. It does not replace the existing collection virtualization,
SSR/hydration and owning-element evidence. No physical-device, retail Safari,
manual assistive-technology or full visual-theme acceptance follows.

The pinned headless Firefox engine reports computed `scrollbar-width:none` even
for a plain native scrollport with an explicit `scrollbar-width:auto`, independently
of this library. The uncontrolled-carousel check compares that native baseline
and verifies the controls-ready marker is removed. Chromium/WebKit report `auto`.
This is not visual scrollbar acceptance on retail Firefox.

Native sequential navigation uses Option+Tab in WebKit, matching its macOS
keyboard-access policy, and Tab in Chromium/Firefox. It is not a claim that the
user's Safari keyboard-access preference was changed or manually verified.

WebKit does not expose `forced-color-adjust` in this pinned engine. Its explicit
capability branch checks the unsupported empty value; supported engines check
`auto`. All engines still exercise distinct selected paint and the current-item
shape marker. This does not establish Windows high-contrast or screen-reader
acceptance.
