# Documentation and reference workflow verification

## Copied examples as packed consumers

After a fresh build, run `npm run test:workflows -w @en-reve/docs -- specimen-sources.spec.ts`
with a fresh `EN_EXECUTION_OUTPUT` and the pinned toolchain. This test extracts
the actual displayed gallery source and every complete API example module,
including its registration prelude. API text must equal its generated module.
It strictly compiles the copies against declarations extracted from package
tarballs; resolved workspace declarations fail the check. Third-party dependencies
come from the locked installation. The native fixture uses published export maps,
packed JavaScript and packed portable CSS, without a bundler or the docs runtime.

The [October 2 receipt](verification-generated-examples-20261002.json) records
three passing browser tests, one per pinned engine. Each compiles **59 modules**:
48 gallery samples and 11 complete API sources. Each executes **eight** native
source consumers: navigation, breadcrumbs, typography, card, combobox, command
surfaces, composable chat and tooltip warm-up. Checks cover native links/styles,
form submission, toolbar/menu/palette interaction, editor color draft recovery,
and tooltip focus/Escape, logical placement and contextual grouping. Two eager
scoped color fixtures remain separate authored controls, not copied examples.

This pass fixed duplicate helper/import declarations in the tooltip API copy:
specimen assembly already supplied them, so the page generator now adds only
public registrations. All 66 extended Node/generator checks and the fresh docs
build passed. The receipt distinguishes the earlier failed attempt, the passing
intermediate run and the final tarball-only stylesheet run. Compilation is not
runtime qualification: remaining copied examples still require meaningful
independent behavior coverage. Retail/physical/manual support stays separate.

### Complete API copy journeys

The [complete API consumer receipt](verification-complete-api-consumers-20261002.json)
extends that qualification to all **11 complete API copies**. Two tests per
pinned engine pass: the original eight source consumers and nine additional
journeys from `copied-api-scenarios.ts`. Together they execute **17 actual copied
modules per engine**, including six gallery copies. All 59 modules still compile
against packed declarations; the two scoped-color controls remain separate.

The added journeys exercise calendar selection/FormData and focus recovery,
bounded carousel navigation, chat attachment failure/retry with a newer draft,
multi-step validation/save recovery, presence overflow and activity paging,
rich-editor token insertion/cancellation/submission, actionable toast keyboard
order and focus, distant tree reveal/selection, and virtual-table selection and
removal. They use the copied applications' own handlers. Their owning suites
retain broader SSR, theme, accessibility and API coverage.

The native import map now follows the packed roots' dependency/peer closure
through the locked third-party installation, including ProseMirror. A missing
packed `@en-reve` dependency fails rather than falling back to workspace code.
The receipt retains the first failed run caused by the old fixture's incomplete
import map, the passing intermediate run and the final run. Future complete API
copies must add a journey to satisfy the exact module inventory guard. Strict
core/docs types and all 123 tooling integrity checks pass.

This completes the named complete-API-copy batch, not §7.5a: **42 of 48 gallery
copies still need independent runtime journeys**. Compilation, owning docs tests,
and these bounded journeys must not be presented as all-feature or manual support.

### Gallery form and application journeys

The later [gallery consumer receipt](verification-gallery-consumers-20261002.json)
adds **21 gallery copies**, bringing independent runtime coverage to **27 of 48**.
Five tests per pinned engine now pass: the original consumers, complete API
copies and three gallery groups. Together they execute **38 copied modules per
engine**; all 59 displayed modules compile. The two scoped-color controls remain
separate. Strict core/docs types and all 123 tooling integrity checks also pass.

The gallery consumer supplies explicit public element registrations and invokes
each actual copied export. Its journeys cover button activation/size/link behavior,
mixed toolbars, checkable nested menus, external and slotted labels, text/search,
native dates, number stepping, accepted color previews, dynamically authored
choices and FormData, checkbox/switch/radio transactions, sliders, ratings and
file transfer failure/retry/reset. Calendar, carousel, multi-step, rich text and
virtual collection reuse the API journeys on their separately extracted gallery
copies. They are distinct source-delivery checks, not additional feature matrices.

At that checkpoint, `copied-gallery-scenarios.ts` inventoried **21** remaining gallery
copies. The test checks that covered and pending IDs match the displayed gallery;
an added copy cannot silently become qualified. The first two failed runs remain
in the receipt: hidden-radio click targets and ambiguous rating text were test
mistakes. Corrected tests use visible labels and native keyboard interaction.
External field labels follow the established reference-target evidence boundary:
actual IDL references in every engine, with Chromium native AX names checked
separately. Firefox/WebKit native AX and speech are not inferred from those checks.
Native color acceptance uses the input value/change boundary; OS picker operation
remains manual. Owning matrices and other platform/public-layer obligations remain.

