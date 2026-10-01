# API-01 event contracts

Build the workspace, then check typed consumption and the isolated browser contracts:

```sh
npm run build
node_modules/.bin/tsc --ignoreConfig --noEmit --strict --skipLibCheck --target ES2022 --module NodeNext probes/api-events/consumer.types.ts
node_modules/.bin/playwright test --config probes/api-events/playwright.config.ts
node --test packages/primitives/tests/events.test.mjs tooling/metadata/metadata.test.ts
```

The isolated fixture uses local port 4491 and installed Chromium, Firefox and
WebKit. It verifies pagination, typed response claims, vetoes, terminal loading
states, legacy callback compatibility, stale results, authoritative replacement,
disconnection, cancellation/retry reentrancy, the receiving document's event realm,
and navigation proposal versus terminal timing. The cross-document event test
uses a detached adopted element; it does not claim cross-document Lit stylesheet
adoption support. Type fixtures cover explicit method signatures, inference,
listener objects, native events, removal, AbortSignal and rejected wrong handlers.

Affected integration suites are activity-history, tree-operations, data-table,
navigation-sidebar and menu-expansion in apps/docs/tests/playwright.config.ts.
See ../../plans/api-01-events.md for the migration contract and verification receipt.
