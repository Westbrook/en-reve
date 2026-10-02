---
name: en-reve-app
description: Build an application or complete workflow with En Reve, including state, routing, service adapters, themes and component composition. Use for application-level delivery, rather than adding a library component or building a static component specimen.
---

# Build an application with En Reve

## Responsibility

Own: Application-level state, routing, service boundaries, composition and responsive task flow.

Delegate individual component contracts to en-reve-consume and visual theme rules to en-reve-theme. Do not alter library internals or create a new component merely to deliver an app.

Load another skill only when that separate responsibility is needed for the user's
request. References provide contracts; they are not an instruction to execute
another entire workflow.


Preserve the user's product, framework and deployment choice. Inspect the existing
application and installed packages before proposing a new starter or architecture.
Use `en-reve-consume` for individual public APIs and `en-reve-theme` for visual
customization. In the library checkout, runnable models live under
`apps/docs/src/workflows/`; their shared factory/service contract is in
`apps/docs/src/workflows/shared/README.md`.

## Model the task before assembling controls

Identify the user's primary journey and the state it must preserve. Separate
local editing drafts, accepted application values, pending requests and delivered
results. Keep authentication, routing, storage, upload/message transport,
collaboration, permissions and offline policy in the application layer. Select
existing patterns and native HTML before creating a new abstraction.

Compose meaningful regions and landmarks, actual form/label relationships, and
real links for destinations. Use actions for same-page commands. Decide where
focus returns on close, selection removal, route changes and asynchronous errors.
Responsive layout should preserve the same task and state: a desktop sidebar can
move to an accessible drawer while sharing navigation data and current location.
Avoid duplicate live controls or duplicated IDs across the two presentations.

## Make service behavior honest

Centralize the application's state and service adapters so requests can be
canceled or superseded. Cancel a synchronous component proposal before awaiting
an approval; guard completion by request identity/revision and write accepted
properties silently. Dispose subscriptions and invalidate stale work on unmount.
Do not clear drafts/files on request dispatch; clear the matching draft only when
its actual outcome warrants it. Show retry, cancel, empty and error states near
the task. Additional failure semantics belong to the application's policy.

For demos, use explicit deterministic adapters and visible simulation disclosure.
Do not imply real authentication, sending or persistence. Keep scenario switches
and reset tools separate from the simulated product flow. Never reuse demo service
behavior as a claim of production backend readiness.

## Plan delivery and customization

Keep selective registration and authored child imports explicit. Retain the app's
chosen eager/scoped/lazy profile; loading is not readiness. For SSR, keep request
state local and initial snapshots aligned, and preserve native pre-upgrade edits.
Check the actual framework adapter and package versions; do not infer support
from JSX/HTML syntax alone.

Apply a full theme at the application's appearance boundary, partial scoped
properties for local intent, and public Parts for delivered layout. Account for
portal inheritance, writing direction, density, explicit size inheritance,
reduced motion and forced colors. Slotted app content remains app-owned CSS.
Do not fork component internals to style an application.

## Qualify the assembled experience

Use real end-to-end journeys: complete, interrupt, reject, retry, receive a stale
result, navigate away/back and reset. Verify native form payloads, keyboard focus,
responsive overflow, loading feedback and meaningful empty states. Extend the
application's existing Playwright fixtures with isolated test state and explicit
browser versions; use `en-reve-test` and `en-reve-accessibility` where applicable.
Consumer/browser checks do not establish real backend delivery or physical AT.

Deliver a working route, its source/setup instructions and concrete verification
scope. Follow the user's publication preference and existing hosting/access
configuration; skill use alone does not authorize a new service, account, message,
spend or broader audience. Keep remaining external integrations and manual review
requirements visible.
