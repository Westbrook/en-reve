# Packed native notification consumers

This independent application composes pure toast admission and native controls
with public toast, feedback and standalone loading-activity styles. It packs
primitives/styles/tokens, compiles strictly against their declarations, rejects
workspace-source/owning-element imports, and runs two independent instances.
See the [consumer contract](../../packages/primitives/docs/notification-consumers.md).

```sh
EN_EXECUTION_OUTPUT=/absolute/new-notification-run tooling/test-pipeline/with-toolchain.sh npm run test:union -- --pathways=notification-recipes
```

The supported pathway includes the original `en-swatch` browser suite, pure
admission controls, pipeline/inventory checks, semantic types, metadata and a
fresh production docs build. The union owns its servers and dynamically reserves
the recipe port. Standalone default is 4408 (`EN_NOTIFICATION_RECIPES_PORT`).

Each recipe runs in Chromium, Firefox and WebKit with Lit and portable CSS:
bounded admission, arrival/interrupt order, focused admission, changing caps,
cancelable dismissal, Escape/focus recovery, Tab exclusion, safe announcements
and history, instance isolation, timer minima/content extension/pause/reset,
disconnect cleanup, alignment, local theme pins, logical fixed placement,
reduced motion, native progress/loading semantics, local alert dismissal,
forced-color boundaries and native swatch isolation.

Portable feedback initially included swatch host sizing and could constrain an
unrelated shadow host. `swatchNativeStyles` now scopes that geometry to an explicit
native wrapper; portable output uses it. Existing `swatchStyles` preserves its host
contract. The checked-in receipt retains the original failed run, fixture fixes,
metadata refresh boundary and final evidence. No automatic count implies complete
API coverage, full manual acceptance or completion of the remaining plan.
