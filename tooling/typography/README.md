# Typography verification

Build the workspace, then run `node tooling/typography/verify.mjs`.
Set `PLAYWRIGHT_BROWSERS_PATH` for a separate browser installation.
The isolated runner uses no documentation stylesheet or server. It compares
native content before and after the public CSS import, verifies semantic heading
levels and complete font roles, then adopts the same rules inside a shadow root.
It also exercises root text resizing, spacing overrides and forced colors.

The WebKit 26.6 engine tested here leaves shadow text at its previous size after
a dynamic root font-size change when the shadow host has a fixed font size.
An ordinary `font-size: 2rem` control reproduces the failure without library
variables. The report retains the failed doubling expectation, actual values and
browser version as `known-platform-limitation`; it does not report that case as
passed. Unexpected failures still exit nonzero. The native comparison continues
to run, so a changed platform result cannot silently mask a library regression.
This probe does not measure browser zoom or operating-system text preferences.
Forced-color rendering assertions run only where `forced-color-adjust` is
supported; the tested WebKit engine lacks it and is recorded as unavailable.

For the production sheet, serve `dist/` and run
`node tooling/typography/verify-production.mjs`.
`EN_REVE_PREVIEW_URL` defaults to `http://127.0.0.1:4196/`.
This checks styles before hydration, all three densities, source highlighting,
narrow layout and the existing dialog typography import. Both runners retain
artifact hashes and results in `results/`. Screenshots are review candidates,
not accepted visual baselines. Manual assistive-technology review remains pending.
