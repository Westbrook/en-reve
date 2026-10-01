# Sticker-sheet integration review

Build the workspace, serve the documentation, and run `npm run test:sheet`.
`EN_REVE_PREVIEW_URL` selects an already-running preview; the default is
`http://127.0.0.1:4180/`. `PLAYWRIGHT_BROWSERS_PATH` supports a separate engine
installation. The runner uses Chromium, Firefox and WebKit.

The live examples and displayed source both come from `apps/docs/src/examples.ts`.
The documentation build resolves imported symbols separately for each example,
removing unused import bindings from displayed source. CSS uses native stylesheet
links; Lit shadow-root consumers can import the corresponding `.js` style exports.
Preparation writes ordinary JavaScript source-text modules and serves minified CSS
at explicit `/styles/*.css` URLs. Runtime imports use no CSS, raw-text, or virtual
module loader conventions. The compiler remains a build-time dependency.
`npm run test:workflows -w @en-reve/docs -- specimen-sources.spec.ts` opens the
rendered disclosures, checks their highlighting, and compiles every copyable
sample with TypeScript's unused-local and unused-parameter checks enabled.
Use literal tabs for indentation in its TypeScript bodies and Lit templates,
with a two-column tab display. Put the template contents after a newline and its
closing backtick on a separate line. Indent children one level inside their
parent; wrap long attributes and property bindings without changing their values.
The scoped `.editorconfig` records this convention. No display-only formatter
rewrites the authored example bodies. `--en-docs-code-tab-size` customizes displayed tab
stops without changing the literal source a reader selects and copies.

Preserve meaningful inline whitespace and keep empty custom elements empty:
write `></en-text-field>` with no intervening text, even after multiline attributes.
Whitespace-only children still participate in slot assignment and can suppress
fallback labels. Use an explicit `slot="label"` for a multiline label composition,
as the rating specimen does. Browser checks verify its visible legend and
accessible group name after rendering.

Checks use rendered controls and browser values: all three densities, theme changes and reset,
disabled appearance, text editing, slider preview, tabs, accordion, modal
dialog/drawer/popover dismissal, and reset of edited fields, selection, dismissed
messages, and overlay content. They open authored-source disclosures, verify
escaped text and actual CSS Highlight ranges, and retain highlights across open
panels. Five viewport sizes exercise sticky links, direct hash entry, active-anchor
resize, and preservation of later user scrolling, alongside the Developer UI
report return link. Axe scans the default light and dark sheets. JSON evidence
and desktop/mobile images are written into `evidence/`.

Screenshots are review candidates, not automatically accepted baselines.
They do not constitute a screenshot-diff regression pass or manual review.
The broader release evidence/cache utilities live in `../evidence/`.

The optional WebMCP preview tools are exercised through an injected browser API
contract: registration, successful visible state changes, read-back, and invalid
input rejection. Native host WebMCP integration has not been verified. Browsers
without the optional API still support every visible preview control.

These checks do not prove manual screen-reader use, physical IME, device-specific
browser behavior, the complete current-minus-one matrix, translated catalogs,
or arbitrary custom-theme accessibility. The complete library remains in progress.
