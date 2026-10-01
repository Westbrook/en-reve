# Review model portability

Run from the workspace root after building `@en-reve/tokens`:

```sh
node --test packages/tokens/test/portability/portability.test.mjs
```

Use the repository's Playwright installation and installed Chromium, Firefox and WebKit browsers. Set `PLAYWRIGHT_BROWSERS_PATH` when using a nondefault browser cache. `TOKEN_DIST_DIR` may point at an isolated compiled token package; `EVIDENCE_DIR` selects the output directory. When running outside the workspace root, set `EN_REVE_ROOT` to the workspace root.

The harness snapshots native ESM compiler files and runs the same authoring module in Node and each real browser. Four fixtures cover light/dark edits, nonzero contrast diagnostics (including a failure whose reported value rounds to 4.5), and precise authored literals/pins. All 64 author/reader/fixture combinations must reopen and reproduce exact export bytes and identities. Sixteen corruption checks retain strict artifact and diagnostic validation.

The evidence records compiler/harness hashes, engine versions, authored envelopes, exact replay outcomes, and raw threshold measurements. The threshold fixture is deliberately below 4.5 in these engines; this is not a universal proof about every floating-point boundary. It is not an application UI, manual accessibility, or previous-version browser test.
