# Swatch production integration

Build the workspace, serve `dist/`, then run `node tooling/swatch/verify-production.mjs`.
`EN_REVE_PREVIEW_URL` defaults to `http://127.0.0.1:4196/`.
Set `PLAYWRIGHT_BROWSERS_PATH` for a separate browser installation.

This focused runner blocks the client entry to inspect the rendered swatches,
then releases it and checks that hydration retains the same native copy button.
Chromium, Firefox and WebKit exercise the native clipboard write, specimen Reset,
source disclosure/highlighting, theme changes and narrow-screen containment.
It scans Foundations with axe in light and dark themes. Chromium receives an
explicit clipboard-write permission grant; the other engines use trusted activation.

The separate component suite is `packages/elements/src/swatch/tests/playwright.config.ts`.
It tests cancellation, keyboard use, disabled state, clipboard failure and pending
operations in an isolated fixture. Clipboard mocks are limited to deterministic
failure/concurrency tests and are not evidence of native clipboard support.

Results and candidate screenshots are written to `results/`, with the production
HTML digest in the JSON receipt. Screenshots require review; they are not accepted
VRT baselines. Automated checks do not establish manual screen-reader acceptance,
physical-device behavior or the complete current-minus-one support matrix.
