# TABLE-1/2: records, columns and stable virtual geometry

## API decision

Add an opt-in `en-data-table` facade built on `TableModel`, `TableController` and
the existing native-table templates. Retain `en-table` for complete authored
markup, framework-owned cells, spanning/grouped headers and application layouts.
The new element owns one native table, keyed rows, checkbox selection, sort
controls and optional pagination. It does not introduce an ARIA grid or custom
row/cell elements. A working comparison uses the same records/columns in both
paths, with selection, sorting, custom cells and a paginated reading alternative.

Records and columns are JavaScript properties, with typed Lit cell callbacks;
text values are escaped normally. Keys are stable strings (default `item.id`,
or supplied `getKey`). Modes are paginated (default), all and opt-in windowed.
The facade exposes explicit `scrollToKey`, pin/unpin and measurement invalidation.
Selection and sorting have independent cancelable transactions and authoritative
property writes. No remote service, arbitrary HTML strings, column resizing,
horizontal virtualization or editing-grid keyboard contract is introduced.

## Hardening

- Minify native table fragments in their required context, preserving sibling
  columns, row groups, rows and cells plus Lit expression boundaries. Remove the
  leaf-column preservation workaround after structure tests pass.
- Resolve CSS scroll-padding math with browser layout in the nearest-container
  fallback. Preserve percentages, sticky insets, RTL and target scroll margins.
- Document and demonstrate explicit invalidation for `adoptedStyleSheets` /
  CSSOM changes, which MutationObserver cannot see. Verify stable visible anchors,
  focused DOM, density changes and distant keyed reveal.

## Acceptance

Test pure models, minifier output, built SSR/hydration, facade transactions,
sorting/filtering/replacement, custom cells, mode changes, focused virtual rows,
scroll math, narrow/RTL layouts and theme/geometry changes in three engines.
Publish API/source documentation and focused review cards. Physical-device and
spoken screen-reader testing remain separate; TABLE-3 is not closed by snapshots.

## Delivered for review

The comparison is `/api-examples/data-table?progress-report`; API documentation
includes the full records/columns contract and links to the maintained source.
The facade uses a configurable minimum table width and horizontal scrolling on
narrow screens. Existing composed APIs retain their ownership and behavior.

The shared minifier no longer needs the standalone `col` preservation escape.
The nearest-scroll fallback resolves CSS math against the actual scrollport;
CSSOM mutation is demonstrated with explicit invalidation, retaining the first
visible row relative to sticky content. Automated results and the exact published
build are recorded in the independent Progress Report. TABLE-3 remains open for
real VoiceOver investigation; the paginated reading route remains available.
