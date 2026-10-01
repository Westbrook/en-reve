# Asset browser reference workflow

`/workflows/assets` demonstrates finding, selecting, laying out, previewing and requesting insertion of an asset. It is one task page in the existing workflow shell. Theme (including Auto), density, reading direction, source disclosure, reset and Progress Report navigation remain shell-owned. Theme changes keep the current workflow instance.

The nine deterministic fixture records contain six existing library symbols and three inline text excerpts. Icon previews show the bundled symbol; document previews show the actual excerpt. There is no remote image, upload, storage, insertion backend or application project. The fixed 750 ms local insertion produces a numbered receipt in this page. No request starts during SSR or construction.

Each card's media uses the shared file-card preview surface: a subtle theme fill,
visible boundary, and centered symbol with stronger foreground contrast. Symbols
and text samples scale from the icon token. Grid provides a taller preview area;
List uses a compact square preview beside the content, with metadata and actions
moving alongside it as space permits. Table presents native columns with a caption
and row/column headers. The decoration adds no focus target or action.

Filters share intrinsic label, control and description rows through CSS subgrid.
Controls on the same row remain centered together, while empty description rows
collapse. Narrow containers stack the fields; medium containers pair Asset type
and View between the full-width search and Clear filters rows; wide containers
show all four controls together. Query thresholds compile from the panel width
and twice the form width defaults, rather than assuming a device or viewport.

`model.ts` owns deterministic data and pure filtering. Shared `TableModel` applies the workflow sort to every view. `template.ts` uses the public `contentCollectionTemplate`, `fileCardTemplate`, `metadataListTemplate` and `emptyStateTemplate` recipes; `styles.ts` composes the public content styles with local layout. `index.ts` owns interactions and a request lane. `service.ts` is a deterministic application-layer fixture using the shared scheduler, not a library feature.

Find assets uses `en-search-input`. Its settled, non-composing `en-change` updates results as the user types; IME composition does not cause application writes or premature query acceptance. The same keyed native list and card/radio nodes serve Grid and List. A fieldset/legend names the native radio group; the asset name labels its radio. Preview is a separate action. Native radio changes update app state directly without a manufactured library event.

Selection is an asset ID, separate from search, type, layout and preview ID. Hiding the selected record with filters retains that ID and names it explicitly. Persistent Show selected finds that record, Clear filters restores all records, and Clear selection removes only selection. These controls remain in the document so their activation does not remove their own focus target. Insert without a selection reports what is needed. While inserting, the button stays focusable and duplicate requests are guarded. Changing or clearing selection does not rewrite the captured request; its receipt names the captured asset.

Preview is a retained, explicitly hidden in-flow aside. Preview activation deliberately focuses its heading after rendering; Close returns to the original visible, usable Preview button or its equivalent in the new view, falling back to the stable Assets heading. Background filtering and successful insertion never move focus. The result count and collection are not live regions; a single persistent status reports explicit action outcomes. Native `[hidden]` is protected by the workflow's owned CSS.

Native radio hydration is explicit: initial `checked` attribute bindings do not replace a pre-hydration live checked value. A single post-render read adopts an existing native selection, preserving its node and focus. Reset and Clear selection explicitly reconcile checked properties. Browser verification must establish this behavior; source inspection alone is not a receipt.

Card radios consume `radioStyles` from `@en-reve/styles/radio.js`, the same native-input paint used by `en-radio`. Their circular focus contour, checked dot, sizing, focus tokens and forced-color states stay shared. The workflow retains its native input, label and fieldset; its generic focus rule excludes these radios. A border radius on browser-painted `appearance: auto` radios is insufficient to guarantee a circular outline.

Reset cancels/invalidate requests, clears filters, selection, preview and receipt, and explicitly reconciles the search editor. Removed workflows dispose both request lane and scheduler. Late completions cannot restore a previous receipt. The injected fixture has success-only delivery; empty-library, failure/retry, persistent storage and real authentication/transport are outside this bounded example.

