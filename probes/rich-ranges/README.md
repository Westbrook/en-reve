# Rich editor capability regressions

From the En Reve repository root, install its locked dependencies and run:

```sh
npx playwright test -c probes/rich-ranges/playwright.config.ts
```

The fixture uses only this repository. `EN_CAPABILITY_PORT` changes its localhost
port. After building tokens/styles/primitives/elements, `EN_CAPABILITY_BUILT=1`
selects the packages' compiled public modules instead of source aliases.
`packages/elements/tests/rich-document.test.mjs` verifies package exports in Node
without browser globals. Clipboard event data uses the same synthetic event
pattern as the existing docs regressions; this does not verify native OS clipboard
permissions. Composition events exercise transaction guards, not a real IME.
