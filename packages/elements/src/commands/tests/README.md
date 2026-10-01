# Command family browser regressions

Use the built public menu, menu-item, toolbar, command-palette and button definitions. This runner does not build, download dependencies or publish anything.

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright node node_modules/@playwright/test/cli.js test --config packages/elements/src/commands/tests/playwright.config.ts
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright node node_modules/@playwright/test/cli.js test --config packages/elements/src/commands/tests/playwright.mobile.config.ts
```

Desktop: 29 scenarios in installed Chromium/Firefox/WebKit, three isolated workers. Native scoped-registry coverage is capability-gated. Default fixture port 4419; override `EN_COMMANDS_TEST_PORT`, `EN_COMMANDS_TEST_BASE_URL` and `EN_COMMANDS_TEST_OUTPUT_DIR`. Mobile: trusted tap scenario for all eight shared phone/tablet profiles plus Chromium-only real gesture-recognizer scroll/cancel. Default port 4421; override `EN_COMMANDS_MOBILE_PORT`, `EN_COMMANDS_MOBILE_BASE_URL`, `EN_COMMANDS_MOBILE_OUTPUT_DIR`. External URL settings omit server ownership. The server has a bounded fixture/built-module allowlist and does not expose arbitrary repository files.

Tests operate native controls via roles/visible labels and public Parts. They exercise actual Tab/Shift+Tab (WebKit uses the established macOS Alt+Tab traversal preference), native button Enter/Space/click, late ancestor action veto, separate close veto, equal author open writes, literal trigger scoping, disabled discovery, native node identity, toolbar release and author ownership, query editing/cancellation/catalog changes, modal focus and actual coarse geometry. Snapshot/accessibility assertions supplement those actions; an action event is not a simulated application completion.

Synthetic composition events are explicitly only state-transition evidence. Mobile profile names configure a desktop engine; they do not certify the named device, OS release, software keyboard, visualViewport keyboard animation, pinch zoom, VoiceOver/TalkBack or physical input. Chromium CDP touch drives native scrolling and pointercancel; the WebKit equivalent remains manual. Forced-color smoke checks real contour/system adjustment rather than imposing arbitrary contrast ratios on a user-agent system palette. Broader paired-theme state contrast/geometry and actual mobile viewport behavior belong to their dedicated checks.

SSR/no-JS/delayed hydration and complete API/Settings workflows are covered by the separately owned docs integration suite, not by this client fixture. Manual AT and physical-device acceptance remain explicit outstanding evidence. The command-family receipt records the executed scope and explicit skips. Native modal Tab boundaries are tested against observed browser behavior, and Home/End editing is compared with an ordinary native input in the same engine.

## Eager content and lifecycle coverage

`content-rendering.spec.ts` retains regression coverage for eager closed bodies,
synchronous transaction flushes, cancellation/author supersession, native first
focus, query reset, sibling isolation, ordinary/shadow/nested scopes with actual
fallback, null dormancy, and same-origin adoption/reconnect identity. Its native
modal comparison distinguishes retained input/query from browser-owned focus and
selection on reopening. The desktop config runs the existing editing, action and
composition scenarios in each engine. The mobile config retains every shared
phone/tablet profile and its explicit native-swipe coverage limit.

The separately owned SSR matrix covers matching closed/initial-open snapshots,
one hydration owner, staged buffered delivery, pre-upgrade native text, node
identity and early public open intent. These checks do not establish physical IME
or spoken VoiceOver/TalkBack behavior. Timings and retention campaigns remain
separate. Historical construction-candidate receipts keep their original scope.
