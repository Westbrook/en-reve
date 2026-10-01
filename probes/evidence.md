# Platform feasibility evidence

Executed 8 September 2026 on the local macOS host. These are small feasibility fixtures, not production components or a completed compatibility matrix.

The final Playwright run passed **20 scenarios**, marked **1 native capability unavailable**, and had **0 failures**. Three Node SSR tests also passed. The native-registry unavailable result is intentionally separate from a passing implementation test.

| Environment reported by Playwright | Result |
| --- | --- |
| Chromium 153.0.8010.12 | 7 passed |
| Firefox 155.0 | 6 passed; native scoped registry constructor unavailable |
| WebKit 26.6 | 7 passed |

These are the installed Playwright engine builds, not a claim about retail browser releases, iOS devices, every current-minus-one version, or screen-reader interoperability. The probe page uses development-mode Lit and is not a performance benchmark.

## Verified behavior and resulting contracts

### Scoped registry client rendering

The same `en-probe-branch` and nested `en-probe-leaf` names constructed different old/new classes in two local registries on Chromium and WebKit. Both branches used Lit templates, both nested buttons worked, and acting in one pane did not modify the other. Neither tag was globally registered.

The successful adapter creates a detached HTML document, calls `registry.initialize(creationScope)`, supplies that document as Lit's `renderOptions.creationScope`, and attaches each render root with `{ customElementRegistry: registry }`. The root `render()` call also receives that creation scope. The nested class constructors and each shadow root's registry are checked directly because this is a platform-construction experiment.

Firefox threw `TypeError: Illegal constructor.` at `new CustomElementRegistry()`. The test records that capability absence as an explicit skip. If initialization succeeds but nested rendering fails, the test fails rather than treating a renderer defect as unsupported.

**Recommendation:** use this narrow native adapter as the starting point for client review islands. Add an explicitly labeled isolated-document/iframe review path for browsers without the native facility. An iframe implementation, registry polyfill, moving/adopting instances, multiple dependency graphs, scoped SSR, and scoped hydration were not tested here. Both compared fixture versions share the same installed Lit runtime.

### Native form composition and FACE

A light-DOM native label, input and description slotted through a shadow-root field retained its accessible name/description, label-click focus, required validation, successful form submission, and reset in all three engines. The wrapper did not add a second form value.

A separate form-associated element used `ElementInternals.setFormValue` for the outer form and a native input with a label in its own shadow root. Its host's external label appeared in `ElementInternals.labels`; its inner input remained outside the outer native form (`input.form === null`). Explicit value bookkeeping submitted/reset the expected value.

The inner input kept only its internal accessible name. Clicking the external label did **not** focus the inner input in any of the three tested engines, even though the probe host exposed a forwarding `focus()` method. This is an observed gap, not a passing external-label compatibility claim.

**Recommendation:** retain a coherent light-DOM native form recipe for SSO-sensitive use, and use same-shadow semantic naming plus explicit form bookkeeping for encapsulated controls. External labels, Reference Target, descriptions/errors across roots, validation UI, autofill, form restoration, and AT behavior need dedicated adapter coverage. Form association and naming/focus forwarding are separate obligations.

### Signals and lifecycle

A model backed by `Signal.State` and `Signal.Computed` returned a complete snapshot synchronously on its first read. A Lit host using `reaction` from `signal-utils/subtle/reaction` rendered without waiting for a subscription's first notification. Removing it immediately after a signal write canceled the pending reaction callback; detached mutations did not call the effect. Reconnecting displayed current state, and the next mutation produced exactly one reaction callback.

**Recommendation:** render directly from a synchronous model snapshot, subscribe on connection, dispose on disconnection, and request a fresh render on reconnection. The fixture does not test resource-owning async helpers, garbage collection, or every Signals utility.

### Native drafts and composition boundary

Real Playwright input editing produced trusted native input events. Unrelated Lit updates retained the draft, accepted-state distinction, input node, focus, and selection. Explicitly assigning the unchanged accepted value rejected a different draft; unrelated updates did not perform that write.

A separate **synthetic composition guard** test verified that an external replacement queues while the guard is active and reconciles at the synthetic composition-end boundary. It is labeled synthetic in both the test title and machine evidence. During fixture development, placing Playwright `fill()` after synthetic composition start ended composition in Firefox; the final test sets up the native draft first and then exercises only the explicitly synthetic guard.

**Recommendation:** keep native editing and accepted state distinct; do not rewrite `.value` during unrelated renders or active composition. Specify explicit accept/reject/reset boundaries. Real OS IME, dictation, paste, undo, autofill, remote conflict resolution, composition completion ordering, and platform editing remain unverified. This probe establishes an adapter mechanism, not a complete public editing policy.

### Ordinary SSR and hydration

Node rendered Lit declarative shadow roots from three request-local signal-backed snapshots with independent counts and labels. A parsed-DOM assertion also verified request text escaping. In all three browsers, a server-rendered field could be edited before registration/hydration. Hydration retained its DOM node, live draft, focus and selection; the hydrated button then updated the signal-backed output. A second request retained its own count.

The working bootstrap explicitly installs the server DOM shim before dynamically importing component definitions. The initial fixture's static-import graph lost registration during shim initialization; ordered dynamic registration resolved that harness issue. The client imports Lit's hydration support before definitions and explicitly hydrates the matching root template. The editable fixture uses a static initial value attribute, not a reactive value binding that overwrites the user's draft.

**Recommendation:** keep server setup/registration ordering explicit and request state local; test client bootstrap ordering with the real rendering host. This demonstrates ordinary global-registry SSR separately from the scoped client review island. It does not establish framework SSR support, generic editable-control hydration reconciliation, streaming concurrency, or scoped SSR.

## Reproduction and source artifacts

From the repository root:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright npm run test:probes
node --test probes/ssr.test.mjs
```

Playwright starts and stops a Vite fixture server at `127.0.0.1:4179`. The restricted sandbox required escalation to bind that local port and run browsers. No public site or service was used.

- `playwright.config.ts` — isolated runner and server settings.
- `tests/platform.spec.ts` — browser interactions and assertions.
- `fixtures/browser.ts` — scoped/form/lifecycle/draft experiments.
- `fixtures/model.mjs`, `fixtures/ssr-element.mjs`, `fixtures/hydrate.mjs` — shared signal-backed SSR/client example.
- `server.mjs` — local SSR fixture server.
- `ssr.test.mjs` — Node snapshot, SSR DOM, and escaping assertions.
- `results/playwright.json` — raw executed results with exact engine versions, capability status and limitations.
- `results/node-ssr.txt` — Node test output.
- `evidence.json` — compact machine-readable summary.

Real screen-reader review, mobile/tablet hardware, preferences, low-connectivity performance, framework adapters, package import maps, and the full component inventory remain separate work.
