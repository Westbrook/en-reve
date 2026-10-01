# Phase 5 hydration qualification

Build `@en-reve/ssr`, run `node probes/scoped-hydration/prepare.mjs`, then run
`playwright test -c probes/scoped-hydration/playwright.config.ts` under the shared
performance browser lock. The fixture bundles the actual public client entry,
class-only application modules and a real `en-button` through esbuild.

The suite covers complete and incrementally delivered HTML, native/global hydration,
scoped same-tag versions, shadow-root and ordinary-element boundaries, inert
fallback containment, native input and library shadow-node identity, drafts,
selection, focus, required validation, form values/reset, no-JS content, load-only
preparation, synthetic loader rejection, actual aborted chunk requests, immediate
disposal of held loading and cross-document adoption. Server tests live in
`packages/ssr/tests/scoped.test.mjs`. These are correctness checks, not timing samples.
Firefox skips only native version isolation; global fallback runs normally.

The composition events and restored-value assignment are synthetic. Actual browser
autofill/history restoration, physical input methods, device behavior and screen-reader
speech require manual qualification; never treat browser automation as that acceptance.
Static style tests check real library stylesheet adoption and sharing after activation.

`production/README.md` describes the separate packed Vite campaign and manual
review fixture. Historical freezes are preserved; its baseline is the sealed Phase 4
commit, not an older source snapshot that omitted the final focus-order patch.

## Real autofill and history review after Phase 5

The dedicated [form-review fixture](./form-review/README.md) compares plain native
inputs with managed SSR fields using the frozen Phase 5 packages. It provides
explicit hydration, real browser Back navigation, local FormData inspection and
separate scoped-shadow/global delivery pages at http://127.0.0.1:4233/?progress-report.
Its automated checks qualify fixture mechanics; saved-profile autofill and manual
history outcomes remain separate user review evidence.
