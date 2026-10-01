# Explicit activation probes

Packed package browser tests cover group registries, shared null-associated ordinary elements and nested shadow roots, and forced template-based global fallback. Firefox/WebKit automatically exercise fallback when native dormant construction is unavailable; Chromium's individual-host test requires native behavior. Tests cover import sharing without registration, same-tag isolation, global upgrade limits, asynchronous ownership changes, readiness cancellation, retry, retained drafts, eager form validity and disposal.

Prepare with `node probes/activation-registry/prepare.mjs`; run the three-browser suite with `playwright test --config probes/activation-registry/playwright.config.ts`. The packed declaration consumer is `consumer.types.ts`. Node import and docs typing are checked separately.

`campaign.mjs --qualify` runs one case per cell and retention policy. The full campaign captures six configurations x 30 timing samples plus three policies x five retention runs. It uses a minimal custom element with one native input, so this establishes containment/creation costs rather than a production speedup. Four islands hold 1 or 250 hosts each. In native modes all placeholder hosts exist; in fallback templates, only requested content materializes. One selected island upgrades; no associated sibling should upgrade. Retention disposes and removes each island, clears fixture references and uses forced-GC checkpoints.

Do not run capture alongside other browser/build work. The shared benchmark lock serializes registered campaigns. Preserve failed or partial attempts and never overwrite finished/frozen outputs. Manual screen-reader acceptance remains separate from automated checks.
