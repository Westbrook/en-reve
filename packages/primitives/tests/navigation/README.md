# Native navigation browser fixture

Build the workspace packages, then run from the repository root:

```sh
npx playwright test --config packages/primitives/tests/navigation/playwright.config.ts
```

Set `EN_NAVIGATION_TEST_OUTPUT_DIR` to keep receipts and traces in a chosen evidence directory. The isolated Vite server uses port 4394 (`EN_NAVIGATION_TEST_PORT` overrides it). It serves server-rendered **public navigation templates** plus the generated `navigation.css` leaf, without the documentation site's CSS. Client JavaScript attaches only the public anchor controller; it does not rerender the server's native links or invent focus behavior.

Seven real interaction scenarios run in Chromium, Firefox and WebKit: no-JavaScript skip/breadcrumb/fragment semantics; native keyboard focus and history; wrapped RTL/enlarged text/focus; manual takeover; new-tab/modified/canceled activation and query navigation; native nested scrolling and scoped cleanup/replacement; full child-theme isolation without resetting measured geometry. WebKit's skip-link traversal uses Alt+Tab, matching the engine's native all-controls keyboard preference. This does not claim that ordinary Tab visits links under every OS preference.

The fixture owns destinations' `tabindex="-1"`; the templates and controller do not. No assertion promises isolated outer scrolling or scripted focus restoration for history navigation. JSON results and failure traces distinguish automated browser evidence from outstanding retail current-minus-one, physical-input and manual assistive-technology review. Focus screenshots are review artifacts, not independent conformance certification.

The initial run exposed native WebKit 26.6 CSSOM behavior: replacing an important custom property with an ordinary declaration left the old value intact. The adapter explicitly clears the prior priority before its temporary write, and the maintained cleanup scenario verifies both the measured replacement and restoration of the original value/priority. This finding is scoped to the tested engine; it does not establish the prior-version matrix.
