# API-01 implementation

Authorized in the API-01 task on 2026-09-18. Data events remain CustomEvent; consumers use exported types in handler signatures without runtime narrowing.

## Contract

- Feed and data-table `en-page-change` use `ChangeDetail<number, 'pagination'>` and the shared tentative transaction. Feed retains deprecated `detail.page`; its property timing intentionally changes. Explicit author writes and accepted nested proposals supersede old rollback/defaults.
- Feed `en-load-request` is cancelable and exposes `respondWith(pageOrPromise)` plus its existing `detail.complete/fail` callbacks. `respondWith` must claim the response synchronously, once. Callback completion remains safe after await. Cancellation, replacement and disconnection abort the lease; stale responses have no effect. Response rejection produces error status.
- Feed/tree `en-load-state-change` is noncancelable with status and requestId; context remains family-specific. Loading terminates in loaded, empty, error or idle after cancellation. Feed `requestOlder` reports acceptance, tree `loadBranch` reports completion. Application callback handlers must settle or explicitly cancel their request.
- Legacy feed `en-load` runs only when the new request has not claimed a response and was not vetoed. It uses the same lease. Tree retains its legacy `en-load` notification. Consumers subscribe to one name per phase, not both.
- Public navigation disclosures gain tentative `en-change` on user activation; terminal native reconciliation remains noncancelable `en-toggle`. Author writes remain silent. Native SSR disclosure remains usable before upgrade. Progress-steps compact disclosure remains an explicitly internal facet.
- Menu Back/reverse submenu navigation reports `back`, not `escape`. Other existing reason vocabularies are retained and documented rather than silently renamed. No optional origin metadata is added without a consumer need.
- Overlay proposals describe open intent, not completed presentation. Author writes and native terminal closure remain silent with respect to proposals. No speculative presentation event is added.
- Export semantic event aliases and component-local listener maps for the API-01 collection, navigation, overlay and editor surfaces. Preserve native listeners, listener objects, AbortSignal and removal. No global narrow `en-change` declaration.

## Verification

Focused browser regressions cover pagination rollback/supersession, request ownership and terminal paths, compatibility delivery, disclosures and accurate submenu reasons. Type fixtures cover explicitly typed handlers and inferred payloads. Run shared transaction tests, affected browser suites, metadata and the workspace build. No publishing or unrelated API/theme implementation is included.

## Editor and metadata policy

Token editor reasons remain `edit | undo | redo`. Rich editor reasons remain
`input | extension | paste | cut` and the public RichEditorCommand union. Both
provide typed change/input/action aliases; this is a documented family mapping,
not a silent rename of existing reason strings. The rich toolbar request is an
explicit direct-host association protocol (cancelable, not bubbling/composed).
The internal toast focus-return event is source-marked `@internalEvent` and
excluded from consumer documentation by metadata reconciliation.

## Migration notes

A listener that previously wrote `feed.page = feed.page` during a proposal now
writes the **tentative new page**. To retain the old page, use
`feed.page = event.detail.previous`; to veto normally, use preventDefault alone.
The old detail.page field remains an alias, but cannot preserve the old property
read timing. Update synchronous policy handlers and regression expectations.

Callbacks are retained on `ActivityLoadDetail` for compatibility; the request's
respondWith method is implemented on a document-realm event subclass behind an
exported structural interface. Consumers import the interface as a type and do
not depend on a constructor or instanceof. respondWith after dispatch, after a
prior response claim, or after cancellation throws InvalidStateError. A vetoed
request never enters loading; a request canceled after loading reports idle.

## Verified implementation

- Full workspace build, metadata generation, explicit handler type fixtures and negative cases pass.
- 60 focused browser cases pass across Chromium, Firefox and WebKit.
- 243 existing activity-history, tree-operations, data-table, navigation-sidebar and menu-expansion cases pass; 3 existing touch-emulation cases are skipped by their browser guards.
- 37 shared transaction and metadata tests pass, including internal event classification and compatibility payload protection.
- No publication, manual assistive-technology acceptance, or cross-document stylesheet adoption is claimed. The document-realm test covers events on a detached adopted element.

Evidence: `artifacts/api-01/verification.json`; repeatable checks and scope are in
`probes/api-events/README.md`. The live history simulation retains its old callback
listener as compatibility coverage; its displayed application example uses the
new typed respondWith API. No runtime event narrowing is required by either path.
