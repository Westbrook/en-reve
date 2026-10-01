# Framework consumption and SSR ownership

This isolated fixture suite tests the public custom-element contract from plain HTML, React, Vue and Svelte. It contains two intentionally separate consumption paths: framework-owned client controls, and a library-rendered Declarative Shadow DOM island inside a framework-rendered server shell. It does not require a parallel implementation or a framework-specific element wrapper package.

## Pinned compatibility matrix

The matrix was resolved on 12 September 2026. Each environment owns its package manifest and lockfile; installing these fixtures does not change the design-system workspace dependencies.

| Consumer | Installed version | Scope |
| --- | --- | --- |
| Plain HTML | Native DOM with Lit 3.3.3 hydration | Framework-free baseline |
| React | 19.3.0 and 18.3.1 | Current and preceding major |
| Vue | 3.5.42 and 2.7.16 | Current major plus historical compatibility probe |
| Svelte | 5.57.0 and 4.2.20 | Current and preceding major; shared legacy component syntax |

Vue 2 reached end of life on 31 December 2023. Its fixture is compatibility evidence, not an endorsement of an unsupported runtime or a claim of upstream security maintenance. The rolling framework policy remains broader than these particular patch versions. [Vue EOL announcement](https://v2.vuejs.org/eol/), [React versions](https://react.dev/versions), [Svelte migration guide](https://svelte.dev/docs/svelte/v5-migration-guide).

## Ordinary client consumption

Each framework creates an `en-checkbox` itself after mount, supplies its slotted label, owns a boolean in framework state, writes the element's `checked` property, and handles the native cancelable `en-change` event. A separate framework button changes that same state. These fixtures exercise actual React hooks, Vue reactive state and render bindings, and compiled Svelte state/actions.

- React uses a ref, a native `addEventListener('en-change', ...)` listener with cleanup, and property synchronization. This explicit bridge works in both tested majors without relying on React 19's newer custom-element handling.
- Vue 3 uses an explicit `.checked` DOM-property binding and `onEn-change`; Vue 2 uses `domProps.checked` and its `on` event map. A template-based Vue app should also configure `isCustomElement` for `en-*`. [Vue web-component guidance](https://vuejs.org/guide/extras/web-components.html).
- Svelte uses an action to write the property and `on:en-change` for the native event. The shared source intentionally uses syntax supported by both 4 and 5; it is not a Svelte 5 runes showcase.
- HTML uses the same DOM properties and native events directly.

No `controlled` flag, `en-request-change`, or mirrored event is introduced. Inside the handler the provisional value is already visible. Cancel synchronously to reject it. A synchronous public property write is authoritative even when the event is canceled. Async approval should cancel first and write the eventual accepted property later.

## SSR and hydration boundary

The server installs the library's DOM shim **before dynamically importing element definitions**, then renders the shared checkbox and child-authored select through `@en-reve/ssr`. This produces real native shadow controls in the initial HTML. React/Vue/Svelte separately render the surrounding server shell and treat that trusted generated island as opaque HTML.

In the browser, the library hydrates the island, then the framework hydrates its shell. React, Vue 3 and Svelte receive the current island light DOM after the browser has consumed Declarative Shadow DOM templates. Their opaque HTML value stays stable across subsequent shell updates. Vue 2 needs a narrower adapter: only the server writes `domProps.innerHTML`; the client vnode declares the container attributes without children or `innerHTML`, preventing its hydration create hook from replacing the subtree. In both cases, the library owns the island's light/shadow rendering and dynamic option edits. Tests retain references to both hosts, both native inputs and the checkbox shadow root before hydration and compare identity afterward.

This is an explicit ownership adapter. It does **not** show arbitrary JSX, Vue templates or Svelte templates automatically producing library DSD, nor framework hydration reconciling the library's shadow tree. The adjacent framework-owned checkbox is intentionally client-rendered. Server markup supplied to raw-HTML APIs is trusted output from our renderer; do not pass untrusted user strings to those APIs. Framework routing, server components, streaming, Suspense, Nuxt/Next/SvelteKit integration and framework-owned dynamic children inside a DSD island remain separate work.

## Running the fixture suite

From the repository root, after building the library packages:

```sh
node probes/framework-consumption/install.mjs
node probes/framework-consumption/build.mjs
PLAYWRIGHT_BROWSERS_PATH=/path/to/installed/browsers npx playwright test --config probes/framework-consumption/playwright.config.ts
```

The fixture installation uses pinned independent lockfiles, native ESM imports and a small isolated esbuild step. No stylesheet is imported as a JavaScript side effect. Framework JavaScript and the library bootstrap are bundled for these probes; packed npm artifacts, native import-map delivery and type-checking consumer projects are not established by this suite.

For manual use, run `node probes/framework-consumption/server.mjs` and open `http://127.0.0.1:4467/react19.html` (replace `react19` with any matrix key). Add `?defer` to inspect server-rendered controls before calling `window.hydrateFixture()` in developer tools.

## Verification surface

Browser tests exercise server-rendered controls before hydration, preserved DOM identity, accepted/canceled/superseded real user changes, framework-owned boolean changes in both directions, and dynamically added/removed `en-select-option` children without replacing the native select. Seven consumers run against Chromium, Firefox and WebKit. The completed pass has **84 passing checks, with no failures, skips or flaky cases**: four user/SSR contracts × seven consumers × three engines. Exact versions and source/build hashes are recorded in `verification.json`; full results are written to `results/playwright.json`. Tested engines: Chromium 153.0.8010.12, Firefox 155.0, and WebKit 26.6.

This focused suite does not establish all components, every framework patch, physical-device or screen-reader acceptance, all SSR loading orders, or the full current-minus-one browser policy. Failures must remain visible rather than being reclassified as framework support.
