# Packed universal delivery contracts

This fixture verifies the additive common delivery API through public package
entries extracted from actual npm archives. The producer retains package
integrity, emitted asset hashes, and separate production import graphs. It does
not measure timing, retained heap or route benefit.

Run through the owning pipeline with a fresh, non-existing output directory:

```sh
EN_EXECUTION_OUTPUT=/absolute/new-run-directory tooling/test-pipeline/with-toolchain.sh npm run test:union -- --pathways=lazy-delivery
```

The `lazy-delivery` pathway prepares current metadata, builds the packages, runs
the packed TypeScript and Node contracts, builds real server/browser consumers,
and runs every browser case on the repository's pinned Chromium, Firefox and
WebKit engines. `EN_LAZY_DELIVERY_OUT` is supplied by the pipeline. The owned
fixture server uses port 4261 (`EN_LAZY_DELIVERY_PORT` can override it).
The producer refuses an existing fixture output directory, including a retained
failed attempt. Choose a new outer execution directory after fixing a failure.

| Contract | Evidence owner |
| --- | --- |
| Complete, serializable discovery; inert imports; typed full/selective selection | `contract.test.mjs`, `consumer.types.ts`, separate `inert`, `full` and `selective` builds |
| Unknown IDs, reserved/foreign namespaces, duplicate features and missing definitions fail before imports | Packed Node contracts |
| Nested immutable requirements, shared source manifest identity, explicit import retry and registry conflict staging | Packed Node contracts |
| Calendar absent from shell startup; present in eager startup; selective entry excludes catalog/manifest | `prepare.mjs` checks emitted static import closures |
| Same date constructor with eager/shell loading in both orders and actual scoped/global registries | `delivery.spec.ts` |
| Common/instance preparation performs no registration, construction, opening or focus movement; sibling calendar remains absent | Date browser matrix, ordinary and shadow boundaries |
| Independent command activation cancellation, disposal, import retry and readiness retry | Application controller with a consumer delivery profile |
| Server entry/module identity and client manifest/module identity agree before irreversible work | `ssr-render.mjs`, `ssr.spec.ts` |
| SSR native/managed editing, identity, focus, selection, form values, inert templates and no-JS fallback | Real packed worker render and browser hydration |
| Delayed manifest/bootstrap arrival, matching identity and malformed/module-mismatched identity | Incremental HTTP delivery of the same packed SSR markup |

Every browser context is fresh. Auto mode records actual scope capability; global
mode is explicit. Unsupported native scoping uses the existing owning-document
fallback, while fallback semantics are tested independently. The retained older
lazy, activation and scoped hydration suites remain regression obligations for
their broader adoption, nested-root, lifecycle and streaming coverage.

The producer accepts no workspace aliases for `@en-reve` inputs. Non-library
dependencies come from the repository's pinned installation. The public type
fixture and packed contract cases execute from the isolated extracted package
directory. The same Node source is also available to ordinary source discovery;
that direct execution alone does not establish packed consumer coverage.

The incremental HTTP cases send an already rendered native/SSR shell before its
manifest and bootstrap. The tests edit that shell before releasing the response
suffix, then verify node/draft preservation and the appropriate failure stage.
This qualifies delivery order and delayed hydration; it does not measure or claim
incremental server-side rendering. Malformed identity fails before the module
loader, while module disagreement is checked after loading and before hydration
or registration.

DOM focus assertions are automated interaction evidence. They do not establish
physical device, assistive-technology speech, autofill, restoration or IME
acceptance. Those retain their separate manual obligations.
