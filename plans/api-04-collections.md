# API-04 — Collection identity, content and delivery contracts

Status: integrated into main and published for review; API-04 integration includes the API-03 baseline. User review remains separate.

The same record identity can now be carried between collections without translating
value/key or extraction-callback names. Tree selection remains independent of
expansion, focus, scroll position and structural reordering.

## Canonical API and aliases

| Concept | Canonical | Compatibility |
| --- | --- | --- |
| Tree data and authored child identity | `key` | `value` |
| Tree single selection | `selectedKey`, `selected-key` input attribute | `value` |
| Tree multiple selection | `selectedKeys` | `values` |
| Tree expansion | `expandedKeys` | `expanded` |
| VirtualCollection/TableModel extraction | `getKey(item)` | `key(item)` |
| Table window delivery | `mode = 'virtual'` | `windowed` |
| Feed complete delivery | `mode = 'all'` | `list` |
| Feed page delivery | `mode = 'paginated'` | `paged` |

`key` wins over `value` in a record; invalid canonical keys cannot fall back to
legacy keys. `getKey` wins over `key` in helper options. Authored `key` and parent
`selected-key` attributes take precedence over their legacy attributes regardless
of order, in browser upgrades and buffered SSR. Sequential property writes through
either alias share state and the last write wins. New attributes are inputs;
existing `value` reflection is retained. Use properties to read current state.

```ts
// Before
const items = [{ value: 'folder', label: 'Folder', children: [
  { value: 'report', label: 'Report.pdf' },
]}];
tree.items = items;
tree.value = 'report';
tree.expanded = ['folder'];

// After
tree.items = [{ key: 'folder', label: 'Folder', children: [
  { key: 'report', label: 'Report.pdf' },
]}];
tree.selectedKey = 'report';
tree.expandedKeys = ['folder'];
```

Normalized tree records expose both immutable identity fields. `TreeDataItem`
accepts either input vocabulary; its legacy `value` field can be absent in keyed
input, so callers inspecting input records should use `treeDataKey(item)`.
`NormalizedTreeDataItem` is the getter output type and guarantees both fields.
In multiple mode, `selectedKey` reads the first key and assigning it replaces the
whole selection; `selectedKeys` in single mode retains only the first key.
Empty string clears single selection. Unknown nonblank selections remain retained.
Snapshot event payloads include `selectedKey`, `selectedKeys`, `expandedKeys` plus
legacy `value`, `values` (multiple mode), `expanded`. Shared arrays are frozen.
Cancellation, nested actions and authoritative writes retain API-02 precedence.
Private SSR snapshots keep the legacy wire shape and recover canonical aliases.
Lazy loaders and reorder APIs accept keyed data recursively.

## Authored mode

Hybrid tree/feed/carousel components use `items === undefined` for authored
children and `[]` for an empty data collection. Carousel still accepts `null` as a
setter alias, but now returns `undefined`. Data-table remains data-only; authored
tables use `en-table`. No content ownership model is added to the table facade.

## Key validity and delivery

Component records require unique **nonblank strings**. Whitespace-only keys are
invalid; surrounding whitespace is preserved (`' a '` and `'a'` are distinct).
Tree/table selected and expanded key arrays use the same nonblank rule, with
existing set-like de-duplication. Generic VirtualCollection/TableModel primitives
retain support for every unique string, including empty strings; this deliberate
boundary is documented rather than tightened silently.

Progress arrays and descriptors share identity/status validation. Invalid arrays
show an explicit error with no partial step list, matching descriptor runtime
failure behavior. Descriptors still take precedence, and removing them restores
the array. Hidden nodes, ownership and SSR identity stay intact.

`all` mounts the complete collection, `paginated` mounts the current page, and
`virtual` mounts a scrolling window. Existing mode spellings, reflected values and
defaults remain accepted/preserved. Tree retains its Boolean `virtualize` and does
not acquire pagination. Carousel `readingMode: 'carousel' | 'list'` remains a
separate semantic presentation choice; list presentation remains paginated.

## Release and migration boundary

Aliases are additive. The following must be called out in the next breaking 0.x
release before distribution; this review keeps the repository's current 0.1.0
version and does not publish a package:

- Replace carousel `items === null` checks with `items === undefined` (or `== null`
  while supporting both library generations).
- Replace blank component keys with stable nonblank strings. Generic primitive
  callers may keep their existing unique string keys.
- Correct duplicate/blank progress values and invalid statuses; arrays no longer
  silently discard invalid entries.
- Consumers comparing exact tree record/event object shapes must allow the added
  canonical fields. Input-only TreeDataItem.value is optional; normalized output
  guarantees it. When spreading normalized records, edit `key` to change identity;
  its canonical value takes precedence over a copied legacy `value`. Extractor
  option types now require either getKey or key. Existing legacy property reads
  and bindings remain supported.

Do not remove compatibility aliases or normalize reflected legacy spellings in
this change. Applications can migrate incrementally, with old browser/SSR fixtures
retained as regression coverage.

## Verification

Focused consumer-type, unit, SSR and three-browser tests cover the new vocabulary
and old aliases. Exact results are recorded in artifacts/api-04/verification.json.
Manual screen-reader validation is not inferred from browser DOM assertions.
