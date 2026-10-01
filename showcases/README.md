# Native component-library showcases

Nine isolated production applications reproduce the sixteen-card creative studio from En Reve's [showcase](https://en-reve-docs.reve-ai-0869.chatgpt.site/showcase). Each has its own manifest, exact dependency versions, lockfile, `node_modules`, Vite configuration, and output directory. None is an npm workspace of the root project. Root dependencies and scripts are unchanged.

| Sub-project               | Native delivery                                                                                                 | Production preview            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `radix-react`             | Radix Themes 3.3.0, React 19.2.4; official CSS and default Theme                                                | [4510](http://127.0.0.1:4510) |
| `fluent-react`            | Fluent UI React 9.74.7, React 19.2.4; FluentProvider/webLightTheme, Griffel                                     | [4511](http://127.0.0.1:4511) |
| `spectrum-react`          | React Spectrum S2 1.7.1, React 19.2.4; Provider, compiled atomic CSS, documented style macro tooling            | [4512](http://127.0.0.1:4512) |
| `astryx-react`            | Astryx 0.6.2, React 19.2.4; official precompiled StyleX CSS and Neutral theme                                   | [4513](http://127.0.0.1:4513) |
| `shadcn-react`            | Official Rhea/Base UI registry source, Base UI 1.8.0, React 19.2.4, Tailwind 4                                  | [4514](http://127.0.0.1:4514) |
| `fluent-web-components`   | Fluent Web Components 3.1.3; native FAST components, individual definitions, webLightTheme                      | [4515](http://127.0.0.1:4515) |
| `spectrum-web-components` | Adobe Spectrum WC 2.0.0-beta.3 + retained Gen1 1.12.2 controls; individual registrations, default light/medium      | [4516](http://127.0.0.1:4516) |
| `en-reve`                 | Packed main 6d09b31c prerelease; Lit/signals, eager individual registrations, default light/comfortable tokens | [4517](http://127.0.0.1:4517) |
| `web-awesome`              | Web Awesome 3.13.0; native Lit components, individual registrations, shipped Default light theme              | [4518](http://127.0.0.1:4518) |

Holotable is an application reference, not an external component library. The React wrappers around Web Components are deliberately excluded: the separate WC pages instantiate the actual elements directly.

## Run

From the repository root, with Node 24 and npm 11:

```sh
node showcases/tools/install.mjs
node showcases/tools/build.mjs
python3 showcases/tools/serve.py
```

The server serves static production files on nine independent localhost origins. Stop with Ctrl-C. To run one project, use `npm --prefix showcases/radix-react run preview` (substitute the project name). Each project also has a `dev` script. Use production previews for profiling, not Vite development mode.

Run the browser checks while previews are running:

```sh
npm --prefix showcases/tools exec -- playwright install chromium
npm --prefix showcases/tools test
node showcases/tools/secondary.mjs
node showcases/tools/inspect.mjs
node showcases/tools/record-verification.mjs
```

## Composition and comparison boundaries

Only the showcase heading and sixteen cards are included. Documentation navigation, theme selection/import/export, appearance switching, scope audit and documentation startup code are absent. The navigation **card** remains part of the content. The optional `?progress-report` query adds the existing independent report's return link; omit it while profiling.

`shared/Showcase.jsx` shares application behavior between React projects, while each `src/ui.jsx` imports only that project's library. Card-local state is kept local; memoized independent cards do not rerender when canvas settings change. `shared/web-showcase.js` creates the three external WC fixtures once and delegates application events, updating only affected content. The elements retain their native FAST/Lit rendering and event handling. No React wrappers, generic component framework, or En Reve runtime is used in the external projects. `shared/layout.css` contains layout and authored artwork; component skins come from their libraries.

En Reve copies its actual showcase template, model and interaction methods into its sub-project, removing theme authoring and documentation dependencies. `en-reve/vendor` contains immutable package tarballs instead of links back to the root workspace. The default token CSS is resolved ahead of time. [Snapshot provenance](en-reve/snapshot.json) identifies the captured package bytes and source files. Repacking is an explicit future action; later root changes do not silently alter this comparison.

All nine are client-rendered fixtures. The original En Reve documentation site uses SSR/hydration; this standalone client fixture measures library startup and interactions without the docs server. It is **not** an SSR/network-delivery comparison. A later SSR comparison should add equivalent server rendering separately. The separate [performance laboratory](performance/README.md) now provides profiling and regression commands. Its [first results](../plans/native-showcase-performance-results.md) retain cohort limitations and do not declare an overall library ranking.

Catalogues differ. [Coverage and adaptations](COVERAGE.md) records native components and application/HTML fallbacks, including rating selectors, date inputs and export dialogs. Match interactions by capability before comparing timings. Typography, density, target sizes, DOM structure, stylesheet delivery, native overlays and focus lifecycles intentionally differ. The authored chart and artwork are application content, as in the source page.

Spectrum's Provider retains its official font-loading behavior. shadcn bundles the existing licensed Geist variable font locally; Fluent uses its native system font stack; Astryx uses its published Neutral defaults. Do not treat font loading or unmatched fallback controls as equivalent component costs.

## Reproducibility and review

Every build runs an isolation guard that rejects bundled files resolved outside its own sub-project and the dependency-free shared fixtures. `dist/build-metadata.json` records direct versions, lockfile digest, rendering mode and the isolation result. Sourcemaps are emitted for subsequent profiling; normal pages contain no test runner, profiler or development client.

`tools/smoke.mjs` checks the sixteen cards, overlays, menus, tab panels, approval, project creation, sliders, reviews, preferences, chat, resets, mobile reflow and optional report link. `tools/secondary.mjs` covers activity periods, teammate invitation, study popovers and tablet columns. Browser receipts and screenshots are generated in ignored `artifacts/`. The retained [verification receipt](verification.json) records the qualified source/build hashes and individual results. These checks are functional qualification, not an accessibility certification or performance result.

The canonical project [Progress Report](http://127.0.0.1:4177) contains separate review cards for the implementations. Build output, installed dependencies and screenshots are ignored; package manifests, lockfiles, source, registry provenance and the En Reve snapshot are retained.

## Web Awesome expansion

The additive `web-awesome` project uses the free published package; the [native fixture notes](web-awesome/README.md) describe its components and capability differences. Its own qualification receipt and frozen performance snapshot extend the registry without rebuilding the original eight. The [Web Awesome comparison](../plans/native-showcase-web-awesome-results.md) records a new campaign alongside frozen En Reve and Fluent WC controls; historical results retain their acquisition dates and are not pooled into paired measurements.

The Web Awesome-inspired theme belongs to the current En Reve theme registry. It is an En Reve interpretation and does not alter the default En Reve benchmark snapshot or import Web Awesome into the root workspace.

The current Spectrum WC app uses the Gen2 beta with Gen1 coexistence. Historical performance tables retain the frozen Gen1 1.12.2 results; see [migration coverage and provenance](spectrum-web-components/README.md).

The current En Reve native baseline is repacked from exact local main `6d09b31c` in the [main performance refresh](performance/reports/en-reve-main/README.md). Older tarballs and acquisitions remain retained; the current comparison does not enable scoped/lazy/SSR consumer policies.
