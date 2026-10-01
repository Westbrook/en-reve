# En Reve agent instructions

En Reve is a private, exploratory design system for creativity and collaboration
tools. It uses Lit custom elements, Signals, `en-*` tags, and `@en-reve` packages.
Use the guidance below for the area being changed; read linked contracts as needed.

## Package boundaries

- `packages/tokens`: token data, theme authoring, and compilation utilities.
- `packages/styles`: reusable token-driven CSS and Lit style adapters.
- `packages/primitives`: shared state, templates, and interaction controllers.
- `packages/elements`: custom elements composing those layers.
- `packages/ssr`: server rendering and hydration support.
- `apps/docs`: documentation, specimens, and reference workflows.
- `tooling` and `probes`: generation, validation, and focused integration evidence.
- `showcases`: isolated comparison applications with their own installations;
  see [showcase boundaries](showcases/README.md) before changing their dependencies.

## Implementation contracts

- Keep registration explicit. Class, definition, catalog, and main-barrel imports
  register nothing. Use `define/<name>.js` or explicit registry helpers. Declare
  generated-child dependencies once in the component definition; authored children
  retain separate registration. See [elements](packages/elements/README.md).
- Preserve pure entry points and explicit environment setup. Do not introduce
  implicit DOM-shim installation or browser-global access into pure imports.
- For transactional semantic changes, preserve synchronous cancelable
  `dispatchChange`, reversible staging/rollback, and silent authoritative property
  writes. Follow [primitives](packages/primitives/README.md) for event exceptions;
  do not reintroduce the removed `controlled` or `en-request-change` API.
- `EditingController` owns live native input values. Avoid competing Lit `.value`
  bindings; preserve drafts, composition, selection, focus, and pre-upgrade edits.
  Consult the primitives and [SSR contracts](packages/ssr/README.md) for these changes.
- Keep SSR request data out of mutable module-level Signals and component state
  instance-local. Preserve the matching initial server/client snapshot.
- Customize delivered components through documented CSS Parts and `--en-*`
  properties. Internal classes and shadow ancestry remain implementation details;
  documented native CSS helpers retain their explicit public contracts.
- When changing theme or size behavior, follow [tokens](packages/tokens/README.md)
  and [styles](packages/styles/README.md): full themes reset optional component
  pins, partial overrides preserve unspecified pins, and size inheritance is explicit.

## Authored inputs and generated outputs

- For styles covered by `packages/styles/css-authoring.json`, edit authored
  `packages/styles/src/css/` inputs and regenerate adapters and portable CSS.
  Follow [CSS authoring](tooling/css-authoring/README.md); do not hand-edit
  `packages/styles/src/generated/` or build output.
- Change token sources and generators rather than patching emitted CSS or snapshots.
- For public API changes, update source contracts, definitions, documentation, and
  relevant tests. Use `npm run metadata` and its documented subcommands to regenerate
  manifests, receipts, type snapshots, and the public API graph together as needed.
  See [metadata](tooling/metadata/README.md).
- During freshness validation, follow the prescribed checks against existing
  artifacts before regeneration; regenerating first can conceal stale metadata.

## Setup and validation

- Use npm workspaces. Runtime pins live in `.node-version`, `.nvmrc`,
  `.python-version`, and the root `package.json` engine/package-manager fields.
  See [runtime setup](tooling/test-pipeline/README.md); avoid duplicating versions here.
- `tooling/test-pipeline/with-toolchain.sh <command>` selects the private runtime.
  Root entry points are `npm ci`, `npm run build`, and `npm run dev:docs`.
- Choose validation for the changed behavior using package/component guides and
  [validation guidance](tooling/test-pipeline/README.md). Root gates include `test:tokens`,
  `test:tooling`, `test:api`, `test:theme`, `test:probes`, and `test:release`.
  `test:union` selects the broad correctness graph; `test:plan` and `test:inventory`
  describe coverage without executing assertions.
- Use supported test entry points and a fresh, non-existing `EN_EXECUTION_OUTPUT`
  directory for each outer run. Respect checkout/machine ownership leases and
  coordinate validation across agents; never bypass a lease or kill unrelated servers.
- Prefer reproducible Playwright checks of real browser behavior, using the pinned
  package and matching browser engines. Retain the relevant browser/fixture matrix.
- Report commands, results, and limits accurately. A filtered pass is subset evidence;
  automated accessibility checks do not establish manual assistive-technology coverage.
- Inspect and preserve existing work when editing a shared checkout. Keep unrelated
  changes and historical evidence outside the task's edits.

## Performance and historical evidence

- Keep timed campaigns isolated from builds and correctness browsers. Follow the
  relevant campaign guide for toolchains, engines, profiles, samples, and fresh IDs.
- Preserve frozen sources, vendor snapshots, locks, and historical receipts. Treat
  repacking, baseline promotion, and new acquisitions as explicit scoped work.
- Keep functional qualification, performance measurements, historical observations,
  and manual acceptance distinct. Record provenance and limitations with new results.

## Continuation and review

- For substantive work, use the `progress-report` skill. Follow the local
  `.progress-report/project.json` locator when present; otherwise locate the project's
  established independent report before creating one. Read its handoff checkpoint
  and unresolved feedback before planning continuation.
- Maintain scope, evidence, review checkpoints, and the final handoff in that report.
  Reuse its workspace and browser tab; only the user can mark work reviewed.
- Keep report state outside the product runtime. Preserve the existing
  `?progress-report` Developer UI return-link convention when changing that integration.
  Small follow-ups should not create duplicate reports or expand app integration.
- Use the relevant component README and nearby tests for local contracts. Consult
  [docs verification](apps/docs/tests/README.md) for documentation/workflow changes.
  Keep task status and receipts in the report or relevant plans, and update this file
  when durable project conventions change.
