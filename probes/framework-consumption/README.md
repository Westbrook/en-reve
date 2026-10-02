# Framework consumption and SSR ownership

This isolated fixture suite tests the public custom-element contract from plain HTML, React, Vue and Svelte. It contains two intentionally separate consumption paths: framework-owned client controls, and a library-rendered Declarative Shadow DOM island inside a framework-rendered server shell. It does not require a parallel implementation or a framework-specific element wrapper package.

## Pinned compatibility matrix

The maintained source pins below were audited on 2 October 2026. Each environment owns its package manifest and seed lockfile. Each acquisition creates a separate installation from actual package tarballs and retains its resolved lock; it never links library workspace sources.

| Consumer | Installed version | Scope |
| --- | --- | --- |
| Plain HTML | Native DOM with Lit 3.3.3 hydration | Framework-free baseline |
| React | 19.3.0 and 18.3.1 | Maintained major compatibility cohorts |
| Vue | 3.5.43 and 2.7.16 | Current major plus historical compatibility probe |
| Svelte | 5.57.1 and 4.2.20 | Maintained major compatibility cohorts; shared legacy component syntax |

Vue 2 reached end of life on 31 December 2023. Its fixture is compatibility evidence, not an endorsement of an unsupported runtime or a claim of upstream security maintenance. The rolling framework policy remains broader than these particular patch versions. [Vue EOL announcement](https://v2.vuejs.org/eol/), [React versions](https://react.dev/versions), [Svelte migration guide](https://svelte.dev/docs/svelte/v5-migration-guide).

## Ordinary client consumption

Each framework creates an `en-checkbox` itself after mount, supplies its slotted label, owns a boolean in framework state, writes the element's `checked` property, and handles the native cancelable `en-change` event. A separate framework button changes that same state. These fixtures exercise actual React hooks, Vue reactive state and render bindings, and compiled Svelte state/actions.

- React uses a ref, a native `addEventListener('en-change', ...)` listener with cleanup, and property synchronization. This explicit bridge works in both tested majors without relying on React 19's newer custom-element handling.
- Vue 3 uses an explicit `.checked` DOM-property binding and `onEn-change`; Vue 2 uses `domProps.checked` and its `on` event map. A template-based Vue app should also configure `isCustomElement` for `en-*`. [Vue web-component guidance](https://vuejs.org/guide/extras/web-components.html).
- Svelte uses an action to write the property and `on:en-change` for the native event. The shared source intentionally uses syntax supported by both 4 and 5; it is not a Svelte 5 runes showcase.
- HTML uses the same DOM properties and native events directly.

Each consumer additionally binds structured `en-tree.items`, string `en-text-field.value`
and `label`, and an authored `description` slot. Authoritative property updates are
silent; a real tree activation is observed once through the framework's native
event handler. Removing/recreating the controls retains framework-owned boolean
and string/data state. A deliberately retained detached tree node must not change
the live owner's state after teardown.

That last condition needs explicit native listener ownership. React uses an effect
cleanup; the HTML baseline removes its listener; Vue synchronizes a tree ref in
its update hook and disposes the prior listener on replacement/unmount; Svelte
uses an action with `destroy`. The initial new test showed Vue3 and Svelte5's
ordinary event bindings could still handle synthetic events on the detached node
held by the test. The explicit bridges address this lifetime case without changing
library components or introducing framework wrapper packages. The checkbox keeps
the original native framework binding coverage.

No `controlled` flag, `en-request-change`, or mirrored event is introduced. Inside the handler the provisional value is already visible. Cancel synchronously to reject it. A synchronous public property write is authoritative even when the event is canceled. Async approval should cancel first and write the eventual accepted property later.

## SSR and hydration boundary

The server installs the library's DOM shim **before dynamically importing element definitions**, then renders the shared checkbox and child-authored select through `@en-reve/ssr`. This produces real native shadow controls in the initial HTML. React/Vue/Svelte separately render the surrounding server shell and treat that trusted generated island as opaque HTML.

In the browser, the library hydrates the island, then the framework hydrates its shell. React, Vue 3 and Svelte receive the current island light DOM after the browser has consumed Declarative Shadow DOM templates. Their opaque HTML value stays stable across subsequent shell updates. Vue 2 needs a narrower adapter: only the server writes `domProps.innerHTML`; the client vnode declares the container attributes without children or `innerHTML`, preventing its hydration create hook from replacing the subtree. In both cases, the library owns the island's light/shadow rendering and dynamic option edits. Tests retain references to both hosts, both native inputs and the checkbox shadow root before hydration and compare identity afterward.

This is an explicit ownership adapter. It does **not** show arbitrary JSX, Vue templates or Svelte templates automatically producing library DSD, nor framework hydration reconciling the library's shadow tree. The adjacent framework-owned checkbox is intentionally client-rendered. Server markup supplied to raw-HTML APIs is trusted output from our renderer; do not pass untrusted user strings to those APIs. Framework routing, server components, streaming, Suspense, Nuxt/Next/SvelteKit integration and framework-owned dynamic children inside a DSD island remain separate work.

## Running the fixture suite

Use the pinned toolchain and normal machine/checkout ownership through the
supported framework pathway, choosing a fresh, non-existing output directory:

```sh
EN_EXECUTION_OUTPUT=/absolute/fresh/output \
  tooling/test-pipeline/with-toolchain.sh npm run test:union -- --pathways=framework
```

The pathway installs the pinned fixture builder, builds the required
library packages, and supplies one `EN_FRAMEWORK_OUT` to preparation and browsers.
Preparation packs elements/primitives/styles/tokens/SSR using the shared immutable
package producer. For each of seven consumers it seeds the cohort lock, adds the
actual tarballs and exact compiler, resolves offline, and runs a clean offline
`npm ci --workspaces=false`. The resulting lock, npm archive integrity, actual
bundle inputs and output hashes are retained. An empty npm cache must first be
populated through the repository's documented setup; no silent online fallback is
used in acquisition.

Every consumer compiles `public.types.ts` against its installed declarations,
including rejected string-as-object/boolean assignments. All bundled input paths
must remain inside that consumer installation; library packages may not be
workspace symlinks. Framework JS and the per-consumer library bootstrap are
bundled. This is not the separate native import-map qualification.

The library-rendered SSR island is created using the HTML consumer's packed
public ESM exports and explicit server setup. Each framework then renders its own
shell and hydrates with its independently installed copy of the same packages.
This remains an opaque-island integration, not framework-generated custom-element
DSD or Next/Nuxt/SvelteKit support.

`$EN_FRAMEWORK_OUT/preparation.json` binds packages, type checks, exact versions,
locks and assets; `site/` contains the served fixture. Preparation refuses to
overwrite a prior output. For manual inspection, serve a retained preparation with
`EN_FRAMEWORK_OUT=/absolute/retained/output node probes/framework-consumption/server.mjs`
and open `http://127.0.0.1:4467/react19.html` (any cohort key works). `?defer` leaves
native server controls available until `window.hydrateFixture()` is called.
Playwright owns its server and never reuses an arbitrary existing one.

## Verification surface

Browser tests exercise server-rendered controls before hydration, preserved DOM identity, accepted/canceled/superseded real user changes, framework-owned boolean changes in both directions, and dynamically added/removed `en-select-option` children without replacing the native select. Seven consumers run against Chromium, Firefox and WebKit. The historical September13 pass remains unchanged in `verification.json`:
84 checks over workspace distributions, including the older Vue3.5.42 and
Svelte5.57.0 pins. It is not relabeled as packed or current-source qualification.

The October2 packed pass is recorded separately in
[`verification-packed-20261002.json`](verification-packed-20261002.json): **126
passes, zero failures/skips/flaky cases**, comprising six contracts × seven
consumers × three engines. All seven public-type compilations and independent
installs passed. Tested engines are Chromium153.0.8010.12, Firefox155.0 and
WebKit26.6. Initial preparation failures and the Vue/Svelte lifetime failures are
retained separately; the final full run supersedes no historical receipt.

This focused suite does not establish all components, every framework patch, physical-device or screen-reader acceptance, all SSR loading orders, or the full current-minus-one browser policy. Failures must remain visible rather than being reclassified as framework support.

See the [support ledger](../../plans/support-coverage.md) for the separate current/preceding actual-product and physical/manual obligations.
