# Isolated API examples

Each API live demo reuses an existing authored specimen's `render()` function and handlers. A dedicated same-origin document gives it its own IDs, native forms, theme, scroll viewport and modal/popover top layer. The API page keeps the corresponding authored source disclosure directly beneath the demonstration.

A private Lit controller supplies Auto/Light/Dark appearance, three density presets and Reset. Auto is the default and follows the system preference through precompiled media rules; the parent sends `auto` unchanged to the frame. The frame mirrors the accepted mode into `data-en-appearance`, the paired CSS boundary, and retains `data-example-mode` as a protocol diagnostic. Appearance and density select precompiled CSS inside the frame and retain its DOM, native draft and accepted interaction state. Reset recreates the case from its original template. If an authored link navigates the frame elsewhere, Reset restores the original case document and reapplies its controls. No native link or handler is rewritten. Parent appearance/density controls consume tentative `en-change` by canceling, validating the enum, and explicitly writing the accepted value; only accepted settings are sent through the existing document-identity-checked protocol.

The parent registers only its documentation controls. The frame uses a generated finite list of dedicated registration imports for its case; it does not call `registerAll`. Its template still comes from `examples.ts`, and displayed code still comes from that source through the existing generator. This is isolation, not an alternate component implementation.

Server output selects the exact case before construction and renders the same template the client hydrates. All documents begin Auto/comfortable on the server and first client render, then the parent handshake applies its local settings. Before JavaScript, Auto already renders the matching light or dark branch. A later system change updates Auto paint and native controls without a configure request, resetting a specimen, or modifying accepted values. Explicit Light/Dark stays fixed. Parent/child messages accept only finite appearance/density/reset values and check origin, source, case, active document identity and request revision. The iframe element declares `color-scheme: light dark` so Auto remains independent of a forced parent. The parent source disclosure retains its own adaptive GitHub syntax theme, independent of the example override. There is no runtime theme compiler in either demo controller, and no CSS/HTML payload, evaluation or imported candidate file.

The frame has a descriptive title and a responsive viewport; its content uses normal keyboard traversal. It does not automatically steal focus or resize its parent in response to its own viewport. Overlays remain inside the frame. Some specimens contain links to broader documentation context; those links retain their authored behavior.

Browser checks cover interaction retention, reset/recovery, isolation, SSR hydration, narrow layout and selective registration. `tests/api-examples-smoke.mjs` compares native server-rendered and hydrated form state for every generated case in all three engines. Manual screen-reader, physical-device and current-minus-one verification remain separate evidence.

Element controls are generated from public writable CEM fields and resolved source types. Booleans, strings, finite numbers and literal enums receive one editor per public property, with its mapped attribute shown. Named and inherited enums come from the source checker. Read-only fields, methods, arrays, objects and unresolved types stay documented without an editor. Numeric drafts use the library text field with decimal input mode and finite-number validation; this does not invent bounds or a step.

`api-control-targets.mjs` deliberately identifies one exact authored target per supported component. The iframe checks case, component tag, target ID, document identity, request ID and allowlisted property/value. It requires one matching native host and retains that node across edits to selector-bearing attributes. A missing/removed target is an explicit unavailable state; it never falls back to the first tag or reaches into another component's shadow root. Child components whose state belongs to a collection and values mirrored by example-specific handlers have explicit exclusions. No standalone splitter target is fabricated.

Each editor keeps a local draft until Apply. The child serializes configuration commands, performs silent public-property writes, waits for updates, and reports actual values. It never synthesizes `en-change`, `en-input` or native clicks. Settled user `en-change` events refresh observation; Refresh values also reads independent author writes. Neither observation nor theme changes replay overrides. Original authored source stays unchanged and does not claim to contain subsequent inspector writes.

Reset example clears inspector drafts, errors and pending operations and recreates the authored specimen, preserving the chosen example appearance and density. It restores authored omitted attributes rather than assigning CEM default strings. State and acknowledgments are scoped per API component, including components sharing one example document. Parent registration additionally includes only the checkbox and text-field editor definitions; example-only classes still remain isolated in their frames.

Additional named presets should be adopted build inputs rather than implicit imports of local review files.

The browser build preserves native module execution order with Rolldown `strictExecutionOrder`. Lit installs its hydration hook before evaluating LitElement; sharing those modules across the new definition chunks must not reorder that installation. The child app hydrates its property bindings before selective definitions upgrade its children. Browser checks preserve native input/root identity so a second client render cannot masquerade as hydration.

## Command surfaces example

`command-surfaces` is one authored, resettable case shared by `en-toolbar`, `en-menu`, `en-menu-item` and `en-command-palette`. Portrait and Landscape change the same native preview; Publish study is visibly unavailable in this local example. The copied source contains its complete allowlisted application handlers and necessary native module imports. It does not contact a service or imply that a command is a selected form value.

