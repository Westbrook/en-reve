# Connected DOM review: accounting and investigation guidance

This independent read-only review covers the physical-tree census in `experiments/dom-census.mjs`, the lifecycle driver in `experiments/run-dom-review.mjs`, frozen production sources, and the current source equivalents. The corrected `dom-review-v4` cohort completed on 2026-09-20 at 21:23:11 UTC with 83 successful snapshots and no failures. Every implementation's desktop initial and post-journey node-type counts reproduced exactly across three repetitions; narrow initial counts match desktop. Spectrum's two date-owned sibling elements are included in its date subtotal. The earlier v2 run was stopped after its positional Spectrum boundary failed; v3 is superseded because its visible-field boundary omitted a sibling hidden native date input. Neither qualification cohort is pooled into this comparison.

The verified v4 collector SHA-256 is `c88a1b0700adf35bf1164e3860524bdb60d0f02ae16afd0ad38463b92bc7616d`; the runner is `7123a625d0d33f954c057d88dc7a7fded9f2e0133c6ada24b229f70299aaea5f`. Source hashes match the completed manifest. In addition to the accounting control, the physical walker now rejects any native `input[type=date]` outside the date boundaries, including controls inside open shadow roots.

## What the counts mean

The collector visits each physical node once, including light children and accessible open shadow roots. Slotted children remain counted at their physical position and are not traversed again through `assignedNodes`. A shadow root is counted as a node; the document and doctype contribute two `other` nodes. Closed and user-agent shadow trees, disconnected `template.content`, and adopted stylesheet objects are excluded. Counts include connected hidden content, not only visible or accessible content.

The type, date, card, and owner partition checks are sound. The known-tree control checks 20 total nodes, three date-field nodes, one open shadow root and one base element, while excluding a disconnected template child. Because `nodes`, `elements`, `text`, `comments`, and `shadowRoots` are different views of the same tree, they must not be added together as independent costs. `whitespaceText` is a subset of text; slots, SVG elements, custom elements, and base parts are subsets of elements. `maxDepth` includes shadow-root steps and is measured from the document, including for individual buckets; it is not a bucket-relative depth.

The date exclusion removes the whole field: label/host, visible input/segments, trigger, connected custom popup, and date-owned sibling support nodes. Spectrum React's `div[data-testid="hidden-dateinput-container"]` and its native date input are a separate sibling of the visible field and must be included explicitly, alongside popup-only body additions. Frozen `react-aria-components/dist/private/HiddenDateInput.mjs` identifies this sibling as a state-synchronized part of the date control. Thus the comparison is “whole page with versus without its author-defined date field,” not “one library calendar versus another library native input internals.” Native controls still have browser implementation costs, but those internal trees are outside this author-DOM census. Date labels/field shells differ between libraries, so their entire field boundaries are intentionally retained in the date subtotal. Shared global infrastructure remains in the remainder.

`byCard` means physical ancestry. Some libraries attach equivalent dialogs/overlays to the document body, while En Reve retains them within their initiating card. En Reve's Actions or Asset card cannot be ranked directly against a library's corresponding card without also attributing that library's body portals. Whole-page totals avoid that omission. `outside-cards` must remain visible in all summed card reports.

`byOwner` means the nearest custom-element ancestor, exclusively. It is not implementation ownership or inclusive subtree cost. For example, the En Reve card bucket includes showcase-authored paragraphs, artwork and layout elements until another custom element is reached. Its 1,090 non-date nodes do not mean the card component generated 1,090 nodes. Direct shadow-tree ownership and authored light DOM should be reported separately for engineering attribution. React components do not create custom-element boundaries, so this partition is useful within the Web Component fixtures but is not a like-for-like cross-framework component ranking.

## The outlier depends on which metric is compared

