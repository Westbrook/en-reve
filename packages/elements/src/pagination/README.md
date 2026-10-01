# Pagination

`en-pagination` changes a one-based page through one cancelable `en-change`.
The application owns records, filtering, fetching, result announcements and error
recovery. The component does not scroll or replace the collection when activated.

```html
<script type="module">
	import '@en-reve/elements/define/pagination.js';
</script>
<en-pagination label="Asset pages" page="1" page-count="12"></en-pagination>
```

The definition entry registers this element only. Class consumers can import
`EnPagination` from `@en-reve/elements/pagination.js` and register it in their
registry. The internal controls are native buttons using the same shared styles,
focus rules, density and target sizing as `en-button`; there are no child element
registration dependencies. Styles use shared constructible sheets after hydration.

## State and events

| Property / attribute | Default | Meaning |
| --- | --- | --- |
| `page` | `1` | One-based current page. |
| `pageCount` / `page-count` | `1` | Known total pages; `0` explicitly means unknown. |
| `hasNext` / `has-next` | `false` | Whether the application knows another page exists when the total is unknown. Ignored for known totals. |
| `disabled` | `false` | Disables every page action, for example during an application-owned request. |
| `size` | `medium` | Inherited library size API; no attribute is needed for medium. |

Page values are finite, safe positive integers; fractional values are floored and
invalid values fall back to one. Known totals clamp the current page. Update `page`
and `pageCount` together before the next render when changing a dataset: final
normalization happens against the completed property batch, so assignment order
does not discard the intended page. Invalid/negative counts fall back to one;
zero remains the explicit unknown-total sentinel. Attributes configure the element;
page property changes are not reflected back into the attribute.

Before dispatch, `page` exposes the proposed value. `event.preventDefault()`
restores the previous value. Detail is `{ previous, proposed, reason }`, with
reason `previous`, `next` or `page`. Programmatic writes are silent. An application
write during dispatch, including a same-value write, is authoritative and must not
be overwritten by an older cancellation. The existing transaction helper also
protects accepted nested changes. Activating the current numbered page is a no-op.

```js
const pagination = document.querySelector('en-pagination');
pagination.addEventListener('en-change', async event => {
	event.preventDefault();
	const nextPage = event.detail.proposed;
	const nextRecords = await loadPage(nextPage);
	showRecords(nextRecords);
	pagination.page = nextPage;
	// Announce the completed results in the application's persistent status.
});
```

This example illustrates cancellation, not request ordering: an application with
concurrent requests should cancel or discard stale responses before committing.

## Navigation and unknown totals

Known totals show Previous, Next and seven equal-width direct-access positions
when there are at least seven pages. At the start/end, five consecutive numbers
and one ellipsis connect to the opposite endpoint. In the middle, the current
page and its neighbours sit between the first/last pages and two ellipses.
Small totals show every page. Digit widths are reserved for the known total, so
changing between single- and double-digit pages does not move Previous or Next.
Status appears below the action row. The current numbered button has `aria-current="page"`.
Buttons retain normal Tab order; pagination is not a roving-tabindex composite.
While a numbered button has focus, its entire numbered window is retained even
when an author changes the current page. This preserves DOM identity and seven
positions without inserting an extra button. The status always reflects the
actual page; if it falls outside the retained window no visible numbered button
is incorrectly marked current. Native Tab leaving that window releases it.
If a boundary update removes/disables the focused action, recovery moves to an
available current-page/action control only while focus has not moved elsewhere.

For an unknown total, use `page-count="0"` and supply `has-next` while another
page is available. Only Previous, current-page text and Next are shown; the
component does not invent a last page or denominator. Removing `has-next`
disables Next without claiming that the current page is the dataset's final total.

```html
<en-pagination page="3" page-count="0" has-next label="Search result pages"></en-pagination>
```

Between container widths of `28em` and `44em`, the server-rendered CSS reduces
the numbered window to first, current and last, with decorative ellipses between
nonadjacent pages. In both wide and intermediate layouts, the right omitted-page ellipsis opens
the page chooser until the final four pages, when the left ellipsis takes over. There is no extra chooser after the last
number in this layout. Five equal cells reserve geometry; duplicate boundary/current
pages are omitted, leaving their reserved cell empty. Totals up to five show all
pages. Below `28em`, the row switches to Previous, current-page status with an
ellipsis action, and Next. The inline ellipsis opens
a native top-layer **Choose a page** popover with a labelled number input and Go
action. The chooser sits within the omitted-page gap in wide and intermediate layouts.
When a wide layout shows every page (seven or fewer), a separate chooser remains available.
Opening it does not move the pagination row or collection. Escape returns focus to
the ellipsis that opened it; clicking outside dismisses it. The active invoker
remains visible when resizing across layouts, until focus leaves it. Position follows viewport resize and
scroll, including visual viewport changes from a mobile keyboard.
The native field accepts only whole numbers from one through the known total;
invalid, empty and out-of-range input does not dispatch a page change. Enter and
Go both use the same cancelable `en-change` transaction as numbered buttons.
An accepted change (including entering the current page) closes the chooser and
returns focus to its ellipsis. Invalid input, canceled changes and transactions
superseded by application writes keep it open. Cancel and Escape dismiss without
changing the page. Ellipses represent omitted pages; the chooser uses direct entry
rather than creating a potentially enormous menu of every omitted page.

The generated chooser is rendered eagerly for known totals. Use matching
server/client values. Navigation names, boundaries, current-page status, authored
Previous/Next slots and the native number input are present in server markup.
The chooser requires JavaScript for positioning and actions; without JavaScript,
an opened native popover remains hidden. Hydration adopts an already-open native
surface without replaying its opening or taking newer focus from another control.