The exact public targets are `#specimen-toolbar`, `#specimen-menu`, `#specimen-menu-item` and `#specimen-command-palette`. Inspector controls preserve the trigger `for` relationships, menu-item action ID and palette command catalog through explicit exclusions. Editable scalar properties still use silent public author writes. The menu and palette execute their application action only after full `en-action` dispatch and accepted default closure; canceled action or close attempts leave the preview unchanged. Toolbar clicks call the same executor. No app handler reaches component shadow internals.

The separate Settings workflow applies this composition to existing Save, Restore saved opacity, Cancel save and Review incoming change paths. Its local deterministic fixtures support invalid-input, pending-save and changing-context review. New command-family browser and SSR checks must be recorded independently of the earlier API-example receipts; this documentation makes no claim of physical-device or assistive-technology completion.

`tooltip-warmup` is the shared authored case for `en-tooltip`: an Editing guidance toolbar shares pointer warm-up, while Export guidance belongs to a separate group. The tooltip hosts are siblings of the toolbars; `for` identifies each external button and `warmup-group` identifies its containing toolbar. Both relationships are excluded from scalar inspector edits, while the public timing properties remain editable. Reset recreates the groups and tooltips. The sticker sheet exposes the same resettable case at `#specimen-tooltip-warmup`; the settings command toolbar supplies a workflow counterpart. Focus descriptions remain attached to the actual buttons, keyboard opening stays immediate, and touch does not warm pointer groups.

## Authored table example

`authored-table` presents `en-table` around a complete native table, including its caption, column headers and row headers. Its named viewport becomes a keyboard stop only when the table overflows. An instance-owned Lit directive keeps application state and renders keyed rows; the example's Name and Updated buttons sort those existing row nodes and update `aria-sort`; native single selection survives that movement. The table itself adds no selection state, sort event or grid keyboard model. Reset recreates the original row order and clears the selection. The API inspector targets `#specimen-table`, allowing the shell's label and inherited size to be adjusted independently of the authored data.

The `table.css` and `radio.css` links are ordinary browser stylesheet links in the author's root. Consumers choose their hosted URLs. A Lit shadow-root consumer can instead include `tableStyles` and `radioStyles` in static styles. No JavaScript CSS side-effect import or bundler-only processing is needed. The native table remains readable in the initial SSR response, before definition or hydration.

The sticker sheet reuses this case with all adopted inspired-theme tokens; the Asset Browser supplies the larger sorting and grid/list/table composition. Physical screen-reader table navigation and current-minus-one browser acceptance remain explicit manual review work.

`virtual-collection` is the documentation-owned large-collection integration lab. Its independent Table/List and Windowed/Paginated controls share 10,000 records, stable keys, the selection model, and the public `VirtualCollection` range model. It uses `VirtualCollectionController` with an explicit viewport (`en-table.scrollElement` or a list scroll region) and native `virtualTableRows`/`virtualListRows` adapters. The first 20 records are rendered before JavaScript; browser measurements begin after hydration. Paginated mode renders complete pages without virtual gaps and supports ordinary reading, browser Find and printing within the current page. It does not imply that omitted records are discoverable by browser Find.

Table and List share `en-checkbox` selection controls with slotted, visually hidden
asset labels. The demo applies accepted `en-change` events to its keyed selection
model; cancellation leaves selection unchanged. Focus-retention checks exercise
the actual native input inside each checkbox shadow root, including hydration,
distant scrolling, keyed moves and native Tab navigation.

The minimal integration has three independent pieces: construct `VirtualCollection({ items, key, estimateSize, initialCount })`; connect a `VirtualCollectionController(host, model, { viewport, content })`; render `virtualTableRows(model, { columns, renderCells })` in a native `tbody` or `virtualListRows(model, { renderItem })` in a native list. Data changes call `model.setItems(records)` and `controller.refresh()`. Selection is a separate `createSelectionModel` keyed by record identity. The lab's fixture generation, testing controls and pagination are application code, not required public component API.

The table defaults to sticky column headers (`sticky="header"`). Its `sticky`
property also accepts `footer`, `both` or `none`; `sticky-caption` independently
keeps the caption visible. The virtual-collection lab provides these options and
an optional real summary row, preserving native `thead`, `tbody` and `tfoot`
semantics. Its total row count includes any footer, and the footer’s logical index
follows the full data set rather than the mounted window.

The virtual runtime reads `en-table.scrollInsets.blockStart` and `.blockEnd`
through `occludedBlockStart` and `occludedBlockEnd` callbacks. The shell owns sticky
section measurement and focused-control scroll clearance; consumers need not
inspect private shadow markup. Toggling these controls updates the same table and
refreshes the runtime, preserving selection and any retained focused record.
Caption pinning and the summary start off, leaving the most useful reading area
on small screens. Mobile review should include orientation changes, enlarged text,
RTL, distant reveal and focus near both sticky boundaries.