| Implementation | All nodes | Elements | Date nodes | Date elements | Nodes without date | Elements without date | Whitespace-only text nodes, all | Comment nodes, all |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Radix React | 651 | 454 | 5 | 4 | 646 | 450 | 3 | 0 |
| Fluent React | 742 | 542 | 5 | 4 | 737 | 538 | 3 | 0 |
| Spectrum React | 878 | 653 | 29 | 23 | 849 | 630 | 11 | 0 |
| Astryx React | 1486 | 1158 | 193 | 141 | 1293 | 1017 | 8 | 0 |
| shadcn React | 673 | 477 | 4 | 3 | 669 | 474 | 3 | 0 |
| Fluent Web Components | 2887 | 1284 | 28 | 12 | 2859 | 1272 | 1198 | 0 |
| Spectrum Web Components | 4472 | 1206 | 3 | 2 | 4469 | 1204 | 1834 | 977 |
| En Reve | 4642 | 1578 | 623 | 181 | 4019 | 1397 | 1506 | 1052 |

The whole date field is 623/4,642 = 13.4% of En Reve's connected nodes and 181/1,578 = 11.5% of its elements. Removing date fields reverses the all-node ranking against Spectrum Web Components: En Reve has 450 fewer nodes, while retaining 193 more elements. Against Fluent Web Components, En Reve has 1,160 more non-date nodes but 125 more non-date elements (9.8%). Its excess is 756 comments + 290 text nodes − 11 shadow roots + 125 elements. Of that text excess, 244 nodes contain only whitespace; comments plus whitespace explain 1,000 of the 1,160-node gap (86.2%). This is an accounting explanation, not a performance attribution.

The much smaller React trees remain meaningful reference points: En Reve's 1,397 non-date elements are about 3.1 times Radix's 450. However, the fixture integrations also differ in their eager optional content, custom versus native controls, label/description structures, and visual/interaction details. Do not conclude that the framework alone causes that ratio or require a semantically cheaper replacement to hit another fixture's exact count.

The supplemental direct-shadow attribution sharpens the whitespace finding: En Reve's 1,506 whitespace-only text nodes split into 412 in light DOM and 1,094 inside shadow roots. Fluent WC has 25 and 1,173 respectively. The full-page whitespace excess of 308 is therefore 387 additional light-DOM nodes offset by 79 fewer shadow-tree nodes. The consuming showcase template is a major target here; En Reve's package shadow templates are not the larger whitespace tree relative to Fluent WC. En Reve also has fewer shadow-tree comments than Spectrum WC (829 versus 977), with 223 additional light-DOM comments bringing its total to 1,052. A node-type gap must be attributed before deciding whether the library package or consuming app should change.

## Investigations in priority order

