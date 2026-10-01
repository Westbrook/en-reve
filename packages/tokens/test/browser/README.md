# Token browser verification

Run against a built, running sticker sheet (default `http://127.0.0.1:4180`):

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright npx playwright test --config packages/tokens/test/browser/playwright.config.mjs
node packages/tokens/test/browser/summarize.mjs
```

`TOKEN_DOCS_URL` selects another local sticker-sheet server. This suite does not start or stop a server. Build the token, style, and element workspaces before running. The browser path above is the verification machine's installed Playwright cache; omit or replace it elsewhere.

Use `TOKEN_TEST_OUTPUT_DIR` for a separate run directory when reviewing a focused change; it keeps the raw report and attachments together without replacing earlier evidence. The legacy `summarize.mjs` command above summarizes only the default evidence directory and its original scope/size fixtures. The [four-theme customization review](../../../../plans/customization-review.md) records the separate paint, geometry and preference tests, their exact reports, and their limits.

When using the Vite development server, the harness filters its `update` and `full-reload` websocket notifications so concurrent workspace edits cannot replace a loaded test page midway through an interaction. Initial assets still load normally, application interactions still run, and other websocket messages, including errors, pass through. These tests do not verify development hot reloading.

The tests operate actual rendered shadow controls through public parts, native comboboxes, and pointer hover/press actions. Playwright edits the native color input; the suite does not automate the operating system color picker. Additional DOM fixtures exercise emitted theme CSS with the registered components. Assertions read computed CSS rather than inspecting stylesheet text. The derived-color case uses the supported reduced-motion preference so smooth scrolling cannot move the pointer target between hover and held press; it retains the actual hover, pressed, and release color assertions.

## Current typography and geometry expectations

On 2026-09-09, all 39 browser checks passed with no skips or retries in Chromium, Firefox, and WebKit. All 32 token Node tests also passed. Current `evidence/playwright.json` and `computed-styles.json` record this scope. The tests retain concrete preset assertions and actual rendered target/text-containment checks:

| Current contract | Expected result at the default 16px root font |
| --- | --- |
| Comparable control typography | UI/input text shares family and unitless `1.5` leading: small/medium `16px`, large `18px`. Strong labels and buttons retain intentional `600` weight; ordinary UI/input text remains `400`. |
| Fine-pointer medium controls | At `.25rem` rhythm, compact/comfortable/spacious minima are `38px`/`40px`/`48px`; at `.5rem` rhythm all three are `50px`. These include text and compound-control geometry rather than only the density baseline. |
| Full child theme | A compact `.5rem` page renders a `50px` control minimum; an independent compact child at `.25rem` renders `38px`. Card padding remains `32px`/`16px`. |
| Default and explicit inherited size | Missing size stays medium. Explicit small inheritance keeps the base `16px` text while component geometry changes; inherited button padding rebases from `5.25px` to `10.5px`, while nested medium padding is `12px`. |
| Extreme code-authored geometry | A `.125` small geometry scale retains `16px` control text and a `36px` shared minimum. Actual targets remain at least `24px` in both axes and text fits inside the padded border box. |

## Brand roles verification on 2026-09-08

The focused `scopes.spec.mjs` run passes all 27 checks (nine cases in Chromium, Firefox, and WebKit), with no skips or retries. All 29 token Node tests pass. That evidence belongs to source commit `e636442bcebd4b8cb06b4b918fad6febdce048b6`; size-system tests were not rerun for the brand addition. The current evidence files have been refreshed by the broader typography run above.

The added coverage verifies a shared accent seed, independent brand/action semantic pins, the preserved `palette.action` override, separate foreground selection, pin restoration, full child rebasing, and partial brand customization. The live wordmark name and tile have the same brand color before and after native seed editing and Reset. Bright brand colors remain exact; using them as text on a neutral surface is a separate contrast-review responsibility.

## Earlier size-system verification

On 2026-09-08, 33 of 33 tests passed, with no skips or retries, across Playwright Chromium 153.0.8010.12, Firefox 155.0, and WebKit 26.6. The eleven cases ran once per engine. Token build and all 22 pure Node tests also passed. That earlier spacious-density and size-system evidence is retained in source commit `d3b22d323558e0c9c0bd0fb525a6bfa1e53696fa`; the table below describes its historical scope. Its former `15px`/`14.0625px` UI text and `32px` compact minimum are superseded by the current expectations above.

| Contract | Rendered evidence |
| --- | --- |
| Page and full child themes | Page action `rgb(36, 87, 214)`; inverse child `rgb(170, 193, 255)`, with independently themed card surfaces. |
| Component customization | Normal button radius `8px`; local override `0px`, preserved across settings changes and reset. |
| Coordinated preview settings | Accent `#a13698` changes the page control while the child retains its accent. Compact control minimum changes `40px → 32px`; UI type remains `15px`. At `.5rem` rhythm, compact page card padding is `32px` and independently rebased child padding is `16px`. |
| Full and partial boundaries | A full child theme resets an inherited red component pin. A nested partial action-color override produces green while retaining the child's text color. A component override within that partial scope produces blue. |
| Primitive alias semantics | A descendant-only rhythm override leaves inherited inline padding at `12px`; adding a full graph boundary recomputes it to `24px`. |
| Granular pin and restore | A `.3rem` spacing pin renders `4.8px` padding while rhythm is `.5rem`; restoring the recipe yields `24px`. A separately pinned hover color remains `rgb(32, 32, 32)`. |
| Standard CSS cascade | An unlayered author color override survives regeneration of the layered child theme. |
| Derived accent output | Default hover `rgb(31, 77, 191)`, pressed `rgb(26, 67, 169)`, subtle `rgb(227, 236, 252)`, and border `rgb(182, 203, 246)` match resolved values. Custom accent derivations also match; real hover/pressed controls consume them. |
| Three densities and sizes | All nine density/size combinations retain target dimensions at least `24px`. Typography at a given size stays unchanged across densities. Action-group gaps are `4px`, `6px`, and `8px`. |
| Default and inherited size | No `size` attribute renders medium (`15px` UI type), including inside a small parent. Explicit `size="inherit"` renders small (`14.0625px`) without compounding through nested hosts. Its card padding rebases from `21px` to `56px` inside a full spacious theme with `.5rem` rhythm. |
| Family and component pins | A large avatar output pin renders `52px`; restoring it rejoins the large scale at `60px`. A separately derived spinner is `30px`. A pinned medium control minimum is `48px`, and a local component override remains `64px`. |
| Target floor independence | A code-authored `.125` visual scale still renders a button with at least `24px` actual width and height. |

The derived-color check exposed and now covers a compiler defect: an active recipe without a CSS expression inherited the source token's alias expression, despite its correctly computed value. The resolver now emits that recipe's resolved CSS value. Recipes with explicit CSS expressions retain them; unmodified aliases retain `var()` references.

The danger button's text and border render `rgb(180, 35, 24)` on the specified white surface in the light theme.

Raw evidence is in [evidence/playwright.json](evidence/playwright.json); extracted measurements are in [evidence/computed-styles.json](evidence/computed-styles.json). Initial scope screenshots are under `evidence/artifacts` for each engine. This is desktop engine verification, not the full current-minus-one browser/OS matrix, AT verification, an accessibility certification, or a performance benchmark.