The shared native editing controller owns that draft separately from the accepted
page. Typing does not accept a page or emit `en-input`; Enter and Go retain the
single cancelable `en-change` contract. On first attachment, an existing dirty
native value is adopted as an unaccepted draft; the accepted page remains owned
by the page model. After attachment, explicit page writes reconcile the draft
silently at the completed property-batch render, including a same-page write,
while active composition finishes first. The initial native default is serialized
once; later renders do not write the live value or change its default attribute.
Cancellation preserves the draft even when a listener forces rendering during
the transaction. Unknown totals remove the chooser; a recreated known-total
chooser starts at the accepted page.

Resizing does not hide focused numbered buttons or the focused direct-page popover.
A numbered action that would disappear in the intermediate layout retains the
full window until focus moves to an action in the intermediate window. Focusing
first/current/last in the intermediate layout does not expand it. A retained
numbered row becomes independently scrollable in narrow containers until focus leaves it;
large totals, long translations and extreme theme geometry can also scroll within
that row. Focus clearance is reserved inside the scrollport. No pointer/keyboard
mode detection or hydration-time breakpoint measurement is required.

## Language and customization

All action/status text can be localized through attributes or properties:

- `label`: navigation name, default `Pagination`.
- `previous-label` / `previousLabel`: accessible `Previous page`.
- `next-label` / `nextLabel`: accessible `Next page`.
- `page-label` / `pageLabel`: `Page {page}`.
- `status-label` / `statusLabel`: `Page {page} of {pages}`.
- `unknown-status-label` / `unknownStatusLabel`: `Page {page}`.
- `direct-label` / `directLabel`: `Choose a page`.
- `page-number-label` / `pageNumberLabel`: `Page number`.
- `go-label` / `goLabel`: `Go to page`.
- `cancel-label` / `cancelLabel`: `Cancel`.

`{page}` and `{pages}` are plain text substitutions, not executable templates.
Preserve the visible page number in numbered action names. Previous and Next use
built-in decorative chevron icons by default, mirrored with inherited direction.
Their independent `previous-label` and `next-label` attributes supply localized
accessible names: an icon alone cannot convey a reliable name to assistive technology.

The `previous` and `next` slots replace the button contents with icons, text, or
other **noninteractive** content. The component retains ownership of the native
buttons, accessible names, disabled states and event handling. Do not slot buttons,
links, or other focusable controls. When slotting visible text, include that text
in the corresponding accessible label for speech input. The previous-text and
next-text attributes/properties have been removed; use these slots instead.

```html
<en-pagination page="8" page-count="40">
	<en-icon slot="previous" name="arrow-right" class="backward" aria-hidden="true"></en-icon>
	<en-icon slot="next" name="arrow-right" class="forward" aria-hidden="true"></en-icon>
</en-pagination>
```

Register `en-icon` when using that custom element in slotted content. Authors own
custom icon direction; for example `.backward { rotate:180deg; }`,
`.backward:dir(rtl) { rotate:0deg; }`, and `.forward:dir(rtl) { rotate:180deg; }`.
These styles belong to the consumer and can target the slotted light-DOM icons.
The built-in chevrons require no child-element registration. Text wraps and layout
follows inherited direction; RTL does not reverse what Previous/Next mean.
The current-page text is not a live region. The application announces successful
page/result changes when its own work completes, avoiding competing announcements.

Parts: `base`, `actions`, `control`, `previous`, `next`, `pages`, `page`, `gap`,
`status`, `compact-status`, `expanded-status`, `middle`, `direct`, `direct-summary`, `jump`, `page-input`, `go`, and `cancel`.

Geometry overrides: `--en-pagination-gap` (shared action gap),
`--en-pagination-page-min-inline-size` (shared control size, retaining target
minimums), and `--en-pagination-status-gap` (shared space 1). The width also
reserves the total digit count and shared inline padding. These are themeable
without changing the page/event API.
Shared action spacing, button, typography and focus tokens apply; no hard-coded
page colors or independent control-height scale is introduced. The shadow markup
is private; use parts and tokens rather than selectors into implementation details.

Render the same values on server and client. Native names, boundaries, current
page and status are present in SSR markup before hydration. JavaScript is required
for actions, consistent with the initial library support policy.


## Distribution and alignment

The actions part fills the host. Expanded layouts center an intrinsic-sized group;
compact layouts use equal side tracks with natural-sized Previous/Next buttons at
the logical edges and the status/chooser group in the middle. Numbered cells keep
their reserved widths. Focused retained rows use safe alignment and remain scrollable.

Set `--en-pagination-align` to `start`, `center` (default), or `end` to align the
expanded controls and their status together. Compact edge placement is intentional.

```css
en-pagination.results { --en-pagination-align: start; }
/* Distribute the outer actions without reaching into private markup. */
en-pagination.distributed::part(previous) { margin-inline-end: auto; }
en-pagination.distributed::part(next) { margin-inline-start: auto; }
```

`actions` owns row width, gap, justification and the scrollport; its default display
is flex when expanded and grid when compact. `pages` owns numbered-cell distribution.
`middle` groups compact status and chooser. `previous` and `next` target the outer
buttons; `direct-summary` targets chooser buttons in every layout. `compact-status`
and `expanded-status` target each status presentation; `status` targets both.

CSS Parts let consumers override these defaults, including the action display model.
Changing `justify-content` alone does not distribute compact grid children; use grid
alignment on `previous`, `middle` and `next`, or intentionally replace that model.
Preserve DOM/visual order, target sizes, focus clearance and reachable overflow.
Do not unconditionally reveal hidden page groups or hide the active chooser invoker.