| Investigation | Concrete source/evidence | Question to answer | Acceptance and useful measurements |
| --- | --- | --- | --- |
| Separate eager optional UI from permanently needed UI | Hidden calendar, menus, dialogs, popovers, and inactive tab content are connected in En Reve's showcase; body-attached overlays in other libraries must be attributed too | How much of the initial connected tree belongs to controls the journey has not opened? Which content can be deferred without changing the public lifecycle contract? | Report initial/open/closed/reopen deltas by overlay and owner; preserve first-use latency, retained values, focus return, slot identity, SSR/hydration and keyboard behavior |
| Template whitespace in both package and consuming app | En Reve has 1,506 whitespace-only text nodes, including 1,429 outside date; production sourcemaps retain multiline tagged-template whitespace | Which whitespace is structural indentation and which is meaningful inline spacing or projection content? Can a deliberate production transform or edited template reduce the first category? | Use isolated package-only and showcase-only variants; preserve inline text, accessible names, preformatted content, slot presence detection, hydration markers and content identity; compare node delta, bytes, construction, startup and interactions |
| Repeated button slot/label structure | 45 non-date buttons contribute 180 slots under the nearest-owner partition; frozen button template contains prefix, named-label, default-label fallback and suffix slots | Can the label wrapper be combined with a slot surface, or can a simpler explicitly chosen API omit unused adornment support without changing existing defaults? | Retain the native button; preserve named/default-label precedence, icon-only/loading names, form/focus behavior, caller-owned nodes, nested slot forwarding and CSS-part contract; measure actual mounted deltas rather than assuming four slots are removable |
| Description and field scaffolds | `descriptionTemplate` retains a stable same-shadow description target, a description slot, and a fallback span even when empty | Is a simpler stable scaffold possible, or is an explicit compact field mode justified after accounting for late-arriving slots and SSR? | Preserve `aria-describedby`, empty assigned-slot precedence, later text updates, custom descriptions, validation errors, SSR/hydration and no-observer default; test timing and mutation costs of any presence detection |
| High-frequency base surfaces | 16 cards and five badges are frequent relatively simple surfaces; the base catalog covers semantics and APIs | Can paint/layout move to host or an existing inner element while deliberately migrating the `::part(base)` contract? | Compare one family at a time, with author customizations, slot geometry, focus, forced colors, narrow layouts and SSR; one removed wrapper saves one element, not an entire shadow tree |
| Lit template shape and marker density | 1,052 comments overall; 756 without date. Frozen calendar includes repeated conditional child expressions and per-day text bindings | Can a semantically equivalent template shape use fewer dynamic child boundaries, particularly in repeated calendar rows, without additional replacement churn? | Preserve Lit's supported part bookkeeping and hydration; measure markers, element identity, state updates and first-use performance. Never delete live comment markers after rendering |
| Showcase composition and content parity | En Reve renders through `src/template.ts`; React uses the shared JSX showcase and native adapters; WC fixtures use shared string-template composition | Which extra nodes are application markup, hidden examples, or intentional richer controls rather than library primitives? | Keep package-only and consuming-app recommendations separate; preserve the native-reference fixtures and document any parity normalization as an additional comparison variant |

No recommended whitespace experiment is permission to delete every whitespace-only node at runtime. Some whitespace controls inline spacing; empty/whitespace assigned content can affect slot fallback or presence logic; hydration depends on the template's expected shape. A compile-time or source-template experiment must establish semantic equivalence first. Likewise, Lit comments are structural markers used by its renderer, not abandoned DOM to clean up.

The source explicitly explains why descriptions retain scaffolding: they provide a stable same-shadow target and initial SSR structure without presence observers. Reducing a few elements by adding observers, extra update passes, inconsistent first-render ARIA, or hydration repairs can be a regression. That tradeoff needs measurement.

## Base-part upper bounds

The initial En Reve snapshot contains 55 `base` parts: 19 are SVG viewports in `en-icon`, and 36 are non-SVG elements. Without the date field there are 50: 15 SVGs and 35 non-SVGs. Even an impossible blanket removal of every non-date non-SVG base could save at most 35 elements, 2.5% of En Reve's 1,397 non-date elements. Several own landmarks, image semantics, or other contracts and are not simple wrappers. The 16 card and five badge bases account for 21 candidate instances, not 21 approved removals.

This scope is useful and addressable but cannot by itself explain or eliminate the 947-element non-date difference from Radix. The larger investigation should include repeated slot/description structure, optional mounted UI, and app-template contributions. SVG `base` elements are the actual graphics viewport and must not be counted as redundant HTML wrappers.

## Lifecycle interpretation

The driver compares a settled initial page with the existing two-repeat native journey, and opens/closes each custom calendar in separate fresh sessions. The calendar sessions are the right place to measure mounting and cleanup; opening the first calendar after the broader journey would conflate unrelated overlay state with date cost. The date-open snapshot must also confirm that the popup portal was attributed, and the close checkpoint must wait through exit animation.

The completed v4 date counts below include Spectrum's two sibling nodes. All three states reproduced across three independent sessions. These are whole date fields, not calendar-only content.

