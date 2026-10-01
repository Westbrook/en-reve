# Documentation and reference workflow verification

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
