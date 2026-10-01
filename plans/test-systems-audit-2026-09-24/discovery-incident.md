# Probe listing side effects inventory
The discovering subagent had no preinspection snapshot; the root audit had an earlier full Git status. No implementation source files changed. All 23 commands used `node node_modules/@playwright/test/cli.js test --list --config probes/<config>`; no browser tests executed. Seventeen configured destinations were written with skipped-only discovery inventories. Eight originally clean tracked receipts were subsequently restored byte-for-byte from HEAD; the remaining nine destinations have no recoverable original bytes in this audit and must not be treated as execution evidence. The table below records the classification at detection, before recovery.
| Exact config | JSON output | Current git classification |
|---|---|---|
| `probes/activation-library/playwright.config.ts` | `artifacts/scoped-registry-phase-4/library-tests.json` | M artifacts/scoped-registry-phase-4/library-tests.json |
| `probes/activation-registry/playwright.config.ts` | `artifacts/scoped-registry-phase-4/activation-tests.json` | M artifacts/scoped-registry-phase-4/activation-tests.json |
| `probes/api-contracts/playwright.config.ts` | `artifacts/api-10-completion/browser.json` | ?? artifacts/api-10-completion/browser.json |
| `probes/api-events/playwright.config.ts` | `artifacts/api-01/playwright.json` | ?? artifacts/api-01/playwright.json |
| `probes/api-forms/playwright.config.ts` | `none` | No JSON reporter |
| `probes/api-localization/playwright.config.ts` | `artifacts/api-08/playwright.json` | ?? artifacts/api-08/playwright.json |
| `probes/api-outcomes/playwright.config.ts` | `none` | No JSON reporter |
| `probes/api-transactions/playwright.config.ts` | `none` | No JSON reporter |
| `probes/breadcrumbs-ssr-adapter/playwright.config.ts` | `node_modules/.cache/en-breadcrumbs-ssr-adapter-tests/playwright.json` | Ignored |
| `probes/component-patterns/parts.config.ts` | `none` | No JSON reporter |
| `probes/component-patterns/playwright.config.ts` | `artifacts/component-gap-closure/gallery.json` | ?? artifacts/component-gap-closure/gallery.json |
| `probes/component-patterns/transactions.config.ts` | `none` | No JSON reporter |
| `probes/composable-editor/playwright.config.ts` | `/private/tmp/en-editor-foundation/playwright.json` | Outside repository |
| `probes/composable-editor/token-editor.config.ts` | `/private/tmp/en-token-editor-tests/playwright.json` | Outside repository |
| `probes/context-protocol/playwright.config.ts` | `artifacts/api-09/playwright.json` | ?? artifacts/api-09/playwright.json |
| `probes/framework-consumption/playwright.config.ts` | `probes/framework-consumption/results/playwright.json` | Ignored |
| `probes/lazy-registry/cleanup.config.ts` | `artifacts/scoped-registry-phase-3-cleanup/browser.json` | M artifacts/scoped-registry-phase-3-cleanup/browser.json |
| `probes/lazy-registry/phase4.config.ts` | `artifacts/scoped-registry-phase-4/browser.json` | M artifacts/scoped-registry-phase-4/browser.json |
| `probes/lazy-registry/playwright.config.ts` | `artifacts/scoped-registry-phase-3/browser.json` | M artifacts/scoped-registry-phase-3/browser.json |
| `probes/playwright.config.ts` | `probes/results/playwright.json` | M probes/results/playwright.json |
| `probes/rich-ranges/playwright.config.ts` | `none` | No JSON reporter |
| `probes/scoped-registry/context-regressions.config.ts` | `artifacts/scoped-registry-phase-2/context.json` | M artifacts/scoped-registry-phase-2/context.json |
| `probes/scoped-registry/playwright.config.ts` | `artifacts/scoped-registry-phase-2/browser.json` | M artifacts/scoped-registry-phase-2/browser.json |


## Recovery outcome

Eight tracked files were restored from exact HEAD bytes, with their generated discovery copies preserved temporarily for incident analysis. `git diff --name-only` across those eight paths was empty after restoration. The audit did not touch the pre-existing modified SSR receipt. The five untracked repository outputs, two ignored outputs and two temporary outputs were left in place because their original content/existence could not be established; neither an earlier pass nor a prior timestamp was fabricated. The frozen framework verification receipt and retained logs supply historical timing separately.

See [machine-readable recovery record](/Users/westbrook/Documents/repos/design-system/artifacts/test-systems-audit-2026-09-24/discovery-recovery.json).
