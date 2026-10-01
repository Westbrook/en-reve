# Mobile combobox browser regressions

Run after building the public component packages:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright node node_modules/@playwright/test/cli.js test --config packages/elements/src/combobox/tests/playwright.mobile.config.ts
```

The runner reuses the native import-map fixture/server in this directory. It normally starts its own server on port 4407. Set `EN_COMBOBOX_MOBILE_BASE_URL` to use an already-running fixture. `EN_COMBOBOX_MOBILE_PORT` and `EN_COMBOBOX_MOBILE_OUTPUT_DIR` control the local port and evidence directory. No build, download, or deployment occurs inside the runner.

Eight installed Playwright device profiles cover Pixel 7, iPhone 12 Pro, iPad generation 7, and Galaxy Tab S4 in portrait and landscape. They configure viewport, scale, user agent, and touch capabilities of desktop Chromium or WebKit; descriptor names and user-agent OS versions do not certify real devices or operating-system versions. Common scenarios use trusted touch taps without keyboard selection fallbacks, including first-tap arrow activation from an unfocused input, option selection, focused arrows, native FormData, disabled/canceled taps, reset, fieldset disability, and default coarse-pointer target geometry.

The mobile viewport suite models both layout-relative and visual-relative client rectangles consistently for the input, popup and option rows. It checks every presented resize frame for input overlap, viewport panning and restoration, repeated trigger taps while suspended, and page-scroll-then-Backspace editing. Geometry assertions use the saved native rectangle method, independent of the modeled coordinate convention. These cases reproduce faults missed by tests that examined only settled desktop geometry. The reported device was an iPhone 12 Pro on iOS 18.7.7; the installed WebKit runner does not execute that OS release.

Chromium profiles additionally drive touchStart/move/end/cancel through CDP, observing actual native scroll movement and trusted pointercancel with no selection events. This is browser gesture-recognizer coverage. WebKit trusted taps are covered; its swipe/pointercancel behavior remains a physical/manual test because this harness has no equivalent supported swipe driver. There are no artificial DOM pointer events presented as touch scrolling.

Text insertion uses Playwright's keyboard interface and does not open an operating-system keyboard. Mocked visualViewport tests are separate geometry tests; they do not establish iOS keyboard animation, browser toolbar movement, pinch zoom, IME, VoiceOver, TalkBack, physical touch, or current-minus-one OS behavior. Actual iPhone/iPad/Android review remains an explicit checkpoint.
