# Consumer-owned collection styles

These are bounded template contracts for adopting collection styles in an
application-owned composition. They do not register or instantiate `en-table`,
`en-pagination`, `en-carousel` or their children. The executable packed example is
[collection-style-recipes](../../../probes/collection-style-recipes/README.md).
CSS supplies geometry and state paint, never collection state or ARIA behavior.

## Native table

Import `tableStyles` from `@en-reve/styles/table.js`, or load
`@en-reve/styles/table.css` in the same root as the table. Wrap a real `table` in
`.en-table-native`; the existing `en-table > table` route is unchanged. Use native
caption, thead/tbody/tfoot, th/td and scope relationships. The wrapper owns overflow
and available size. Give a keyboard-scrollable wrapper a name and tabindex.

The wrapper accepts the same `sticky="none|header|footer|both"` paint policy
(default header); ordinary native caption content scrolls. Use
`data-en-sticky-selection` and cell class `.en-table-selection` for a sticky leading
column, following logical direction. `tr[data-selected]` paints selected cells
without changing geometry. Supply real checkboxes, labels and selection state;
this marker alone does not implement a selected-row interaction.

`--en-table-background/color/border-color`, header/footer colors, cell block/inline
padding, row-hover and row-selected hooks remain scoped CSS overrides. The wrapper
alias does not install `TableController`, automatic caption measurements, observer
cleanup, virtualization, focus retention or live announcements. Those capabilities
still require their documented owners. Print removes sticky positioning.

The fixture uses packed `TableModel`, `tableColgroup` and `tableRows` with native
cell renderers, and authors native sortable headings itself: the optional sorting
branch in `tableHeader` renders `en-button`/`en-icon` and therefore has explicit
registration requirements. Do not treat every template branch as element-free.

## Pagination in an application shadow root

Adopt `paginationStyles` from `pagination.js`, or a `pagination.css` link inside a
dedicated application shadow root. The host supplies the `en-pagination` inline
container. `.en-pagination` is a named native nav; `__actions` groups native
previous/next buttons, `__pages` numbers, and `__middle` compact status/chooser.
`__wide-status` and `__compact-status` are alternative visual presentations.
The number buttons own `aria-current="page"` and meaningful accessible names.

The matching layout recipe uses `data-page`, `data-intermediate-column="1…5"`,
`data-intermediate`, `data-omitted`, `__intermediate-gap`, `data-wide-gap` and
`data-gap-action` to reserve endpoints/current/gaps at the intermediate width.
`__gap-trigger` is a real chooser button; `__gap-decoration` is hidden from AT.
A live chooser invoker carries `data-jump-invoker` until dismissal; focus and this
marker prevent responsive CSS from hiding its return target. Previous/next use
`part="previous|next"` as the matching compact alignment marker. These are inputs
to this recipe, not APIs for reaching inside the delivered element.

The native popover uses `__direct` and a `__jump` form. The app supplies coordinates,
`data-positioned`, validation, dismissal and focus return. CSS implements none of
those behaviors. The fixture uses fixed viewport-inset placement, not the owning
element's measured anchor algorithm. Actions consume `--en-pagination-align/gap`,
status gap and page minimum width; the fixture computes its private digit budget.
Widths >=44em, 28–44em and <28em are wide/intermediate/compact respectively.

## Carousel in an application shadow root

Adopt `carouselStyles` and `carouselSlideStyles` from `carousel.js`, or load
`carousel.css` inside a dedicated shadow root. These styles use generic class
bindings (`.base`, `.viewport`, `.controls`, `.slide`), so they are **not a
page-wide reset or arbitrary-document stylesheet**. Encapsulation keeps other
application content independent. No new selectors into `en-carousel` are exposed.

The tested native collection recipe uses `.viewport[data-collection]`, one
`.collection-track` and positioned `.collection-slide` articles containing `.slide`
surfaces. The app supplies track/slide geometry, indices, scroll reconciliation,
resize observation/cleanup and active-item state. The fixture is a finite 12-item
collection, not virtualized large-data evidence. Native group/slide labels and
links belong to the app; no grid/listbox keyboard behavior is implied.

Optional `.controls` buttons use `data-boundaries` and `.position`. Optional
`.picker[data-bounded]` contains native `.picker-button`s, decorative `.thumbnail`s
and `.picker-number`s; `.picker-range` describes the visible thumbnail range.
The app supplies the bounded count, `aria-current`, activation and window changes.
`data-controls-ready` hides the viewport scrollbar only when equivalent native
controls are actually rendered. An uncontrolled viewport retains native scrolling.
Scoped carousel gap/radius/background/border and shared target-floor variables
retain their existing semantics; narrow pickers scroll instead of shrinking targets.

These contracts qualify the named compositions only. They neither turn internal
classes into delivered-component customization APIs nor claim full widget/AT,
physical touch, native drag, SSR or virtualized focus coverage. Use CSS Parts and
public custom properties to customize delivered components.