### Standalone presentation and theme copies

The [presentation receipt](verification-gallery-presentation-20261002.json) adds
nine gallery journeys: swatches, spacing/radius, identity, loading, child themes,
local overrides, family geometry, focus recipes and popup motion. The authored
copies now carry their own layout rules. The child-theme generator travels with
the copy and is rendered through an SSR-compatible static CSS template; the live
gallery still passes its current density and respects system/explicit appearance.
The fixture does not import the docs stylesheet, runtime or theme setup.

Seven copied-source tests per engine execute **47 actual modules**, comprising
**36 of 48 gallery copies** and all eleven complete API copies. All 59 displayed
modules compile against packed declarations. The existing four appearance tests
per engine separately protect the live gallery and workflows, including no-JS
paint, focus/draft identity and explicit appearance. The final matrix has 33
passes; three additional density/identity regressions also pass, with strict types, 123 integrity and 66 extended Node checks passing.
A fresh production SSR build is retained with the receipt.

The new journeys check real computed layout and paint, responsive wrapping,
scoped control padding, reduced-motion focus accents, native dialog/Drawer
open/close, draft preservation and focus return. Chromium checks native clipboard
contents and native dialog AX names. Other engines verify the actual permitted
copy outcome and feedback, plus dialog title references; these do not establish
OS clipboard prompts, their native AX names, speech or manual acceptance.
Playwright's dialog name matcher and shadow/light descendant lookup are distinct
from Chromium's native AX result; fields are located through their authored host.

The tested pending inventory now contains **12** gallery copies. Remaining
§7.4 reusable layers, native Firefox assertion comparison, platform/manual and
separate-owner requirements stay open. Earlier failed build/test attempts remain
in the receipt; they are not rewritten as passes.

## Production-page workflows

Build the workspace before the browser run. The browser fixture serves only the
production `dist/` files; it does not use source aliases or a development server.

```sh
npm run build
npm run test:workflows:core -w @en-reve/docs
npm run test:workflows -w @en-reve/docs
```

Use the installed Playwright engines, setting `PLAYWRIGHT_BROWSERS_PATH` when
they are stored outside Playwright's default location. Browser reports and
failure traces go to `node_modules/.cache/en-reve-workflows`; override that with
`EN_WORKFLOW_TEST_OUTPUT_DIR`. The fixture server binds locally on port 4391.
`EN_WORKFLOW_TEST_PORT` changes the port; `EN_WORKFLOW_BASE_URL` uses an existing
server instead. The runner never builds or publishes the site.

The main docs suite uses one Playwright worker to bound concurrent browser work
for production-page journeys, including theme compilation and geometry sweeps.
This resource policy keeps the existing test deadlines, zero retries, and all
three browser engines. The integration gate preserves this lower owning limit;
other theme suites retain their separately declared limits. Record the resolved
worker count when intentionally overriding it through the public test command.

