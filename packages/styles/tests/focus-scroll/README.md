# Focus scroll clearance browser checks

Run from the repository root after building tokens:

```sh
npm run build --workspace @en-reve/tokens
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright npx playwright test --config packages/styles/tests/focus-scroll/playwright.config.ts
```

The isolated Vite fixture imports actual component classes and current styles source. It exercises Tab, Shift+Tab, editing, and rating arrows in document and nested scroll containers. Geometry checks cover both scroll-margin axes, theme and component overrides, focus contour minimums, application scroll-padding, explicit scrollIntoView, scroll limits, and preventScroll. JSON output and failure traces default to `/private/tmp/en-focus-scroll-tests`; override with `EN_FOCUS_SCROLL_OUTPUT_DIR`. Use `EN_FOCUS_SCROLL_PORT` if the default loopback port is occupied.

Six projects cover Chromium, Firefox, and WebKit at desktop and 390px widths. The rating test uses Option-Tab in macOS WebKit, whose default Tab preference skips native radio controls. These are narrow browser viewports, not physical-device virtual-keyboard or assistive-technology certification.

Scroll margins influence native scrolling; they do not mandate repositioning an already visible control or create scrollable space past an edge. WebKit may reveal a horizontally offscreen input without retaining its full requested inline margin at a narrow viewport. The inline test records the requested and actual clearance as a JSON attachment, verifies keyboard visibility, and separately verifies exact themed alignment for explicit scrollIntoView. The suite deliberately does not add script-driven scrolling to the fixture.
