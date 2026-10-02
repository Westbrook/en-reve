# Application-owned lifecycle and scrolling helpers

The [packed helper fixture](../../../probes/helper-recipes/README.md) uses three
exported primitives without importing owning elements. The SSR marker names in
the first two modules remain internal renderer/controller coordination. Their
wildcard export does not make those attributes an author-facing element API.
Ordinary component consumers continue to author slots and use the SSR package.

## Optional-slot baseline

`recoverOptionalSlotPresence(host, names)` reads the internal versioned server
baseline and returns a frozen, exact boolean map, or `undefined` when no baseline
exists. Malformed JSON, unknown versions, missing/extra names and non-booleans
throw. Recovery does not inspect assigned nodes or mutate the marker.

An advanced Lit integration recovers that baseline before its first client
render, removes the marker only after a successful first update, then reconciles
actual assigned content and listens for slotchange. Keeping the server decision
for the first hydration pass preserves Lit's committed values when assignment
has changed before upgrade. The example owns that lifecycle and its native input;
it supplies no competing live value binding, so pre-hydration edits survive.

## Static style ownership

`new StaticStylesController(host)` cooperates with a renderer that marks its own
leading static-style chunk. The fixture uses actual Lit SSR output and an
application renderer; it never fabricates the hydrated DOM or registers `en-*`
elements. Client hydration support is imported before defining its custom host.

After successful hydration, compatible static CSSResults use Lit's shared
constructable sheets. Native node identity and paint stay intact. A consumer
DOM stylesheet, a style mode attribute, unknown marker or incompatible static
rule retains the server style instead of changing cascade ownership. Existing
consumer adopted sheets remain last in cascade order. Moving the hydrated host
to another document restores its static DOM fallback without replacing content.

The marked protocol is not a general HTML stylesheet deduplicator. Do not mark
arbitrary styles, strip markers before hydration, or call lifecycle callbacks
manually. Actual library SSR and other frameworks keep their own qualification.

## Scrolling without a collection component

`normalizeScrollOptions()` accepts native behavior/block/inline options plus
`container: 'all' | 'nearest'`. Defaults are auto/start/nearest/all; invalid enum
values throw. `beginScrollIntoView(element, normalized, optionalInsets)` starts
scrolling and returns the affected targets, event sources and `stop()` operation.
The app owns keyed lookup, materialization/virtualization, focus policy and any
completion notification; this helper supplies none of those decisions.

The native path is preferred. The nearest-container fallback walks composed
parents, including assigned slots and shadow roots, then resolves margins,
scroll padding and logical alignment against the scrolling box. Vertical and
sideways writing modes map block and inline axes independently of direction;
native scrollTo owns clamping, including negative offsets. This follows the
[CSSOM View scroll-into-view algorithm](https://drafts.csswg.org/cssom-view/#determine-the-scroll-into-view-position).

Optional blockStart/blockEnd insets reserve logical sticky content. The native
path temporarily supplies logical scroll padding and restores the author's value
and priority. The fallback resolves those insets on the corresponding physical
edges. Native and forced-fallback tests compare against actual browser scrolling.

`stop()` captures positions, cancels native smooth motion immediately and returns
a correction function for a possible already-queued compositor frame. The app
owns scheduling that correction and cancels it when new input or a newer request
supersedes the old capture. It must not blindly restore an obsolete position.
The example tests ordinary and negative vertical offsets plus superseding calls.

These are bounded pinned-engine scenarios. Physical gestures, AT speech, retail
products, transformed/zoomed scrollports and all library SSR routes are separate
coverage; passing the helper example does not establish them.
