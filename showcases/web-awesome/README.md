# Web Awesome native showcase

This independent sub-project renders the shared sixteen-card showcase with the free **`@awesome.me/webawesome` 3.13.0** package. The version was verified against npm and the official documentation on September 21, 2026. It has its own exact dependency pins, lockfile, `node_modules`, and Vite production output. `.npmrc` disables workspaces; the shared isolation plugin rejects bundled modules outside this directory and the dependency-free shared fixtures.

```sh
npm ci --prefix showcases/web-awesome
npm run build --prefix showcases/web-awesome
npm run preview --prefix showcases/web-awesome
```

The preview runs at `http://127.0.0.1:4518`. `/?progress-report` adds the shared return link, which is absent from measurement URLs. Benchmarking uses the frozen production output through the performance lab's server, not Vite development mode.

## Delivery and native coverage

The entry point imports `dist/styles/themes/default.css` and only the component modules used by the page. It follows the package's documented bundler path (`dist`, not `dist-cdn`). The page uses the unmodified default light theme and its system sans-serif font stack. The alternative “Awesome” theme is not selected. No En Reve implementation or inspired-theme stylesheet is used here.

The native controls are `wa-card`, `wa-button`, `wa-dropdown` and `wa-dropdown-item`, `wa-input`, `wa-textarea`, `wa-checkbox`, `wa-switch`, `wa-badge`, `wa-avatar`, `wa-select` and `wa-option`, `wa-radio-group` and `wa-radio`, `wa-tab-group`/`wa-tab`/`wa-tab-panel`, `wa-details`, `wa-slider`, `wa-number-input`, `wa-color-picker`, `wa-rating`, `wa-progress-bar`, `wa-dialog`, `wa-drawer`, `wa-popover`, and `wa-breadcrumb`/`wa-breadcrumb-item`. Subdependencies are imported by the package normally. Events use the library's native `input`, `change`, click, and open-property behavior.

The shared fixture's rating adapter renders the actual native rating component. The breadcrumb's shared inline navigation markup is adapted to the native breadcrumb before initial DOM insertion; this adds no replacement paint or shared-fixture mutation. Cards preserve the library's default padding and panel appearance. Application CSS only controls composition, widths, and application colors through default theme tokens.

Coverage limits:

- The free date control is the documented `wa-input type="date"`, with `id="project-date"` and `label="Review date"`. It uses the browser's native date picker. Web Awesome's custom date input/picker are Pro components and are not represented by this fixture. The complete date boundary is the `wa-input` host, including its accessible open shadow tree; native picker internals are not observable by the DOM census.
- Searchable combobox is Pro. The teammate chooser uses the free `wa-select` with the same choices and accessible label; search/filter behavior is therefore not a matched feature.
- Navigation groups are semantic HTML links; the illustration, sample chart/table, swatches, messages, empty state and local form-status copy remain shared authored content. Data visualization Pro components are not included.
- Options cannot contain spaces in their values. The adapter uses reversible URI encoding for select/radio values and returns the original labels to the shared application logic. Visible text and selected choices are unchanged.
- Native rating supports zero/unrated as well as 1–5, with default value 4. It retains that library behavior.

All assets are locally bundled. Default theme CSS has no external font imports. Component affordance icons use Web Awesome's built-in `system` icon library (SVG data embedded in package JavaScript); avatars use initials. No custom icon resolver, CDN, Font Awesome kit, autoloader, external font, or fetched avatar image is configured. These choices keep the initial and interaction network workload on the local origin. Adding named icons from the default external icon library would change that workload and must be measured separately.

The page uses direct native custom elements. Web Awesome's React 19 documentation uses those same elements; React 18 wrappers wrap the same implementation. This is one implementation comparison rather than an additional independent React renderer. This fixture uses client rendering, matching the original native showcase cohort; the vendor's SSR support remains a separate future delivery experiment.

## Qualification notes

In 3.13.0, the documented `label` attribute on `wa-dialog` and `wa-drawer` produces the expected visible title, but their open internal native `<dialog>` elements have no accessible name in the observed Chromium accessibility tree. The package's `render()` implementations do not attach `aria-label` or `aria-labelledby` to that native element (`dist/chunks/chunk.YSHBD3IU.js:194` for dialog; `dist/chunks/chunk.VPYZK45C.js` for drawer). The stock output is preserved. Qualification must locate the labelled custom-element host, assert its visible heading and real open native dialog, and scope slotted actions to the host. This accommodation is not evidence that the accessibility gap is resolved.

`wa-radio-group` treats Space as activation of the currently checked radio; programmatically focusing an unchecked radio then pressing Space does not select it in this version. The standard activity-selection journey clicks the visible “Six months” radio; native arrow-key operation remains available. No vendor internals or native accessibility roles are patched to satisfy selectors.

The client-rendered tab group uses the documented `active="idea"` group attribute and leaves child activation to the library. In 3.13.0, an intersection observer delays the initial tab/panel synchronization until the group enters the viewport. The brief card starts below the fold at the desktop measurement size, so both panels initially remain inactive and occupy no layout space. Their light-DOM content and connected component nodes are already mounted; this is deferred activation/layout, not lazy mounting or a reduction in the connected DOM census. Once the card scrolls into view, the first panel becomes active and its paragraph and checked “Keep the headline editable” control appear. The fixture preserves this stock behavior and does not apply the explicit child activation flags used for server-rendered initialization.

A browser's full-page screenshot can capture content beyond the viewport without scrolling each region into view. Such an initial screenshot may therefore show the tab labels with neither panel displayed. Functional qualification must actually scroll the brief card into view, then verify the first panel and checked checkbox, switch to Delivery, and switch back. A separate scroll-qualified screenshot documents the activated state. Initial performance samples and DOM snapshots retain their normal unscrolled starting conditions; verification must not silently preactivate the fixture used for those measurements.

Final source/build hashes and successful behavioral qualification belong to the dedicated Web Awesome verification receipt and frozen lab artifact. Early exploratory files in this sub-project's `artifacts/` directory may include failures that led to these documented harness accommodations; they are not the qualifying benchmark receipt.

## Official references

- [Installation, cherry picking, and bundler delivery](https://webawesome.com/docs/)
- [Default theme and bundled themes](https://webawesome.com/docs/theming/)
- [Native date input support](https://webawesome.com/docs/components/input/)
- [Combobox availability](https://webawesome.com/docs/components/combobox/)
- [Dialog API and labelling contract](https://webawesome.com/docs/components/dialog/)
- [Drawer API](https://webawesome.com/docs/components/drawer/)
- [Rating API](https://webawesome.com/docs/components/rating/)
- [React integration uses the same custom elements](https://webawesome.com/docs/frameworks/react/)
