# Pagination construction candidate

Status: isolated candidate; not promoted. Numeric gates are inherited unchanged
from the frozen `family-designs.json` pagination design. This protocol records
mechanism and consumer selection before candidate builds or measurements.

## Exact consumer policy

The existing `/api-examples/pagination.html?progress-report` contains eight
pagers. Opt in the primary `#api-pagination`, `#api-pagination-intermediate`,
`#api-pagination-mobile`, `.pagination-start`, `.pagination-distributed`, and the
`Text slot example pages` pager. Keep `#api-pagination-slotted` eager: the
conservative 20-node saving is 9.30% of its 215 connected nodes, below 10%.
The unknown-total pager already omits the chooser and remains eager.
Do not remove whitespace or inflate datasets to clear these gates.

Census02 measured every known chooser wrapper at 22 nodes (five elements,
eight text nodes, nine comments), with two outer whitespace nodes retained.
A conditional Lit part needs markers, so the pre-build conservative net saving
is 20 nodes per opted-in pager: 10.05% of primary 199 nodes, 10.53% of each 190-node
intermediate/mobile/alignment pager, and 10.15% of the 197-node text-slot pager.
The six-instance route opportunity is 120 nodes (approximately 5.71% of the
actual route), not a claim that all seven known-total instances qualify.
Authoritative candidate DOM measurements must confirm exact net counts.

## Native opening and ownership

`contentRendering` / `content-rendering` is `eager` by default and accepts the
opt-in `on-demand` value. Keep the native popover shell, target IDs, invokers,
page/status controls and authored slot content. Gate only the generated jump
body. The first native `beforetoggle` opening attempt latches construction and flushes
Lit synchronously; native `showPopover` / popovertarget remains the opening
owner. No canceled/replayed gesture, promise, timer, separate renderer, import,
registration, preparation cache or new public opening API is introduced.

During a Lit update, defer the body flush only until the current superclass
`performUpdate` returns. The outer wrapper may perform at most one extra body
render. It cannot enter a general update loop, swallow errors or recursively
enter Lit internals. Detect a first-hydration native opening whose beforetoggle
occurred before the handler attached. A native call reentered from rendering
can return before its input exists; construction finishes synchronously when
the encompassing update returns, before the first visible presentation. No
stronger immediate-input guarantee is claimed. A later beforetoggle listener
can cancel opening after construction was requested; the body stays retained. `observeJump` must ensure the complete
body before positioning, revealing or focusing the field. After first hydration,
a connected native surface that is still open and unpositioned is initialized
through that same observer; its native opening is not replayed. If focus has
moved to another control before hydration, reveal and positioning do not move
focus back. Removed or natively closed surfaces receive no recovery focus.

The missed-toggle recovery also repairs the eager pre-hydration edge case:
previously a native opening whose toggle finished before listener attachment
could remain hidden after hydration. Explicit eager and on-demand tests cover
this deliberate compatibility repair. It is not a lazy construction saving. If
the construction candidate fails its gates, review this repair separately before
including or excluding it from accepted commits.

Existing CSS hides an open native chooser until JS positions it with
`data-positioned`. Preserve that exact no-JS behavior, rather than claim that
current no-JS tests establish a usable chooser. Verify in all three engines
that empty content is neither visibly nor accessibly presented. The initial
server/client omitted branch must agree. Eager server inputs and drafts retain
identity when the client policy changes; a late eager policy constructs once,
and subsequent on-demand writes never remove a constructed body. Existing
known-to-unknown removal and recovery remain unchanged.

## Gates and qualification

- At least 10% fewer recursively connected nodes on each adopted known-total
  pager; no optional module saving.
- Whole actual route at least 5% and 32 nodes saved; startup median/p75 no more
  than eager multiplied by 1.05.
- First chooser action-to-ready p75 no more than 50 ms and eager p75 plus 8 ms.
  The field is complete and focused by first visible presentation.
- Repeat p75 no more than eager p75 plus 4 ms; retain input identity/draft.
- Cycle 10 to 100: zero additional chooser elements/listeners; median post-GC
  heap growth no more than 32 KiB per arm.

At least 30 successful timing samples per promoted configuration; retain every
failure/abort. Report no p95 without 100 samples. Retention uses five fresh
contexts per arm and 100 cycles separately from timing. Compare eager and
construction-only behavior; cold/prepared code are not applicable to this
no-code-split feature. Follow the shared exact-lock/runtime/browser/source
freeze and uncertainty protocol, with actual registry modes recorded.

Required correctness includes native click, Enter, Space and direct
showPopover; render/updated reentry; same native shell/input and first visible
focus; draft/validity/Enter/Go/cancel/authoritative transaction; disabled and
unknown totals; resize/RTL/scroll; remove/reconnect/adopt; matched SSR/no-JS,
first hydration open, and eager SSR input preservation. Changed interaction
requires a ready manual review fixture; browser focus is not speech evidence.