`initial-delivery.spec.ts` blocks external stylesheet requests with JavaScript
disabled. It checks the built card example's authored layout and the Showcase's
optional-region spacing at desktop and phone widths. `content-recipes.spec.ts`
checks supplied card regions, focus and node identity through hydration and
later slot changes. The isolated SSR suite additionally exercises alert icons,
nested components, forwarded slots and changes made before hydration:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright npx playwright test --config packages/ssr/playwright.config.ts optional-slots.spec.ts
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright npx playwright test --config apps/docs/tests/playwright.config.ts initial-delivery.spec.ts content-recipes.spec.ts
```

The focused navigation tests also verify the sticker sheet's authored navigation
and breadcrumb links before JavaScript, their exact node identity through hydration,
native consumer listeners, breadcrumb wrappers, and executable source samples.
The gated focus checks start without a fragment:
pending native initial-fragment navigation can move focus when modules finish
loading, independently of hydration. Direct-fragment navigation and alignment
retain their separate checks.

The eight Node cases verify request ownership, duplicate activation, cancellation,
late non-cooperative completions, held delivery, and reset/disposal cleanup. The
reference-workflow file exercises 22 task scenarios: all scenarios run in Chromium,
Firefox, and WebKit except the narrow viewport scenario, which runs in Chromium.
This produces 64 executions and two intentional profile skips. Each consumer journey
loads its owning production page directly: `/workflows` for Sign-in,
`/workflows/settings`, or `/workflows/chat`. Public URLs are separate from their
`.html` build filenames: hosted navigation must not pay a canonicalization
redirect for every page change. Existing `.html` entry points remain supported.
The navigation case verifies both entry forms and the links in actual SSR DOM.

Measure remote document redirects, response wait and transfer independently of
local rendering and hydration. These pages are rendered at build time; their
remote response does not run application SSR. Record compression/cache response
headers and the authentication/cache conditions of any hosted timing run. A CDN
cache hit alone does not establish low response latency or identify time spent
in the private host's access checks. Keep hosted diagnostics separate from this
local functional suite.

Browser journeys cover sign-in validation and recovery, settings snapshot/conflict
handling, chat draft retention and checked contextual actions, pre-hydration
editing and actual submission, and disposal/reconnection on each isolated page. A navigation journey verifies
server-rendered isolation with scripting disabled, native page links/history,
query-preserved preview context, one source/reset surface, and legacy hash links.
Native Back/Forward may restore a document through BFCache; these tests do not
require browser history to discard drafts. Fresh links and direct loads initialize
fresh local fixtures. They use rendered
controls, native keyboard/pointer actions and public APIs. Automated accessibility
checks run at initial and invalid-form states; selected viewport screenshots
support human review. The focused component/packed-consumer suites and any
build asset-graph inspection have separate evidence boundaries.

The settings recipe validates its first field through the slider's public
`reportValidity()` before aggregating the remaining form. In Firefox 155, direct
native form aggregation alone emitted a focus warning for an invalid exact
slider draft. The tested recipe preserves the draft and accepted FormData, focuses
the actual error editor, and leaves passive `checkValidity()` focus-free. This
does not establish general native form-aggregation parity.

These are deterministic local services, not authentication, delivery, model,
collaboration, or export backends. Browser-engine checks and desktop viewport
changes do not establish physical-device, prior-version, screen-reader, real
IME/dictation, performance-budget, or accepted visual-baseline coverage. Manual
review remains a separate checkpoint.

## Local Theme Review

`theme-review.spec.ts` exercises the production `/theme-review` page through
rendered controls, its native download/file picker, and baseline/candidate frames.
It is included in the existing documentation Playwright configuration. After a
workspace build, run the focused file with:

```sh
npm run test:workflows -w @en-reve/docs -- theme-review.spec.ts
```

The authored cases cover pin/undo/redo/restore/reset, candidate isolation across
the full shipped sheet and three workflow pages, derivation resuming after a pin
is removed, JSON download/reopen, malformed/modified/wrong-build rejection with
draft recovery, and narrow RTL keyboard use. They inspect actual computed styles
and operation results. Their results must be recorded on the tested build; merely
adding the file does not establish a passing checkpoint or refresh earlier runs.

Also verify the loading boundary: the SSR editor and preview region appear before
client work, no full preview pages load before Load previews, and candidate CSS
applies only after each default page hydrates. Preserve invalid editor input until
an explicit recovery action, focus through Apply/history operations, and the
editor's default appearance even when candidate values make a preview difficult
to use. Separate these checks from an automated accessibility scan or pure-model
replay test; each proves a different behavior.

An exported rendered-case receipt is coverage information, not a passed test. The
JSON records interaction, visual-comparison and manual-accessibility review as
`not-run`; it contains no offline application or accepted visual baselines.
Physical devices, current-minus-one engines, manual AT and measured network
performance remain separate evidence. See the [page contract](../src/theme-review/README.md).

Theme Review checkpoint (2026-09-09): all 24 Theme Review cases and 15 selected
navigation/workflow regression cases pass in Chromium, Firefox and WebKit.
The 44-test token suite also passes. This is scoped automated evidence, not
manual screen-reader, physical-device, current-minus-one or VRT acceptance.

## Paired theme reviews

`theme-review-pair.spec.ts` exercises native file reopening, independent appearance
edits, coordinated density/reset/undo, export, forced/system previews, page theme
restoration, DOM identity, mode-specific receipts and malformed-file recovery at
a narrow viewport. The existing single-theme suite remains a compatibility gate.
Run either through this directory's Playwright config, using an existing built
docs server through `EN_WORKFLOW_BASE_URL` when appropriate. Source recipes and
exact-build paired candidate generation live in `tooling/theme-candidates`.

## Installed browser products

This docs configuration now accepts the same optional `EN_BROWSER_PRODUCTS`
manifest as the packed framework suite. The default remains the three pinned
engines. See [product selection and identity](../../../probes/framework-consumption/README.md#opt-in-installed-chromeedge-qualification)
for the explicit installation paths, full distribution identity and temporary
profile contract. No global installation, user profile or browser update occurs.
With an existing qualified production build:

```sh
EN_BROWSER_PRODUCTS=/absolute/products.json \
EN_EXECUTION_OUTPUT=/absolute/new/workflow-product-run \
  tooling/test-pipeline/with-toolchain.sh npm run test:workflows -w @en-reve/docs -- \
  workflows.spec.ts selection.spec.ts --project=product-chrome --project=product-edge
