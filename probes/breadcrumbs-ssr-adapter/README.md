# Breadcrumb SSR adapter

This isolated consumer exercises the shared adapter and public `EnBreadcrumbs`
implementation. Its probe-only subclass changes the default label and retains a
fixture handoff for explicit-adapter tests; projection, lifecycle and template
behavior come from the production component. Normal `@en-reve/ssr` consumption
registers `en-breadcrumbs` explicitly and selects its adapter automatically.

## Authoring contract

Author direct native anchors and noninteractive `span` labels. The same template
is used on the server and in the browser. Consumers do not supply a child count,
slot names, or a second array of breadcrumb labels and URLs.

An anchor without `href` retains its native non-link semantics. Authors are
responsible for valid, noninteractive phrasing inside anchors and span labels;
this adapter is neither an HTML content-model validator nor a sanitizer. It does
not inspect or rewrite rich descendants. Server and client checks enforce only
the projection boundary: direct HTML `a`/`span` children, no significant direct
text, reserved slot/plan ownership, and the supported hidden state.

Ordinary `hidden` is mirrored onto the stable private item wrapper; separators
count preceding visible entries. The original node and key remain available for
reveal. `hidden="until-found"` is explicitly unsupported in this prototype, since
hiding an ancestor could prevent native find-in-page behavior. Direct child-list
and direct `slot`/`hidden` attribute changes are observed. Mutating an existing
direct whitespace text node's data into significant text is outside the observed
invalid-input cases; the initial markup and inserted direct text are checked.

The adapter derives private projection metadata from those authored children.
Server-created shadow roots use named slots inside native ordered-list items.
The component hydrates that root in place. Newly created browser instances use
manual assignment and retain the same native light-DOM children.

Original child nodes own their link destinations, rich content, event listeners,
and explicit `aria-current` values. The component owns the landmark, ordered
list, item wrappers, decorative separators, and projection metadata. Root mode
is retained for the lifetime of each instance.

## Server integration boundary

The adapter works with the existing buffered `renderToString` API. It captures
the actual component instance state, waits for the authored children to render,
then adds slot mapping attributes and replaces the buffered shadow placeholder.
Source-location edits preserve the authored subtrees and Lit hydration markers;
the response is not parsed and reserialized wholesale.

The preparation callback receives the initialized component instance, captured
shadow-affecting state, and derived keys/visibility. It must leave the instance
ready for the canonical render; finalization does not rerun `connectedCallback`
or `willUpdate`. The initial client render consumes exactly that server plan
before reconciling later child mutations.

Finalization must complete before the result is sent to a browser. Intermediate
HTML contains unmapped placeholders. This is not a streaming API or a general
adapter for React, Vue, or Svelte hydration.

The staged-delivery browser case splits already finalized buffered output into
response chunks. It verifies progressive parsing without implying that the
adapter can flush a boundary before all of its children have been rendered.

Authored projection attributes conflict with the adapter's ownership and are
diagnosed rather than silently overwritten. Ordinary application CSS can still
style the slotted links. Styling internal rich descendants remains the consumer's
responsibility.

## Focused verification

```sh
npm run test:breadcrumbs-ssr
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright npm run test:breadcrumbs-ssr:browser
```

The Node suite renders real Lit consumers and examines structural output. The
browser suite exercises visible SSR links, delayed hydration, native navigation,
DOM identity and focus, consumer rerenders, manual client creation, and a build
with separately built SSR and client template literals plus final-document
minification using the project's tools. Source and built/minified modes keep
separate result identities.

Installed-browser results do not establish the full current-minus-one support
matrix, physical-device behavior, or manual screen-reader acceptance. Those
remain separate acceptance work.

## Platform references

- [Lit server rendering](https://lit.dev/docs/ssr/server-usage/)
- [Lit client hydration](https://lit.dev/docs/ssr/client-usage/)
- [HTML slot assignment](https://html.spec.whatwg.org/multipage/scripting.html#the-slot-element)
- [Breadcrumb accessibility pattern](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/)

Manual declarative shadow roots do not serialize their assigned-node lists. An
all-manual alternative therefore needs JavaScript assignment before its links
are projected. The user has accepted that alternative if the hybrid encounters
a blocker; the current adapter attempts visible named SSR first.
