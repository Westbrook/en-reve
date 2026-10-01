# en-reve

A private, exploratory design system for creativity and collaboration tools.
Lit custom elements share token-driven styles and Signals state/interaction
primitives. The public prefix is `en-*`; packages use `@en-reve`.

## First review collection

The interactive sticker sheet demonstrates 37 implemented elements and 280
resolved token values. Change appearance, density, accent seed, layout rhythm,
and writing direction; compare page, child-theme, and component scopes. Density
offers compact, comfortable, and spacious presets. Element size defaults to
medium without an attribute; small, large, and explicit inherit are available.
Each specimen includes its actual authored source and interactive specimens can
be reset independently. Microlighter highlights disclosed code on demand.
Focusable `en-swatch` color samples copy their exact CSS variable references,
with keyboard activation, accessible feedback, and selectable reference text.

This is an initial review checkpoint. The 72-pattern inventory, four-audience
documentation, managed token submissions, broader framework/SSR
integration, and release review surfaces remain in progress. Browser evidence
does not establish manual assistive-technology or current-minus-one support.

## Reference workflows

Three independent SSR pages provide deterministic review tasks: `workflows.html`
for sign-in, `workflows/settings.html` for design settings, and
`workflows/chat.html` for contextual chat. Each page loads and creates only its
own workflow, with shared preview controls, navigation, template source and reset.
Fresh page loads start a local scenario while preserving the selected theme,
density and reading direction in the review URL. Browser Back retains normal
document-restoration behavior. The pages reuse public
library components and native semantics; the sticker sheet remains separate.

The shared request/scheduler core passes eight Node cases. The production-page
suite covers Chromium, Firefox and WebKit, including independent entry loading,
pre-hydration editing/submission, recovery and real page navigation. Narrow
viewport coverage is scoped separately in the runner. See [verification commands and limits](apps/docs/tests/README.md). No real authentication,
messaging, model service or collaboration backend is included; attachment UI,
locale review, physical-device/assistive-technology and broader framework
coverage remain open. See the [experience plan](plans/experience.md) and
[workflow core contract](apps/docs/src/workflows/shared/README.md).

## Local development

Use Node.js 26.10.0 Current and npm 12.1.0 (`.nvmrc` and `packageManager`). Node 24.21.0 LTS is the additional supported validation line; Node types follow that minimum. Python checks use 3.14.7 (`.python-version`). After `npm ci`, run `npm run build` and
`npm run dev:docs`. The sheet is available at `http://127.0.0.1:4180/`.
The documentation build emits the static Site into the root `dist/` directory.
It prerenders the sheet and workflows with Lit SSR and Declarative Shadow DOM, then
hydrates the rendered nodes in the browser. See `packages/ssr/README.md` for the
reusable server renderer and the verified native-editing/hydration contracts.

`packages/tokens`, `packages/styles`, `packages/primitives`, and
`packages/elements` have independent builds and focused tests. See their READMEs
and the component-family test directories for verified behaviors and limits.
`plans/` retains the specialist-reviewed architecture and pattern inventory.
Start with the [review-session plan update](plans/review-session.md) for the
current contracts, remaining proposals, and next implementation work.
`tooling/` contains isolated metadata, version-policy, and evidence utilities.

`npm run test:tokens`, `npm run test:tooling`, and `npm run test:probes` cover
their respective boundaries. Browser runs need installed Playwright engines;
set `PLAYWRIGHT_BROWSERS_PATH` when using a separate browser installation.

Packages remain private. Before1.0, `0.x.y` advances `x` for breaking or
deprecation changes and `y` for minor/patch changes. Stable releases use normal
SemVer, with minor deprecations and major removals. Source is licensed MIT.
