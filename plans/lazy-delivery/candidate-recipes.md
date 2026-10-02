# Current generated-content recipes and rejected candidates

Current checkpoint, 30 September 2026. Media gallery construction, contextual-toolbar construction, pagination chooser construction and application color code delivery are [rejected with evidence](measured-rejections.md). Their active recipes below describe restored eager ownership. The [final command/combobox construction candidates](final-construction-rejections.md) are also rejected after full sampling failed required gates; all six families return to their eager construction/registration contracts. The [accepted closeout](README.md#accepted-closeout) records the separate final 75-stage correctness pass, user acceptance of two uncertain Firefox API checks and successful private docs publication. The rejected candidates gain no performance qualification from that acceptance.

The [current evidence index](evidence/current-dispositions.json) binds the four decisions to measured candidate `0aa7a3057d993cee04f5c0f49b5ba482945b8ed7` and reference `fba5ec19b58606cf1776df44862a38a3898f4c72`, preserved at `be9cd5068dbfb9dfc9028b6efe3c943955a97464`. The original recipe proposal remains in that commit. Frozen protocols, acquisition sources and historical results retain their original meaning.

## Construction outcomes

All measured `contentRendering` construction candidates are rejected. These recipes describe the eager contracts retained by coordinated retirement; no construction descriptor adds a `prepareDelivery()` binding. Shared preparation/registration APIs and independent fixes have the separate [recorded acceptance](README.md#accepted-closeout); their automated API performance verdict remains unqualified. The final-two measured subjects differ from the original four; see [C1 results](final-construction-rejections.md).

| Component | Current construction contract | Status |
| --- | --- | --- |
| Contextual editor toolbar | Generated fallback controls are eager; contextual visibility remains selection-owned. | Measured opt-in rejected |
| Media viewer | Generated carousel, slides and controls are eager; native modal opening keeps its owner. | Measured opt-in rejected |
| Pagination | Known-total chooser controls are eager; unknown totals remove the chooser semantically. | Measured opt-in rejected |
| Application color popup | Definitions are eager; popup DOM remains conditional on an editor session. | Measured optional-code candidate rejected |
| Combobox | Current filtered option rows are eager; popup visibility and native input retain their owners. | Measured opt-in rejected |
| Command palette | Search/results/status are eager; modal visibility and transactions retain their owners. | Measured opt-in rejected |

## Contextual editor toolbar

Use the normal contextual toolbar without a construction policy:

```html
<en-editor-toolbar for="brief" mode="contextual"
  label="Selection formatting"></en-editor-toolbar>
```

Keep the persistent formatting toolbar and the secondary contextual toolbar in [rich-text-demo.ts](../../apps/docs/src/rich-text-demo.ts). Eligible selection still controls contextual visibility; authored controls keep slot precedence. Eager fallback construction does not move editor, bookmark, Link draft, Apply/Cancel/Escape, focus or placement ownership. Preserve the independent focus-visible shortcut, initial native tabstop, selection/direction and Link regression fixes. Match server/client editor and toolbar state under the existing hydration owner. Cross-document rich-editor transfer still creates a fresh destination-realm editor from serialized public state; it does not move an active backend session. See [editor results](editor-results.md) for the preserved limits and measured rejection.

## Media viewer

```ts
import type {EnMediaViewer} from '@en-reve/elements/media-viewer.js';
// Canonical definitions have already been registered in this scope.
const viewer = scope.createElement('en-media-viewer') as EnMediaViewer;
viewer.items = images;
mount.append(viewer);
if (images.length) viewer.activeKey = images[0].key;
const outcome = viewer.show(); // Existing synchronous ChangeOutcome.
```

The gallery body is eager. Keep the native dialog, heading/description and close/footer slots, reversible `en-change`, accepted media key, zoom/pan and image readiness owners. The independent hidden-carousel geometry correction and permanent regressions survive the opt-in's rejection. `show()` acceptance does not certify nested rendering or image decoding; await the relevant existing readiness when needed without changing the synchronous semantic API. Match initial open/items/active-key state for SSR; meaningful no-JavaScript actions remain application-owned.

## Command palette: eager body

Use the normal `en-command-palette` with its commands snapshot and no construction policy. Search, result rows and status construct eagerly. Preserve the dialog shell/heading/close, authored supporting/footer slots, native input identity/draft/IME and current command model. `show()`/`hide()` and cancelable command actions remain synchronous with reversible staging and authoritative-write precedence. Opening/focus and accepted-close query reset keep their existing owners.

Match initial open/commands for SSR and retain native pre-hydration values under one hydration owner. The separately established application-root preparation and canonical definition loading remain distinct from this rejected construction feature; do not remove those APIs as part of retirement. The [C1 gate failures](final-construction-rejections.md) do not qualify the restored eager source.

## Combobox: eager suggestions

```html
<en-combobox label="Project" name="project"></en-combobox>
```

Supply the existing `.items` catalog and accepted `.value`; current filtered rows render eagerly. Preserve the native text editor, labels/descriptions/status, popup/listbox shell, local catalog and filtering. Query typing retains `en-input`; accepted-ID changes retain synchronous cancelable `en-change`, form/reset and authoritative-write semantics. Active-descendant references, positioning/no-room behavior, keyboard intent and outside dismissal remain owned by the current control.

Match initial items/value and preserve pre-hydration text, selection and focus as unaccepted native draft state. Hydration must not commit the query or open suggestions; keep composition, accepted label/ID and form state independent. The custom picker still requires JavaScript to choose an option. Preserve eager lifecycle/adoption cleanup and independent test corrections; removal of the policy does not waive those obligations.

## Pagination: eager chooser and retained compatibility fixes

```html
<en-pagination label="Asset pages" page="6" page-count="40"></en-pagination>
```

The native chooser body constructs eagerly for known totals. Preserve target IDs, Previous/Next/page actions, current status, authored slots and native popover opening; do not replay opening or add asynchronous materialization. Go/Enter retain validity, cancelable page acceptance, author precedence and focus return. Unknown totals remove the whole chooser; recreating it starts from the accepted page.

The shared EditingController owns the native draft separately from the accepted page. Retain initial dirty-value adoption, silent later authority, composition completion, stable serialized default, cancellation and no public `en-input` for chooser drafts. The independent first-hydration recovery adopts a still-open chooser whose native toggle finished before listeners attached. It preserves newer outside focus, duplicate-opening guards, marker clearing and positioning/cleanup. These repairs and permanent eager tests survive construction-policy retirement. No-JavaScript page/status markup stays meaningful; the positioned chooser still requires JavaScript. The [request-only rejection](measured-rejections.md) retains the passing observed DOM findings without implying timing or retention acceptance.

## Application color popup: eager definitions, existing session owner

The composable-chat application restores its eager definition closure and existing template. It no longer exposes the rejected `prepareComposableChatColor` / `prepareColorControls` preparation surface or lazy profile/loader/directive. Popup DOM remains conditional on a current editor session, as it was before the code-delivery experiment; rejection does not make the popup permanently mounted.

Keep eager parsing/serialization, token paint, native and typeahead paths. The editor owns query, token identity, selection/bookmark, accepted document, undo/redo and commit/cancel. Trusted `openPicker()`, `showPicker()` and click actions remain synchronous in their original callback. Do not implement eager restoration as unconditional startup preparation through the rejected mechanism. Other eager color consumers keep their own definition ownership. Preserve the readable initial SSR editor snapshot and existing hydration owner; the failed fractional byte gate establishes no cold, timing, retention or human result.

## Integration boundary

The canonical inventory retains all feature IDs and records all six evidence-backed rejections with empty deferred costs and no acceptance. Current source/API examples and metadata must agree with eager restoration. Generate metadata through its existing producers after prescribed freshness checks; no whole-file historical restore or hand-edited generated sibling. The independently accepted common button fix and final eager source are covered by the exact 75-stage correctness record linked in the [accepted closeout](README.md#accepted-closeout). The accepted Firefox API uncertainty remains explicit. The measured historical subjects, failed attempts, scoped human observations and frozen protocols are not relabeled. Only the user can mark review complete.


## Helper consumers and logical scrolling — 2026-10-02

The [packed helper consumers](../probes/helper-recipes/README.md) qualify the three
remaining interaction entries: optional slot recovery, static stylesheet adoption
and scrolling. An application-owned Lit renderer exercises actual SSR/hydration;
the recovery and stylesheet marker protocols remain internal integration details.
111 three-engine cases and43 Node controls pass. The expanded comparison exposed
a real vertical-writing fallback error: logical axes, negative scroll coordinates,
sticky insets and smooth cancellation now agree with the tested native behavior.

A fresh production build and153 existing virtual-list, tree and activity browser
cases pass. Failed attempts are retained. All111 inventory entries now have bounded
named-scenario receipts; this closes the inventory pass, not the entire goal.
Native Firefox comparison, retail/physical platforms, manual AT, complete
SSR/hydration and separate-owner obligations remain distinct unfinished scope.
Historical external CSS-authoring rerun remains retired, never passed.

Final integrity/helper qualification passes179 Node checks and111 browser cases.
