# Tooltip focus priority and tree-view baseline

The user accepted the mixed toolbar, Settings integration and pagination API checkpoint, then approved focus-priority tooltip coordination and the next implementation phase.

## First: grouped tooltip focus priority

Visible focused help reserves its group. Competing hover help waits until focus leaves or the focused help is explicitly dismissed. Keep pointer-only immediate handoff, the single cancelable change event, Escape suppression, preserved focus and accessible descriptions. Already displayed help remains available while its trigger or content is hovered, even if another trigger receives focus; that is an intentional persistence exception to single-visible help. Group removal/rebinding and canceled or superseded transitions must release or retain ownership correctly. No new click-origin input-modality policy is included.

The post-Site99 review refined Escape ownership: cancel the current focus activation until actual blur, while allowing a fresh pointer encounter on that same trigger. Reopened help follows pointer timing, transit and group handoff; retained native focus does not keep it open or grant focus priority. Escape also dismisses any current pointer encounter, which must end before hover can reopen it. Canceled or superseded dismissals retain their prior ownership. A later focus interaction restores ordinary focus behavior. This replaces the earlier policy that blocked same-trigger hover throughout the dismissed focus interval.

## Next: finite hierarchical content

Implement the planned tree-view pattern for project/layer organization: slot-authored hierarchy, expansion separate from single selection, visible-item arrow navigation, Home/End and typeahead, RTL, and recovery after collapsed or removed descendants. Preserve consumer nodes and permit controlled selection/expansion using cancelable `en-change`. Parent `value` and property-only `expanded` are the sole state authority; one immutable `{ value, expanded }` event snapshot covers selection or expansion. A request-local SSR adapter prepares the canonical item template and first hydration baseline. Root and nested items must be direct slot children; structural wrapper/forwarded hierarchy slots are outside this first pass. Deliver truthful initial HTML and hydration behavior, explicit ownership documentation and targeted API controls.

Share the pattern across the sticker sheet, an isolated themed review and a creative-workflow integration. Validate browser semantics, cancellation, dynamic updates, keyboard behavior, touch-sized targets and SSR in Chromium, Firefox and WebKit before private publication.

Multi-selection, lazy loading, drag-and-drop reordering and virtualized trees are follow-up capabilities. They are not implied by this finite first pass. Physical assistive-technology review remains separate from automated accessibility evidence.

The finite slotted baseline has user review approval. The later authorized
[data-backed virtual tree pass](tree-data-virtualization.md) activates virtualization
as an opt-in data mode; it does not imply approval of the new delivery or add
multi-selection, remote lazy loading or reordering.
