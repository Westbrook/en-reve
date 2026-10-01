# Editable slider production verification

Build the workspace and serve the frozen `dist/` directory, then run:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright node tooling/slider/verify-production.mjs
```

`EN_REVE_PREVIEW_URL` defaults to `http://127.0.0.1:4196/`. The served HTML must match the local `dist/index.html`; the receipt records its SHA-256 digest and byte count and fails if that file changes during verification. This runner does not build, start a server or publish anything.

Chromium, Firefox and WebKit verify the production opacity specimen with JavaScript disabled, then pause production scripts and edit the server-rendered native number input. Hydration must retain both native controls, editor focus and the unfinished draft without accepting a numeric value. Enter, invalid input, Escape, canceled proposals, same-value application writes, native blur and keyboard range changes exercise the one accepted value shared by the range and opacity preview.

The runner also checks the specimen's Reset action, selectable CSS-highlighted source, desktop/mobile × LTR/RTL × small/medium/large control containment, and focused light/dark axe results. Reset intentionally remounts the example; this production journey does not substitute for a component fixture testing native form reset. Browser number inputs do not expose text-selection APIs, so this test claims focus and draft preservation rather than selection preservation.

Results and candidate screenshots are written to `tooling/slider/results/`. Screenshots require review and are not accepted visual baselines. This focused evidence does not certify the complete library, retail current-minus-one browser/OS combinations, physical IME behavior, or manual assistive-technology use.
