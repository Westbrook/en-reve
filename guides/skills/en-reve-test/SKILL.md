---
name: en-reve-test
description: Plan and run reproducible functional tests for En Reve components, reusable layers and application consumers. Use for behavior regressions and integration qualification; performance acquisition and manual accessibility acceptance have separate protocols.
---

# Test En Reve functionality

## Responsibility

Own: Functional test authoring, execution and scoped results.

Accessibility semantics, WCAG and AT review belong to en-reve-accessibility; performance campaigns retain their own protocol. Report product defects; use en-reve-component when implementing an authorized fix.

Load another skill only when that separate responsibility is needed for the user's
request. References provide contracts; they are not an instruction to execute
another entire workflow.


Read `AGENTS.md`, the owning component's guide/tests and
`tooling/test-pipeline/README.md`. Locate the actual checkout, source revision and
existing work before selecting tests. Do not use another checkout's build or a
live unowned server as if it were the current fixture.

## Choose evidence from the changed contract

Start with the cheapest relevant semantic/type and pure-model checks. Root
`test:plan` and `test:inventory` describe the maintained graph. `test:fast` covers
compiler/consumer/test/tooling boundaries before expensive docs and browser work.
A type-snapshot freshness check is not a TypeScript consumer compilation.

Use the owning package or documented root gate (`test:tokens`, `test:tooling`,
`test:api`, `test:theme`, `test:probes`, `test:release`) for the affected behavior.
For a filtered configuration, preserve the original fixture and browser projects;
report it as a subset. Use existing packed-consumer pathways when changing exports,
metadata discovery or framework delivery; workspace aliases cannot prove package
consumption. Read `apps/docs/tests/README.md` for production docs workflows.

## Exercise observable state transitions

Select relevant cases, rather than mechanically applying every case to a
presentation-only element:

- Accepted interaction, cancelable rejection, equal/external author write,
  nested proposal and silent programmatic update.
- Native editing draft, composition guard, selection/caret, reset, disabled
  omission and FormData at the documented transaction phase.
- Async pending, failed/retried/canceled and stale completion; distinguish
  request acceptance from transport success.
- Connection, disconnect/reconnect, changed slotted content and dynamic trigger
  binding, including cleanup and restored focus.
- Stable keys, changed ordering, virtualized focus retention, scroll-to behavior
  and sequential Tab navigation from an offscreen retained item.
- Initial SSR, delayed/failed hydration and native editing before upgrade when
  the affected control supports those paths.

Use Playwright roles/names and real keyboard/pointer input for public behavior.
A controlled fixture may inspect internals to diagnose a bug, but consumer tests
must not depend on private shadow classes. Avoid arbitrary sleeps; wait for the
actual update, event, visible state or owned service readiness. Use documented
browser APIs and retain exact launch options and versions.

## Run with owned resources

Use `tooling/test-pipeline/with-toolchain.sh` and a fresh, non-existing
`EN_EXECUTION_OUTPUT` path for each outer run. Supported runners acquire machine
and checkout leases and record source/runtime identity. Do not bypass a lease,
kill an unrelated server or attach a personal browser profile to save time.
Read the runner's recorded failure before retrying; preserve partial/failed
receipts and change only a demonstrated cause. Do not edit sources while an
owned run is acquiring evidence. Timed campaigns stay isolated from builds and
correctness browsers; use `showcases/performance/CAMPAIGNS.md` for that separate
request and never reuse a historical acquisition ID.

After relevant checks pass, stop expanding or repeating them absent changed
source or a concrete unresolved concern. Report command, source/build identity,
passed/failed/skipped/not-run scope and evidence location. A skipped capability
is not a pass. Keep native product, headless engine, physical device and manual
acceptance distinct. Route accessibility-specific review to
`en-reve-accessibility`; automated functional success alone establishes none of
those broader claims.