For offscreen keyboard review, reveal asset 3000, focus its selection checkbox,
then wheel or drag the scroll region far away without clicking another control.
Press Tab: focus should move to asset 3001 and bring that control back into view.
Shift+Tab returns to asset 3000; repeated Tab continues through successive records.
Repeat in List mode. The original control and selection must survive scrolling.
The Show asset action uses the controller's public `scrollToKey(key, options)`
method; it reveals the destination without selecting it or moving keyboard focus.

Below the collection, expand the initially collapsed scrollToKey() disclosure to use the standard
`behavior`, `block`, `inline`, and `container` values. Defaults match native
scrollIntoView: auto, start, nearest, and all. Choose nearest to keep the page
stationary while revealing an item inside the collection, and smooth to review
animated windowing. The previous custom align option is replaced by block.
Enter a stable Asset key such as `asset-09000`; the live call preview follows all
five inputs. Show asset reports the method's boolean result without claiming that
an asynchronous reveal has finished. A missing key returns false and leaves the
scroll position alone. Paginated delivery uses the same key to find its page.

## Pagination review

`pagination` is a resettable, source-backed example of `en-pagination`. Its primary
control (`#api-pagination`) starts at page 1 of 12 and is the API Controls target.
The fixture owns three studies per page and announces accepted results in its own
status. **Hold current page** demonstrates synchronous `preventDefault()` on the
single cancelable `en-change`; no extra control-event pattern or controlled mode is
used. The initially collapsed unknown-total example sets `pageCount` to 0 and lets
the application supply `hasNext` after each local batch. It does not start a network
request, guess a server total or present all unmounted records as searchable.

The isolated review supports its existing theme, density and direction controls,
including inspired themes, independently of the embedding API reference. Reset
recreates both fixture states. Source imports are assembled from the maintained
example with only the Lit bindings it uses.

Both the large collection review and Asset Browser now compose this same element
for their paginated delivery. The public `page` is one-based; each application maps
it to the shared table model's zero-based page only after an uncanceled `en-change`
is still current. The element's readable Page n of m status stays separate from the
application's live announcement of loaded results. Fetching, selection, page data,
and scroll position continue to belong to those consuming applications.

## Menu and content breadth review

`menu-choices` adds a resettable preview with a checkbox menu item, an exclusive
radio group and an Export submenu. Choices dispatch the single cancelable
`en-change` while the checked value is tentative; Hold preview settings cancels
only item changes. Open/close events from menus are filtered out by origin and
reason. Checkable items keep the menu open. Nested menus are authored after their
trigger item with `for`; keyboard direction follows reading direction, Escape
closes one level, and Tab leaves the root menu. Commands remain `en-action` because
they request an action rather than a state change. The Settings workflow uses the
same choices against its existing application state. Root menu buttons author the
library's decorative `chevron-down` in the suffix slot, including in SSR output.
The menu choices example uses semantic separators around its radio set; dividers
also distinguish settings choices from ordinary commands in the workflow.

Mouse hover opens child menus with protected pointer travel; moving off the
child alone keeps it open, while entering another ancestor row changes the open
branch. Coarse/touch delivery replaces the parent panel and provides Back.

`content-recipes` demonstrates ordered handoff steps, missing-thumbnail fallbacks,
long names, availability copy and explicit empty/no-results/unavailable recovery.
Grid/List changes retain keyed controls and selection. The Asset Browser's empty
result has a direct Restore current catalog action. These recipes preserve native
list and definition-list semantics and do not infer alerts, loading services or
selection policy. Their generated source uses native stylesheet links.

Both isolated reviews expose all six inspired themes, appearance, density and
Reset example. The API reference links the recipe guide and the bounded framework
consumption/SSR ownership guide; that fixture evidence does not claim complete
framework or metaframework support.

Known-total pagination keeps seven equal-width numbered/ellipsis positions when
there are enough pages, with stable Previous and Next actions and status below.
In a narrow container it deliberately shows Previous, status and Next, with an
initially collapsed Choose a page disclosure for direct numeric access. This is
container-responsive, including inside an API iframe; it does not wrap the full
number strip into multiple action rows. Boundary actions remain present and
become disabled. Shared geometry overrides are `--en-pagination-gap`,
`--en-pagination-page-min-inline-size` and `--en-pagination-status-gap`; translated
`directLabel`, `pageNumberLabel` and `goLabel` name the compact delivery.

The same tooltip page now begins with `#tooltip-position-example`: public inline/block region controls and an RTL comparison around a native component trigger. A demo-owned shadow root exercises the same-root ID and CSS Part anchor bridge used by applications. The default is centered at block end; collisions flip/shift without changing the authored preference. Source disclosure includes the full demo composition.