Manual tasks are in the live disclosure. Automated review should cover SSR/early radio adoption, live filtering and composition, same-node layout changes, hidden selection and recovery, both preview close destinations, captured insertion with later selection, duplicates, reset-before-delivery, narrow RTL and native keyboard use. Real assistive-technology, physical-device and prior-browser-version acceptance remain separate from browser automation.

## Table and ordering

The Sort assets selector changes order in every view. Original order is the default;
Name, Type and Updated offer both directions. Equal values keep their prior catalog order. Table header buttons perform the same
application-owned sort and expose the active direction through `aria-sort` on the
column header. Keyed rows preserve native controls during sorting. Selection is a
stable asset ID across Grid, List, Table, filtering and ordering; preview and pending
insertion remain independent. Switching between Grid and List retains the existing
list nodes; switching to Table creates the appropriate native table structure.

`en-table` owns the scroll surface. Its complete authored `<table>` keeps native
caption, headers and data cells. The workflow composes `tableStyles` in the same
root as its table, included in the initial SSR CSS delivery. Narrow screens scroll
the columns inside the table surface without widening the page. This is a native
table, with normal Tab stops, rather than an arrow-key cell-navigation grid.

## Large catalog and shared table integration

Open **Review a larger collection** and set **Library size** to Large to load 1,000 deterministic local records. This opts into Table and leaves the original nine-record Grid/List workflow as the default. The same original keys exist in both catalogs. Selection is still one asset for insertion; switching to the sample catalog clears only an unavailable generated selection.

The table now consumes `TableModel`, `TableController`, `tableHeader` and `tableRows`. Column definitions keep domain-specific radio labels, descriptions, dates and Preview actions in `table.ts`; the library owns stable sorting, keyed row delivery, native sort naming, range management and public `en-table` scroll geometry. The workflow's host supplies the controller lifecycle and removes both controller registrations on disposal. The model is created without browser access, so initial SSR remains deterministic.

Windowed Table mounts a bounded range, with the shared focused-row retention behavior. Paginated Table, Grid and List expose a complete 20-record page, with persistent selection outside that page. The current page is the scope of browser Find and printing; pagination is an alternative reading mode, not a claim that a browser can search unmounted records. Page changes announce the page number through the existing status and retain focus on the activated paging control. At page boundaries that disabled control is no longer tabbable; its DOM node remains.

**Update selected record** edits only the selected record's description and date. Its key stays fixed, allowing the selected asset, preview and sorted results to reconcile independently. There is no backend mutation. Reset restores the original sample and cancels any pending simulated insertion.

Review the large catalog with keyboard, screen-reader table navigation and a mobile device: select a row, scroll far away, sort/filter it out, update it, and recover it with Show selected. Then switch to Paginated, select on a later page, change pages, and repeat the update/recovery. Confirm selection never changes row height, empty results offer recovery, the table scrolls horizontally inside the page, and inserts still name the captured single asset. Browser automation covers geometry, page semantics and behavior; real screen-reader and physical-device acceptance remains a separate review.

Windowed native radio arrow keys operate only on mounted rows, including retained focused rows. They do not represent continuous navigation through all 1,000 records. The page explicitly explains that boundary and offers Paginated for complete current-page keyboard and screen-reader table traversal. Native Tab continues to visit Preview actions; this workflow is not an ARIA grid. Explicit column widths keep entering records from resizing the table's columns.

Page navigation uses `en-pagination`, with its one-based `page` mapped to the
zero-based `TableModel` page after the single cancelable `en-change` is accepted.
The application preserves the selected asset and announces the resulting page;
the component provides the shared previous, numbered and next controls. Changing
pages is a local fixture action, not a network request.

The no-results content uses `emptyStateTemplate({ kind: 'no-results', ... })` with
an explicit Restore current catalog button. That invokes the same Clear filters
action as the filter bar and preserves the selected asset; the recipe itself owns
no application action, live announcement or selection policy.
