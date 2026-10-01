# Paired CSS browser verification

From the repository root, build tokens, then run:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright node packages/tokens/test/paired-browser/verify.mjs
```

Use the installed browser cache for your environment. `EN_PAIR_EVIDENCE` changes
output from `node_modules/.cache/en-paired-css`. Optional
`EN_PAIR_CHROMIUM_EXECUTABLE`, `EN_PAIR_FIREFOX_EXECUTABLE`, and
`EN_PAIR_WEBKIT_EXECUTABLE` select explicit browser binaries.

Six cases per installed engine exercise generated CSS in actual documents: Auto
and forced modes, inherited DSD styles and native input state, nested full/partial
boundaries, aliases and pin masks, the unenhanced CSS fallback, and exact paired
JSON reopening. The fixture serves built token modules over ephemeral loopback HTTP.
It does not build, contact Sites, or establish physical-device, assistive-technology,
Lit hydration or current-minus-one browser coverage. The docs browser suite covers
paired editing and hydrated preview integration separately.
