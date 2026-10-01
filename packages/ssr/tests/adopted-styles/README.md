# SSR static stylesheet adoption checks

This isolated fixture exercises the real package renderToString and installed Lit hydration path. It adds no app route or public bootstrap API. Server registration is explicit for only the fixture components; browser startup uses the standard hydration support import before Lit component registration.

Known static SSR styles carry data-en-static-styles="v1". The internal component controller may replace only that owned static style after successful hydration with the class CSSResult sheets. It preserves preexisting consumer adopted sheets after static sheets and keeps a DOM fallback when adoption is unavailable, marker ownership is unknown, or another DOM style/stylesheet link would change the cascade. The marker is ownership metadata, not a security boundary or raw-CSS byte fingerprint.

The eleven focused journeys cover:

- No-JavaScript native content and CSS, including segmented child labels.
- Hydration with pre-edited native text, original root/control/focus/selection/FormData and matching computed paint.
- Identical shared sheet objects across repeated hydrated instances, common foundations across component classes, and fresh CSR instances.
- Consumer adopted-sheet order, public Parts, authored native anchors and rich label identity.
- Equal-specificity template styles and stylesheet links preserving the original cascade through fallback.
- Missing or unknown ownership marker fallback.
- Explicitly simulated missing adoptedStyleSheets support with ordinary editable hydration.
- Dynamic properties plus same-document reconnect without duplicate sheets or native-node replacement.
- Cross-document reconnect preserving native identity and computed paint, with fallback when cross-document sheet adoption is rejected.
- Styles inserted during `firstUpdated` preserving their cascade and identity.
- An adoption setter rejection retaining usable native editing and its original CSS.

Run after building the workspace:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright npx playwright test --config packages/ssr/tests/adopted-styles/playwright.config.ts
```

The server uses built package exports and already generated token CSS. It does not invoke a build or reuse the full SSR/minifier test server. EN_ADOPTED_STYLES_OUTPUT_DIR selects a receipt directory.

## Required separate production evidence

This source fixture does not exercise LightningCSS document minification. Also verify the actual built/minified docs: known owned style count falls after hydration; repeated component roots share actual sheet identities; relevant computed geometry/colors remain unchanged; native root/control/value/focus remain intact. A raw equality comparison between SSR CSS and JavaScript CSSResults is not a valid ownership test for those documents. Passing only this fixture is insufficient for the user-facing docs optimization.

Recorded results belong to the exact source/build receipt in `artifacts/adopted-styles/verification.json`. Simulated unsupported APIs and cross-document desktop checks are not an exhaustive old-browser or physical-device matrix.
