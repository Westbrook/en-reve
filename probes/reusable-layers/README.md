# Packed reusable-layer consumers

This is the first bounded qualification of [verification §7.4](../../plans/verification.md#7-developer-and-delivery-integration). It exercises application-owned custom elements built from public primitives, pure Lit templates and style families. It imports no delivered En Rêve element or catalog.

Run from the repository root with the pinned toolchain and a fresh output path:

```sh
EN_EXECUTION_OUTPUT=/absolute/new/run tooling/test-pipeline/with-toolchain.sh npm run test:union -- --pathways=reusable-layers
```

The owner builds required packages, packs `primitives`, `styles` and `tokens` using the shared immutable package setup, extracts them into an isolated consumer, strictly compiles against those declarations, and bundles from that installation. Only third-party dependencies are linked from the locked workspace. Resolution checks reject workspace source and `@en-reve/elements` inputs. The broader semantic-test type gate has its normal element/SSR build prerequisites; those packages are not in these browser bundles. The server uses a reserved loopback port, fresh fixture directory and no existing-server reuse.

## Documented alternate compositions

| Composition | Public entries exercised | Behavior verified |
| --- | --- | --- |
| [Maintained editing/form/focus fixture](../../packages/primitives/tests/browser/fixture.ts) | `state/draft`, `state/value`; `interactions/signal-controller`, `editing-controller`, `form-controller`, `roving-focus`, `events` | Native input and accepted/draft separation; cancellation across shadow boundaries; silent authoritative writes; native selection and node retention; reconnect; synthetic composition guards; actual form submission, validity, reset, disabled fieldsets; disabled-item skipping, RTL focus and untouched native editing arrows. |
| [Review-options recipe](recipes.ts) | `state/disclosure`, `state/selection`; `templates/field`, `description`, `disclosure`; shared SignalController | Caller-owned native labels and descriptions; slotted help changes without replacing editor or selection; keyboard disclosure with retained hidden content/draft; multiple selection/reset without disturbing native draft or sibling instance. |
| Review-options styling | `@en-reve/styles/foundations.js`, `controls.js`, `typography.js` | Public `.en-input`, `.en-button`, heading recipes on app-owned native controls; scoped input-background and heading-font overrides; sibling scope isolation; readable 320px layout with enlarged type and RTL. This does not qualify every export or state in those modules. |

Contracts remain in the [primitives guide](../../packages/primitives/README.md) and [styles guide](../../packages/styles/README.md). Templates do not acquire ownership of application IDs, labels, focus recovery or persistence. The consumer supplies those semantics. Native inputs have an initial `value` attribute, not a competing live `.value` binding. The selection model is explicitly parameterized with the application's key type.

## Inventory and results

[inventory.json](inventory.json) tracks all 45 exposed primitive modules and every explicit style entry, separately for JavaScript and CSS delivery. Its test detects omitted/new exports and undisclosed imports. `qualified-scenarios` means only the scenarios above, not every method or the whole module's support matrix. Pending entries are open qualification work, **not unsupported APIs**. The elements package's policy does not classify these packages.

[verification-20261002.json](verification-20261002.json) records 48 passing browser cases (12 core plus 4 recipes per engine), packed archive identities, resolved declarations, minified bundle identities, source hashes and 17 pathway/inventory controls. The initial strict compile caught an overly narrow inferred selection key in the fixture. The next run caught a WebKit pointer-focus assumption; the keyboard-focused disclosure check now explicitly activates with Enter. Both failed attempts remain retained separately.

No component runtime was changed. Physical IME, native AT speech, retail/physical browser coverage, SSR for these new recipes, portable CSS counterparts, remaining entries, and independently generated example consumers are not inferred from this result. Owning-element and unit suites remain complementary.

The next [native-recipes batch](../native-recipes/README.md) separately qualifies content/navigation and selected portable CSS exports. The inventory links each entry to its own bounded receipt; the first batch above remains unchanged.

The [collection-recipes batch](../collection-recipes/README.md) adds maintained table/list and document-scroll consumers from tarballs. Seven additional entries receive named scenario qualification; portable table CSS and independently generated examples remain open.

The [projection-recipes batch](../projection-recipes/README.md) adds four public
projection entries with36 native browser cases. The maintained inventory now has
34/110 entries qualified for named scenarios;76 remain pending. All59 displayed
copied examples also have their separate consumer receipts in the docs tests.
Neither count substitutes for the remaining platform/manual/owner obligations.
