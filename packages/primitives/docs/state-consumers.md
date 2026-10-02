# Application-owned state and explicit registration

The [packed state consumer](../../../probes/state-recipes/recipes.ts) composes
five public helpers into native filters, a score interval, overflow actions and
an on-demand panel. It imports no delivered element. The application's query
evaluation, rendering, transactions, measurements and focus policy stay visible.

## Query serialization and keyed records

```ts
import { copyQuery, validateQuery, queryOperators }
  from '@en-reve/primitives/state/query.js';
import { collectionGetKey, isCollectionKey }
  from '@en-reve/primitives/state/collection.js';
```

A `Query` holds `match: 'all' | 'any'` and clauses with `id`, `field`, `operator`
and string `value`. `copyQuery` copies the outer record, clause array and each
clause, normalizing match to `any` or `all`. It does not freeze the result.
`validateQuery(query, fields)` checks unique clause IDs, supported fields/operators,
nonempty values, numeric values and numeric-only comparisons. It returns a
message or an empty string. This is validation of the typed serialization
contract, not a schema decoder for arbitrary untrusted JSON or an evaluator.

The recipe owns actual all/any filtering over application records. Native fields
retain an editable draft; Apply validates that draft and proposes a copied query
through `dispatchChange`. Cancellation keeps the previous accepted query and its
results, while an authoritative write supersedes the proposal. Invalid drafts
stay editable. Changing accepted query state does not implicitly reset those
native draft fields. Applications needing a reset must define it explicitly.

`collectionGetKey({getKey, key})` chooses canonical `getKey` when supplied; `key`
is the compatibility fallback. `isCollectionKey` recognizes nonblank strings and
never trims them. The application checks uniqueness and validity at its component
boundary and keys rendered rows by the unchanged opaque values. These helpers do
not own record storage, deduplication, sorting, filtering or pagination.

## A constrained native interval

```ts
import { intervalLimits, normalizeInterval, moveInterval }
  from '@en-reve/primitives/state/interval.js';
const limits = intervalLimits({min: 0, max: 100, step: 5, minGap: 10});
const initial = normalizeInterval([20, 60], limits);
const next = moveInterval(initial, 0, 35, limits);
```

Limits are normalized to a finite ordered range. The maximum snaps down to the
step grid, and minimum gap rounds up to that grid within the total span.
`normalizeInterval` orders/snaps a proposed pair and enforces the gap.
`moveInterval` changes one endpoint against the other endpoint and the gap.
Always provide a previously normalized pair and normalized limits.

The application composes two labeled native ranges with separate draft models
and `EditingController`s; it supplies no competing live `.value` bindings.
`dispatchChange` stages both models and native values together. During a listener,
FormData therefore reflects the tentative pair; veto restores both. Authoritative
writes normalize silently. Native keyboard behavior, names, form ownership and
reset policy belong to the consuming control. This is not a supplied multi-thumb
ARIA slider or proof of physical touch/assistive-technology acceptance.

## Measured action overflow

`visibleActionCount(widths, available, disclosure, gap)` from
`@en-reve/primitives/state/overflow.js` returns the largest prefix that fits. It
reserves disclosure width only when all actions cannot fit. Feed it actual finite
measurements in the same units; it neither measures DOM nor installs observers.

The recipe measures unconstrained hidden probes, observes its available width,
and renders native buttons plus a native details disclosure. Hidden probes are
outside the accessibility tree and sequential focus. They must not inherit a
zero-width container's `max-inline-size:100%`; that would measure the cap instead
of the action. The actual summary, including its marker, supplies disclosure width.

Only one visible control per action exists. When resizing moves the focused
action, the application opens its disclosure and focuses the corresponding
control; expansion recovers focus to the inline action. This focus policy and the
connect/disconnect observer lifecycle are application behavior, not implicit
capabilities of the pure prefix helper. The narrow RTL/enlarged case is retained.

## Explicit on-demand definitions

```ts
import { createDefinitionPreparation, createDefinitionLoader }
  from '@en-reve/primitives/interactions/registration.js';
const manifest = {
  'consumer-lazy-panel': () => import('./lazy-panel.js').then(m => m.definition),
};
const prepare = createDefinitionPreparation(manifest);
const loader = createDefinitionLoader(customElements, manifest);
await prepare.load(['consumer-lazy-panel']); // no registration
await loader.ensure(['consumer-lazy-panel']); // dependency-first registration
```

Descriptors and the manifest are application-owned. Importing the side-effect-free
lazy module does not register either its parent or dependency. Reuse the same
manifest object to share import results between preparation and registry-targeted
loaders. Duplicate/concurrent requests share work. An unknown tag rejects the
whole request at lookup before any loader runs. A load failure stays cached until
an explicit `{retry:true}`; this cannot force a browser to refetch a cached module.

Registration preflights conflicting constructors before defining dependencies.
Such failures remain permanent for that registry request. `DefinitionLoadError`
distinguishes `lookup`, `load` and `registration`. `collectDefinitions` supplies a
deduplicated dependency order; repeated identical `registerDefinition` is harmless.
Native validation errors and constructor side effects are not rollbackable.

`ensure` is registration readiness, not paint, hydration or interaction readiness.
The recipe separately observes the application panel's ready state and preserves
an already edited native input during upgrade. This receipt uses the native global
registry; it does not establish every framework/scoped-registry/SSR combination.
