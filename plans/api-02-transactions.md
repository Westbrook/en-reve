# API-02: transaction and interruption guarantees

Implementation authorized September 18, 2026. Local verification and main integration are tracked separately from publication and user review.

## Contract

A proposal exposes tentative public state during synchronous `en-change` dispatch. The default commits only if it still owns that state and its operation remains eligible after listeners return. Explicit property writes, including equal assignments, and accepted nested proposals supersede older defaults and rollbacks. Canceled nested attempts do not supersede their parent. Event names and detail shapes are unchanged.

| Audit finding | Implemented behavior |
| --- | --- |
| E3 | Rich-editor document commits use the existing `dispatchChange` coordinator. Full editor state is retained for cancellation, while newer accepted edits survive the outer request. A disabled/read-only or disconnected editor rejects stale document commits. |
| E4 | Token and rich picker completion rechecks session identity, revision, abort, connection and editability after application action listeners. Exceptions from opening, selecting or handing off a picker abort and close that session before rethrowing. A newer session opened by the callback survives. Occurrence cancellation restores a surviving editable token button, otherwise editor focus. |
| FORMS-06 | Invalid color-plane string and typed writes end the current gesture, retain accepted color, report invalidity and emit the existing cancel-preview event. Pointer release cannot commit that interrupted draft. |
| FORMS-13 | Radio selection rechecks the original child's current slot membership, key, disabled state and the group's current disabled state. |
| OVL-01/02 | Modal and floating buttons share click admission: an already-prevented click is ignored; an eligible associated button consumes the click default (including form submission). Popover/menu trigger requests recheck live identity, association and availability. Tabs and standalone/grouped accordions recheck their operation's eligibility after dispatch. |
| OVL-03/04 | Accordion item key/slot changes reconcile against group values; tab/panel ID changes repair paired ARIA references. Tabs skip hidden, inert and unrendered targets for focus and activation. |
| OVL-09 | Defaulted navigation/toolbar/pagination and overlay close/back/search labels restore their constructor defaults after attribute removal. Authored empty strings are preserved. |
| N2 | `notify()` still returns an element synchronously. `dismissAll()` includes pending insertions with independent vetoes; disconnect cancels pending insertion. Pre-connection calls queue for first connection. |

## Consumer example

```js
shipping.addEventListener('en-change', event => {
  if (event.detail.proposed === 'express') express.disabled = true;
});
```

When Standard is selected and the user chooses Express, the listener makes Express ineligible. The proposal now rolls back to Standard. An explicit `shipping.value = 'other'` inside that listener remains authoritative, even if the event is canceled.

## Compatibility and boundaries

- Associated popover/menu buttons now suppress their form submit default, matching modal openers. Use a separate submit button or explicitly call the application's submit action when both actions are intended. Modal opener-only and menu/popover toggle behavior are retained.
- Changes deliberately made by application listeners are not undone. Only the component's superseded or ineligible default is canceled.
- Selection values, unavailable accepted-value form semantics, native terminal overlay reconciliation and asynchronous load protocols are unchanged.
- Localization properties remain string APIs. Remove the attribute to reset a default; use `''` for explicitly empty text. Direct `null`/`undefined` property writes are outside those types and are not a reset API; pagination safely renders a nullish format template as empty text.
- The report's historical audit findings describe the original source. This document records their implementation disposition.

## Verification

Reproduce and verify browser behavior with:

```sh
npx playwright test --config probes/api-transactions/playwright.config.ts
```

The probe loads this checkout's TypeScript source, including its shared transaction helper. It covers Chromium, Firefox and WebKit. Additional existing editor, overlay, selection and toast integration checks, the complete build and metadata freshness are recorded in `artifacts/api-02/verification.json`.

Local verification: 126 API-02 browser checks, 81 existing tabs/accordion checks, 207 overlay checks, and 165 built editor/color-plane/toast checks pass. Shared model/transaction tests (42), tooling tests (39), the complete build and metadata freshness pass. The command suite passes 100 checks with one skip and one Chromium focus assertion failure (`commands.spec.ts:290`); the same failure reproduces on unchanged main and in an isolated rerun. It remains an existing test limitation, not an API-02 regression.

## Follow-up eligibility coverage

The [API normalization follow-up](api-normalization-followup.md) extends callback-time eligibility checks to all token-editor model proposals and the shared field, choice and numeric-choice bases. Replacement/history operations reject disabled/read-only or disconnected defaults; form controls also honor native fieldset disabling. Authoritative writes and accepted nested changes retain precedence. Run the complete matrix through `npm run test:api` or the candidate-bound `npm run test:release`.