| Implementation | Initial date nodes | Open date nodes | Closed date nodes | Initial date elements | Open date elements | Closed date elements |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Spectrum React | 29 | 330 | 29 | 23 | 280 | 23 |
| Astryx React | 193 | 193 | 193 | 141 | 141 | 141 |
| En Reve | 623 | 623 | 623 | 181 | 181 | 181 |

Spectrum's four attributed body roots are the two focus-scope sentinels, underlay, and dialog portal. With its sibling native input included, its non-date count remains 849 through initial/open/closed. The attribution prevents date-owned additions from being reported as general app growth. En Reve and Astryx retain their date tree from initial rendering through closing; unchanged counts do not demonstrate unmounting or cleanup. While the calendars are open, En Reve's date field contains fewer elements than Spectrum's (181 versus 280), despite more nodes overall. Its 296 date comments comprise 47.5% of its 623 date nodes. Initial delivery cost and open-state complexity therefore need separate interpretation.

The broader journey increases En Reve by one text node with no element growth; most references increase by two text nodes, and Fluent React adds one element plus two text nodes. The frozen feedback implementation replaces its status string rather than appending review records. These deterministic short-journey changes should not be conflated with the prior 50-cycle heap/CDP counter increases, which measure a different scope and remain unattributed.

The 700 ms post-action delay plus two animation frames is a practical settled checkpoint, not proof that every component has reached every possible idle state. The generic `updateComplete` scan visits light DOM only; nested shadow components are not explicitly awaited. Repeated identical snapshots support stability under this protocol. A count difference after interaction is neither automatically a leak nor proof of an optimization opportunity; state text, mounted-once content and retained controls need separate attribution. These snapshots do not measure retained detached nodes, heap size, rendering cost, or eventual GC.

Desktop repeats are reproducibility checks for a largely deterministic structure, not a sampling population for small confidence intervals. The narrow viewport is a separate initial-state check with a desktop browser/UA and mouse semantics; it is not physical mobile-device coverage. CPU and network throttling are intentionally absent for this structural review. Performance effects must be tested later with the already established paired startup and interaction suites.

## Frozen-source provenance for the recommendations

These source strings were inspected in `showcases/performance/.cache/snapshots/en-reve/assets/index-CSoEuTYL.js.map`, whose full artifact hash is captured in the census manifests. The table hashes the exact `sourcesContent` strings. Current repository equivalents were reviewed separately; the recommendations do not claim the frozen package and current root are identical.

| Frozen source suffix | SHA-256 of source string | Current source counterpart |
| --- | --- | --- |
| `elements/dist/button/template.js` | `35e7277528e714021c0cefbd6a4a4a3ee14d312d6ea5fdfd619541b852767adc` | `packages/elements/src/button/template.ts` |
| `elements/dist/card/template.js` | `42ef7a16d0d65dba720713ae511fb3463f210fb56104dc36fc0dfac997761c79` | `packages/elements/src/card/template.ts` |
| `elements/dist/checkbox/template.js` | `7c81b3665278d60fc57286e08a7a32d2b8b80b172ebfbba35bb93d199c25492b` | `packages/elements/src/checkbox/template.ts` |
| `primitives/dist/templates/description.js` | `1993f5e7f48af05d4000d1285572afcc1e6ca28a11cd05fec5ca90be0347c1c6` | `packages/primitives/src/templates/description.ts` |
| `elements/dist/forms-private/form-field.js` | `104b18d57ce3793a09ca763160a7699ce4d6a2d05c9498b61db8f3d2776e2f13` | `packages/elements/src/forms-private/form-field.ts` |
| `src/template.ts` | `d05fc1be918eab7d7fe750e002e6b746d4c21753276c6cfb14200d3567c27b61` | `showcases/en-reve/src/template.ts` |

No component, frozen fixture or measurement driver was changed for this review. The outcome is an investigation backlog and tighter interpretation of the census, not an optimization patch.
