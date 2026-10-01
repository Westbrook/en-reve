# CONTEXT-3: contextual tooltip warmup

Status: implementation, regression cases and generated public metadata are
committed for integration into `main` at the user-requested stopping point.
Component qualification passes; production demo qualification and publication
remain pending. A source-only GitHub push is a checkpoint, not full acceptance.

## Checkpoint evidence (2026-10-01)

- Tooltip browsers: 309 checks passed across Chromium, Firefox and WebKit.
- Late-provider callback retention fix: ten focused WebKit repetitions passed.
  Retain the context request callback until trigger teardown; ContextRoot's weak
  pending references alone did not keep it alive before a provider appeared.
- Consumer types, SSR/pure imports and regenerated metadata freshness passed.
- Context Protocol browsers: 55 passed, two capability-dependent skips.
- Production docs build passed. The contextual demo test fails across engines
  because its Reset example review control is absent. The maintained source sample
  also needs wiring before the documented review scenario is complete.
- Local evidence: `/private/tmp/en-tooltip-context-qualification-20261001-06`
  and `/private/tmp/en-tooltip-context-docs-20261001-07`. Large evidence remains
  local under the approved source-only GitHub policy.

Next: expose the demo review controls and maintained source sample, rerun the
focused docs checks, and publish the qualified demo. This checkpoint does not
claim manual assistive-technology acceptance or completion of CONTEXT-3.

## API decision

Export `tooltipWarmupContext`, `createTooltipWarmupGroup()` and the
`TooltipWarmupGroup` type from `@en-reve/elements/context.js`. Applications provide
an independent factory-created service using the existing `ContextProvider`.
The factory performs no DOM work or element registration. Applications replace
or share the service identity; they do not need its coordination methods.

With no nonempty `warmup-group`, a tooltip requests this context from its external
trigger. The nearest provider in the trigger's composed ancestry supplies the
service. Tooltip-host ancestry cannot substitute for trigger ancestry. A provider
with `undefined` isolates its descendants; deliberately sharing a service between
providers shares timing and focus priority. There is no implicit global group.

A nonempty explicit `warmup-group` retains precedence. Missing, disconnected or
non-containing explicit IDs stay independent rather than falling back to context.
Explicit ID groups and factory-created services have separate identities. `for`
remains a same-tree ID association; this change does not expand trigger resolution.

Reuse the existing coordinator and event contract: first-hover delay, cooldown,
immediate accepted pointer handoff, focused-help priority, Escape suppression,
cancelable `en-change`, and authoritative writes retain their existing behavior.
Context does not introduce a second source of visibility state or new events.

## Lifecycle and verification requirements

| Requirement | Maintained verification |
| --- | --- |
| Remote tooltip hosts inherit only from triggers; explicit valid and invalid IDs retain precedence | `packages/elements/src/tooltip/tests/context.spec.ts` |
| Nearest/undefined providers, late providers and value replacement update membership | Context browser suite |
| Reparenting, shadow ancestry and slot reassignment cancel stale group work | Context browser suite |
| Focus/Escape and canceled handoff retain the coordinator's semantics; the last departing member cools its group | Context browser suite plus existing `warmup.spec.ts` |
| Existing timing, native surface positioning, description relationships, disabled and touch behavior remain intact | Complete tooltip configuration in Chromium, Firefox and WebKit |
| Public imports require no browser globals and factory calls create independent services | Fresh-process case in `probes/context-protocol/ssr.test.mjs` |
| Provider value and service exports are usable through the supported TypeScript entry point | `probes/context-protocol/consumer.types.ts` |
| Public metadata describes the final source and introduces no registration side effects | Retained freshness checks before regeneration; matching generated metadata, consumer and Context Protocol checks afterward |
| Built example demonstrates shared timing; reset creates a new cold scope | Contextual example case in `apps/docs/tests/followup-reviews.spec.ts` |

The implementation releases subscriptions and ancestry observers on teardown or
rebinding. Both observer delivery and interaction-time reconciliation matter:
an application may move a trigger synchronously before a MutationObserver runs.
Provider replacement must not transfer old warmth to a newly created service.

## Review scenario and completion boundary

Use `/api-examples/tooltip-warmup?progress-report#tooltip-context-example` after
publication. Hover **Canvas help**, then **Layer help**: the first entry waits;
the next opens promptly and dismisses unattended pointer help. Focus a trigger,
hover its peer, and dismiss focused help with Escape. Reset the example and
confirm the first hover is cold again. Compare with the explicit-group example
on the same page. The rendered source sample must include the provider setup.

Completion requires successful builds, the relevant three-engine browser and
public-consumer checks, reviewed metadata differences, and publication of the
qualified source. A queued process, committed tests, or a source-only GitHub push
does not satisfy those gates. Browser assertions do not establish physical touch
or spoken screen-reader acceptance; retain those boundaries in the handoff.

This slice does not reopen the completed CONTEXT-2/R1/R2/R3 research decisions or
add contextual discovery to unrelated components.
