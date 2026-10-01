# Reference workflow application helpers

These are documentation-application utilities. They are not `@en-reve` library exports,
identity providers, messaging services, synchronization rules, or a schema renderer.
Create every model, service and helper inside its workflow factory. Imports, constructors
and initial `read()`/template calls must not access browser globals or start async work.

## Independent implementation boundaries

- `workflows/sso/{model,service,template,styles,index}.ts`: account/workspace → provider →
  pending continuation → result; field errors, retry, back and cancel retain entered data.
- `workflows/settings/{model,service,template,styles,index}.ts`: local creative artifact,
  accepted local edits, separate saved snapshot, save errors and explicit concurrent-update
  resolution. Keep incoming service state separate from an active native draft.
- `workflows/chat/{model,service,template,styles,index}.ts`: scripted messages, retained
  composer draft, send recovery, and a finite authored contextual-control card with its own
  operation lane and applicability/revision checks.
- `workflows/shared`: only data/result contracts, request lifetime and fixture timing.
- Root integration owns the shared `workflows-app.ts` review shell and separate
  sign-in (`workflows.html`), settings (`workflows/settings.html`) and chat
  (`workflows/chat.html`) page entries. Each entry supplies only its own factory,
  template source and styles; other workflows are neither created nor rendered.
  Native page navigation provides direct review URLs and browser history. Each
  fresh page load starts a local scenario; normal Back/Forward restoration is
  retained. Bounded preview query values preserve
  review settings after hydration. Preview updates within a page retain its active task. The component sticker sheet remains a separate destination.

Each public factory accepts `WorkflowOptions` (`requestUpdate`) and returns
`WorkflowController<TemplateResult>` (`render`, `reset`, `dispose`). It can keep an internal
`WorkflowModel<Snapshot, Actions>`: `read()` reads its instance-local `Signal.State`, while
each accepted snapshot update calls the supplied host callback. `template.ts` exports a
pure function of snapshot and actions. Its
binding handlers translate component events to ordinary action arguments. The public
component event protocol is deliberately not selected by these helpers. `styles.ts`
exports scoped workflow styles for root to include, with no global selector reset.

Keep the active models mounted across theme changes. Navigation/unmount ownership is
explicit: cancel on leaving a workflow if its model is destroyed, or retain it deliberately.
The root calls `dispose()` before destroying a retained model. A reset cancels all its
request lanes first, normally resets fixture scheduling, and then restores the initial
snapshot. A named late-response QA scenario may deliberately retain an abort-ignoring
external response for release after reset; it must not retain product pending state. Dispose
always clears that retained work.

## Component change consumption

A single cancelable `en-change` is dispatched while the proposed public value and
FormData are already available. Its detail retains `previous`, `proposed` and
`reason`. `preventDefault()` rejects the tentative change; the component restores
the previous value unless a synchronous public setter write supersedes that
rollback. Public writes are silent, including an equal-value write. Components
have no `controlled` mode. `en-input` still describes a native editing draft and
does not imply acceptance or permission to start a service operation.

The docs-owned `../../change-consumption.ts` separates two application policies:

- `acceptValueChange` cancels synchronously, asks the model to decide, then writes
  its accepted value through the component's public setter. Returning `undefined`
  rejects without an author write. Theme selectors and the chat opacity proposal
  use this policy. They do not depend on a later Lit render to accept the value.
- `afterAcceptedChange` observes in a microtask, after all synchronous listeners
  have run. It requires an uncanceled event, a connected source and a public value
  that still equals the proposal. Account fields, settings, project selection and
  fixture selectors use this policy, so rejected or superseded values do not
  change their application models. Each workflow also honors disposal before
  changing its model. Checkbox consumers compare `checked`, rather than `value`.

Both helpers capture the direct host during dispatch; a bubbling change from a
nested/slotted component must not be mistaken for the containing field's change.
They are documentation application utilities, not additional library events or
exports. Copied sticker-sheet specimens keep the same observation guard inside
their own source, so consumers do not need a private documentation import.

Cancellation is synchronous: awaiting before calling `preventDefault()` is too
late. An asynchronous application may cancel now and later explicitly write an
accepted value, but it must still validate request identity and domain revisions.
The request lanes below remain responsible for stale service responses; settling
a component event is not a replacement for those checks.

## Services, state and results

Each `service.ts` declares its own small typed adapter. For example, an SSO continuation
accepts its provider/account input plus `ServiceContext` and returns
`Promise<Result<SessionSummary, SignInProblem>>`. Settings conflicts carry the incoming
snapshot/revision; chat problems identify whether a failed send can retry or a contextual
object is no longer applicable. Domain problem unions supply authored outcome keys and
field/global error data. Unexpected exceptions still require a recoverable fallback.

Do not add one shared union that forces sign-in steps, setting conflicts and message
statuses into the same state machine. Each snapshot distinguishes pending operation,
accepted local data, native draft when relevant, saved/remote state, error and actual
success. Store enough input and target/base-revision identity to retry deliberately.
Success feedback follows an applied service result, never `preventDefault()` or dispatch.

An application action uses a request lane as follows (domain names are illustrative):

```ts
const request = saveLane.begin();
if (!request) return; // Repeated activation does not submit again.
state.set({ ...state.get(), save: { status: 'pending' } });
try {
	const result = await service.save(candidate, request);
	if (!request.isCurrent()) return;
	// Recheck target/base revision here if intervening edits make this result stale.
	applySaveResult(result);
} catch (error) {
	if (request.isCurrent()) showRecoverableSaveFailure(error);
} finally {
	request.finish(); // An old completion cannot clear a newer request.
}
```

Capture `candidate` before awaiting. `isCurrent()` must guard every completion, including
failure, and domain revision/applicability checks may reject a still-current response.
`cancel()` invalidates first and then aborts; a service that ignores abort is still stale.
Use separate lanes for independent operations, such as sending chat text and applying a
contextual setting. Abort does not itself authorize rolling back a user's later edits.

## Deterministic fixture controls

`createFixtureScheduler().respond(() => result, { action, signal, delivery })` supplies
microtask-immediate, fixed-delay or manually held results. A domain fixture owns its
explicit response sequence and creates a fresh `Result` object per invocation. Capture
which response will apply when the request starts; changing QA settings must not rewrite
an already-issued response. There is no random failure rate, real network, or real account.

`pending` exposes request IDs/action names to the separate QA region. `release(id)` permits
out-of-order completion across independent lanes; `release()` releases the first held
response. Scheduler IDs remain monotonic across reset so a stale release ID cannot target
a newer request. `reset()` cancels pending responses; `dispose()` also prevents new work.
Models must still check request identity: injected adapters and real applications may
ignore cancellation. Tests should include an explicitly non-cooperative deferred adapter
whose late completion arrives after reset/cancel or a newer request.

Place fixture disclosure, named scenario, timing/failure selection, held-response release,
source and reset outside the product task surface. The flow itself uses ordinary task
labels and feedback. Announcements and focus belong to each authored composition; this
core never moves focus or narrates status automatically. Do not put arbitrary HTML, ARIA,
functions or component constructors in scripted service payloads.

## Core verification

From the repository root, Node 24 runs the durable async lifecycle suite directly:

```sh
node --test apps/docs/tests/workflow-core.test.ts
```

These tests exercise duplicate activation, authoritative request identity, non-cooperative
late completion, ordered/manual delivery and reset/dispose cleanup. They do not establish
workflow usability, native editing, accessible focus behavior or SSR hydration; the complete
three browser journeys provide that separate evidence.
