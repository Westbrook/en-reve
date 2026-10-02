# Packed native tree consumers

This independent application owns native tree markup, selection/focus, native
form submission, move acceptance and abortable child loading. It imports only
public primitive/style entries from freshly packed packages, not owning elements
or workspace source aliases. Two isolated instances run using Lit styles or
portable CSS. See the [consumer contract](../../packages/primitives/docs/tree-consumers.md).

Run the supported pathway from the repository root with a fresh output directory:

```sh
EN_EXECUTION_OUTPUT=/absolute/new-tree-run tooling/test-pipeline/with-toolchain.sh npm run test:union -- --pathways=tree-recipes
```

The preparation compiles strictly against packed declarations and records bundle
inputs and portable stylesheet hashes. The fixture server owns its loopback port;
the union reserves a dynamic one. Standalone default is 4407, overridable with
`EN_TREE_RECIPES_PORT`. No other server is adopted.

Twenty scenarios run for each of two deliveries in Chromium, Firefox and WebKit:
hierarchical accessibility snapshots, plain/modifier/range selection, independent
keyboard focus, disabled guards, collapse and recovery, RTL, form payload and
instance isolation, atomic input validation, ordered moves, invalid/no-op moves,
application veto, keyboard/native desktop drag moves, loading semantics, retry,
stale async protection, invalid/empty results, local style scope, narrow layout
and forced colors. Existing pure tree tests remain part of the pathway.

These are named-scenario claims for four public entries, not comprehensive proof
of every function input, owning-element virtualization, native AT or physical
device behavior. The checked-in receipt records exact results, earlier failed
attempts and retained evidence. Current initial-pass scope is still open.
