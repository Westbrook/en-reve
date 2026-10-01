# Large activity and carousel collections

This slice implements ACTIVITY-1 and CAROUSEL-2 from the accepted component
follow-up backlog. It extends the existing components without replacing their
authored/slotted delivery. Activity and carousel implementation can proceed in
parallel; their final integration and publication use one source revision.

## Shared decisions

- Stable unique keys identify data, mounted content and focus. Position is not
  identity. Empty data is distinct from the absence of a data source.
- Renderer callbacks let the application compose content. The library owns
  structural wrappers, navigation and collection geometry; it never clones
  interactive content or fetches arbitrary media.
- Virtualization is optional. Each pattern must provide a nonvirtual reading
  alternative. Keyboard focus retention does not prove that a screen reader's
  independent reading cursor survives virtual updates.
- Consumer writes are authoritative. Cancelable requests must not commit after
  cancellation or supersede a newer application update. Removed focused content
  has a predictable recovery target.
- Reuse the existing vertical VirtualCollection model/controller for activity.
  Keep horizontal carousel geometry explicit instead of changing the established
  table/tree virtualizer to fit a second axis in this slice.

## Activity acceptance

Large grouped histories support explicit older-page requests, cancellation,
failure/retry and buffered arrivals. Appending history or revealing a batch of new
items preserves the visible stable key and its offset where possible. Rendering
is bounded in virtual mode, including retained focused content and its Tab
neighbors. A paginated reading mode mounts every record on the current page.
Date groups remain intelligible when a page or virtual window begins mid-group.
Loading status is concise and separate from inert/decorative placeholders.

This is a list of activity articles with explicit requests, not a new ARIA feed
implementation. The [APG feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/)
requires a distinct focus/reading-cursor loading contract, which remains outside
this slice.

## Carousel acceptance

Keyed data supports bounded slide mounting, large position/thumbnail navigation,
stable current identity on prepend/reorder, explicit reveal, and focus recovery
on removal. Offscreen mounted neighbors are not accidentally exposed as current
slides. Focused content remains mounted across distant navigation until focus
leaves. Native horizontal scrolling, logical direction, resizing and multi-slide
windows stay coherent. A list reading alternative exposes ordinary ordered
content without carousel hiding rules. No slide cloning or infinite media loop
is introduced.

The existing [APG carousel controls](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
remain applicable: manual navigation retains control focus and autoplay stops on
focus entry until explicitly restarted.

## Integrated verification

Maintain focused browser tests for the new data APIs alongside the existing
authored carousel and activity suites. Check Chromium, Firefox and WebKit;
phone-width layout, RTL, reduced motion, scoped themes, stable DOM/focus,
semantic snapshots, source samples and selective registration. Verify public
TypeScript consumption and deterministic bounded server output independently
of browser lifecycle hooks. Preserve the existing virtualizer's model tests.

Publish both live demos, their full source samples, API documentation and separate
review cards. Record exact results and any limitations in the independent Progress
Report. Physical mobile gestures and spoken VoiceOver traversal remain manual
review; automated snapshots do not certify those behaviors.