```

The [October2 product receipt](verification-products-20261002.json) records52
passes,26 per installed Chrome154.0.8037.95 and Edge154.0.4258.48 in headless mode
on macOS26.6.1 arm64. Two existing Chromium-only viewport cases remain skipped.
The unchanged journeys cover SSO, settings, chat and project selection: native
FormData and keyboard/pointer interaction, early SSR drafts and control identity,
validation/retry/cancel, repeated actions, incoming state, disposal, accessibility
scans, direct entries and native navigation/history. Their console checks remain
strict. Full product distributions and production source/build inventories stayed
unchanged across the run. This reuses qualified `dist/`; it is not a fresh build.
Actual speech/IME, physical devices, other products/OSes and previous versions
remain separate support conditions.

### Isolated Edge current/preceding workflow qualification

[October2 release-line receipt](verification-edge-lines-20261002.json) records26
passes each on Edge153.0.4234.48 and154.0.4258.53, with one existing Chromium-only
viewport skip per product. It runs the same `workflows.spec.ts` and
`selection.spec.ts` through `EN_BROWSER_PRODUCTS`, using the qualified production
build and fresh Playwright profiles. Full app and input inventories remained
unchanged. Exact official package/hash/signature provenance is linked in the
receipt. No manual/physical acceptance, other OS or complete product matrix is
implied. Existing installed-product receipts remain unchanged.

### Current Chrome stable workflow qualification

[October 2 Chrome receipt](verification-chrome-stable-20261002.json) records 26
passes and one existing Chromium-only viewport skip on isolated retail Chrome
154.0.8037.98. It exercises the same production workflow/selection specs with
the qualified build and fresh profiles. Full app inventories and source/build
inputs stayed unchanged. The linked consumer receipt records official download
and Google code-signature provenance. This adds exact-version evidence without
replacing historical receipts or implying other OS/device/manual acceptance.

### Remaining gallery navigation and content copies

The [navigation/content receipt](verification-gallery-navigation-20261002.json)
closes the pending displayed-copy inventory: **all 48 gallery modules and all
11 complete API modules** now have named native packed-consumer journeys in
Chromium, Firefox and WebKit. Eight source tests per engine execute 59 actual
copies; all 24 browser cases pass. All 59 copies also compile against packed
public declarations. The fresh SSR build, strict core/docs types, 123 integrity
checks and 66 extended Node checks pass.

The final twelve journeys cover authored tree focus/selection and child removal,
accepted/canceled and unknown-total pagination, tabs with retained field state,
multiple accordions, nested and vertical splits, native content loading/recovery,
keyed table sorting, alert dismissal, dialog/drawer drafts and focus recovery,
popover options, and context-provider tooltip handoff. They exercise the copied
application's actual handlers. The tooltip journey is shared with the separately
extracted complete API copy, preserving both registration paths.

Three examples now carry their own action-row layout, and the authored table
carries its hidden sorting-label rule. Native table/content/radio CSS is resolved
from the packed public exports at the copied sample's declared URLs, never
injected into samples that do not request it. The fixture still omits the docs
stylesheet/runtime. Tests check those stylesheet requests, computed layout,
unchanged loading boxes, and keyed native-control identity while sorting.

This completes the **displayed copied-source inventory** in §7.5a, not every
owning behavior matrix or the broader verification plan. The two eager scoped
color controls remain separately authored fixtures. Other public-layer entries,
native Firefox assertion comparison, retail Safari/other platform conditions,
manual AT/IME and separate-owner review remain open. No manual acceptance is
inferred from Playwright results; the historical external authoring rerun remains
retired by the user, never passed.
## Headed product workflow checkpoint

The [October 2 headed Chrome receipt](verification-chrome-headed-20261002.json)
records 26 original workflow/selection cases passing, with one existing
Chromium-project-only layout skip. It uses the same supported product manifest
as the headless acquisition, with `headless: false` and a distinct project name.
Run it through the normal public entry point with a fresh output directory:

```sh
EN_BROWSER_PRODUCTS=/absolute/headed-products.json \
EN_EXECUTION_OUTPUT=/absolute/new-headed-run \
  tooling/test-pipeline/with-toolchain.sh npm run test:workflows -w @en-reve/docs -- \
  workflows.spec.ts selection.spec.ts --project=product-chrome-headed
```

Use an explicitly identified isolated retail app, never a personal profile.
The manifest, exact command, all selected cases, source/runtime identities and
qualified build reuse are recorded in the receipt. This is headed automation
with scripted viewports, not physical touch, native browser zoom, display-scale
transitions, screen-reader output or manual visual acceptance. Safari's native
focus rules are separately documented in its input-boundary investigation.
