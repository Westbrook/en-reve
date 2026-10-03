# Local Theme Review

The `/theme-review` page edits a local theme draft, compares it with the shipped
defaults, and exports a candidate that can reopen in the same documentation
build. The customization review passes 30 Theme Review browser cases across
Chromium, Firefox and WebKit. Earlier navigation/workflow and token evidence
retains its original scope; the [customization review](../../../../plans/customization-review.md)
records the new focused checks and candidate files.

## Edit and recover

Every resolved token has a descriptor-backed editor showing its effective value,
CSS property and value origin. Find a token or use the accent, rhythm, control-size
and corner shortcuts. Appearance and density set the candidate context.

Choose a managed value or compatible token reference, then **Apply pin**. Only a
complete valid edit changes the accepted draft; unapplied input is not exported
as accepted theme state. Choices stay anchored to the original base in the selected
context; compatible aliases follow the current graph, and exact existing values
outside managed choices can be preserved. Selecting another token changes the
input editor.

**Related pins** lists potential consumers of the selected token and their current
values. It distinguishes fixed values and references that no longer follow that
input from references still connected through the active graph. **Inspect** opens
the chosen token using the same editor navigation policy; it does not change the
accepted draft or move keyboard focus away from the activated button. Restore
acts only on that chosen token. Opening the disclosure does not automatically
unpin values, announce the whole dependency list, or create a paired dark theme.
For a single candidate, appearance and density changes retain pins, including light-only colors.

**Restore default rule** removes that token's pin/source override and resumes its
default relationship. Other pins remain independent. Undo, Redo and Reset draft
operate on accepted edits; reset returns to the original base and can itself be
undone. The DOM-free `@en-reve/tokens` review-draft model owns validation, history,
candidate preparation and replay. The page owns the local UI and file interaction.

Color editing uses an sRGB picker and bounded channels, with opacity where allowed.
Duration/easing use numeric controls; dimensions, numbers, fonts, weights and
shadows use typed choices. Compatible aliases are selectable. No unrestricted CSS
input or remote font URL editor is provided.

## Paired candidates

Reopening a paired inspired candidate exposes **Editing appearance** and **Preview
appearance**. Light and Dark retain independent accepted values and histories.
Apply pin and Restore affect the editing appearance; preview choice never edits a
recipe. Apply unfinished input before switching the editing appearance: switching
uses the existing editor navigation policy and clears unapplied controls.

A reopened pair defaults Preview appearance to Auto, following the system preference independently of the explicit Editing appearance. Preview can also follow editing or force Light/Dark.
Auto shows its resolved appearance. Candidate page presentation follows that same
choice. For both single and paired candidates, the baseline uses unchanged library rules at the same preview appearance and
density; iframe elements reset their color-scheme to keep the preference independent
of a forced parent page. Switching appearance updates CSS without remounting demos.

Density changes both branches as one undoable transaction. Reset restores both base
rules and the shared density when the pair was opened. Undo/Redo selects the branch
whose last accepted edit it reverses or reapplies. Pair source identity includes both
branches; coverage records each page and actual Light/Dark appearance separately.

The outer `en-reve/local-theme-review` envelope uses version 2 for pairs, wrapping
the strict core pair envelope and both complete v1 branch envelopes. Existing single
candidate version 1 remains supported. Exact build matching still applies. Generated
paired CSS uses guarded `light-dark()` for compatible color values and ordinary
appearance rules for other differences; imported CSS is never executed.

## Load a comparison

The page starts in the library's system-responsive default appearance. The empty workspace remains a single authored candidate, and single-candidate preview paint stays in that candidate's explicit Light/Dark mode. System presentation does not create another authored branch or copy pins. Choose the full shipped sticker
sheet or one of the three complete deterministic workflow pages, then activate
**Load previews**. Only the selected baseline/candidate pair is mounted; choosing
another page loads that pair. Narrow screens expose Edit/Preview views.

Build-time SSR supplies the default editor and preview region. Full preview
documents load only after the explicit action, keeping them out of the initial
request on constrained connections. This is a loading boundary, not a measured
4G budget. The baseline remains independent of candidate values. Workflow previews
still use deterministic local application fixtures.

## Try the theme on this page

Choose **Candidate** under **Page appearance** to apply the accepted draft to the
whole Theme Review document, including its header, editor, controls and footer.
Reopen a file by picking or dropping it, then edit, Undo or Redo while this view
is active: the page follows those accepted changes. It also follows **Preview
reading direction**. **Default** restores the page appearance without discarding
the draft. Reloading starts with the default page appearance.

The docs-owned `document-theme.ts` controller applies generated root token CSS
and trusted code-owned preset companions after hydration, preserving the current
DOM, input drafts and focus. It owns one stylesheet and restores still-owned
theme-name, direction, appearance and color-scheme changes on reset or disconnect.
API examples keep their existing `html[data-example-density]` token boundary and
own appearance through their controls and paired CSS. Imported CSS is never executed.
The page appearance choice is local; separate iframe documents retain their
independent baseline/candidate themes.
It does not create preview receipts or claim visual acceptance.

## Isolated preview bridge

The review page uses separate same-origin iframe documents for baseline and
candidate previews. Sticker-sheet and workflow bootstraps attach `preview.ts`
after their initial SSR hydration. The bridge also attaches after native
navigation to another embedded documentation page, even if its URL no longer
contains `theme-preview`. It is inactive in top-level and opaque-origin pages.

The child announces `en-theme-preview-listening` with its actual `pageId` and
`actualPath`. Its parent sends:

```ts
{
  type: 'en-theme-preview',
  requestId: 'candidate-17',
  draftJSON: draft.exportJSON({ title: 'Live preview' }),
  direction: 'rtl',
  buildFingerprint: 'sha256:…'
}
```

The child accepts only its own parent window with an exact matching origin. It
fetches `/review-build.json` and compares the requested fingerprint with the
served build identity and the loaded document’s build metadata. Each built HTML
page is bound to the pre-metadata build fingerprint; the manifest records final
asset hashes, including those HTML bytes. An older loaded page cannot silently
adopt a newer manifest after deployment. Development servers may report `development` when the
manifest is unavailable; a production preview requires a valid manifest.

`reopenReviewDraft()` or `reopenThemeReviewPair()` validates and regenerates the
candidate. After the build and draft checks, the bridge lazily loads the document
theme controller to apply generated root token CSS and any matching trusted,
code-owned preset companion. Imported CSS, HTML and message-supplied URLs are
never used. A one-entry cache reuses the validated theme for direction-only updates.
Other live updates may reuse the preceding validated draft through the token
API's exact-prefix optimization; complete candidate and artifact verification
still applies, and the cached draft is replaced only after a successful apply.
An asynchronous generation guard prevents an older request from applying after
a newer one.

The controller updates a final iframe-head theme stylesheet, theme name, direction,
appearance and color scheme; the bridge owns a separate controls-only stylesheet.
It does not render the application or replace specimen/workflow nodes. Local
theme controls and the header's Theme Review link are hidden and inert while a
parent theme is active. Normal documentation links remain native. App update
hooks preserve the applied theme while local workflows continue to operate.

Successful replies contain `type: 'en-theme-preview-ready'`, `requestId`,
`sourceHash`, `buildFingerprint`, `direction`, `pageId`, `actualPath`, and `caseIds`
read from the actual document. Errors retain the last applied preview and return
`en-theme-preview-error` with `requestId`, `message` and actual page identity.
The parent must match these replies to its current frame document and request;
render readiness alone is not evidence of reviewed visual or interaction quality.

Disconnect removes listeners/styles and restores still-owned document and
control state. It never reads or writes the parent document.

## Export and reopen

Add a title and optional reason, then **Export candidate**. The fixed JSON file
contains base options and successful edits; candidate source, compiled CSS, typed
changes and active/potential dependencies; resolved typed values; and exact build
identity, asset hashes and required/rendered review coverage. Later draft changes
require another export. Keep the file to preserve work across page reloads.

**Reopen candidate** validates envelope integrity and the exact build manifest,
replays the recorded edits from their base, and compares the complete regenerated
candidate and artifacts. Imported CSS is never executed. Different builds are
rejected without automatic rebasing. A failed reopen leaves the current draft
intact; Undo after a successful reopen restores the preceding draft. The native file
picker and its adjacent drop zone share one intake path. Each attempt accepts
exactly one file of at most 8,000,000 bytes; file extension/MIME filtering in the
picker is a convenience, while the same JSON, integrity, build, token and artifact
validation remains authoritative. A drop on the zone does not navigate the page.
The zone adds no keyboard stop: the labeled native picker remains the keyboard
and touch route. Dragging between its label, help and input retains the highlight.

A newer attempt, accepted draft edit, metadata edit, unfinished managed-input edit,
Undo/Redo/Reset, or disconnect invalidates a pending read. Both stale success and
stale failure are ignored. Reconnecting cannot revive the old read. An invalid
file leaves metadata, undo history and current draft intact. Reopening records the
same undoable transaction regardless of whether the file was picked or dropped.

The compiler canonicalizes validated recipe results to 12 significant digits;
authored literals and pins remain exact. Strict import checks are unchanged. The
same build's candidates can be authored and reopened across the verified Node,
Chromium, Firefox and WebKit runtimes; old-build files still require their original
build. See the [portability harness](../../../../packages/tokens/test/portability/README.md)
for the exact matrix and numerical limits.

Rendered-case receipts show preview coverage, not passed tests. The export keeps
interaction, visual-comparison and manual-accessibility results `not-run`.
Resolver diagnostics do not certify accessibility or visual acceptance. The exact-build source-impact map now shows potentially affected components and
cases for both appearances. Case buttons open the current candidate in its preview.
The full shipped sheet stays available; conservative selection is not test coverage.

The JSON itself contains no offline copy of the documentation or saved workflow/browser
session. The [offline review packager](../../../../tooling/offline-review/README.md)
can preserve this JSON and its exact original build in a transferable directory,
with an integrity verifier and local-only server. It supports the same editor
and isolated previews without external requests; original token replay remains
authoritative. Export revised candidates outside that immutable package. Export neither submits nor adopts a change, and the page has no automatic
local persistence. Official library changes remain library-owned; consumer teams
review their own customizations.

Application-owned control values, including candidate title, rationale and token
search, use only cancelable `en-change`: cancel synchronously, update the model,
then write the accepted public value. A previously canceled edit cannot alter
export metadata or search results. `en-input` remains an observation of unfinished
native drafts for clearing stale validation and invalidating pending file reads;
it does not adopt those drafts as candidate values.

`app.ts` owns the page, `editor.ts` renders managed controls, `preview.ts` supplies
the bridge, and `bundle.ts` owns the outer build/coverage envelope. `candidate-file-intake.ts` owns only native file intake, drag feedback and asynchronous read lifetime. Component
internals remain private. Offline build/candidate packaging is delivered separately. Candidate-bound
expected/actual/difference evidence and capture-cache provenance use the visual
evidence workflow below; explicit remote adoption integration remains planned. This local editor does not complete
the managed admin. The initial four-audience handbook is delivered separately at
`/guides.html`; it does not change these candidate/adoption boundaries. See the [token plan](../../../../plans/tokens.md)
and [verification guide](../../tests/README.md).


## Candidate-facing source impact

`impact.ts` binds the fetched map bytes to `review-build.json`, then uses the same
browser-safe selector as the maintainer CLI. `impact-view.ts` renders only that
selection and its limitations. Accepted changes update the selected set; paired
candidates include both branches. The UI memoizes against the actual presentation,
workspace and verified map, not merely the edited token or current appearance.

Case actions retain the draft and open the same baseline/candidate preview pair.
Workflow cases include the project-brief workflow. The complete sheet remains
accessible and is never pruned. Missing, corrupt or stale map bytes produce an
unavailable message, with full review still available. Export records the matching
candidate/base-set/graph identities and selection, or an explicit unavailable state.
It does not mark visual checks run or reinterpret reopened evidence as acceptance.

The original source graph conservatively over-selects shared code and token paths.
Unknown dependencies expand rather than narrowing required review. Source impact
is not browser-effective cascade, image comparison or external application coverage.
The visual producer/reader delivery and remaining qualification are tracked in
[the delivery plan](../../../../plans/candidate-visual-evidence-2026-10-03.md).

## Visual evidence reader

The Visual evidence section imports portable bundles from
`tooling/visual-review/package.mjs`. Its shared reader validates the required
case matrix, exact build and candidate/base exports, content-addressed artifacts,
rendering/comparison/review identities and outcome consistency. Token replay stays
in `reopenReviewBundle`; imported CSS and URLs are never executed. The browser
also decodes PNGs before replacement. Missing images remain unavailable; corrupt
or wrong-build imports preserve the current draft and previous evidence.

Rendering-source edits make prior evidence stale while retaining its provenance.
An explicit Open captured candidate action uses normal undoable draft reopening.
Candidate exports contain only an optional evidence reference; image bundles are
exported separately and work with the original offline documentation build. A
reference without the matching images is missing evidence. Metadata changes do
not invalidate pixel evidence but never rewrite the captured original export.

Integrity establishes internally consistent bytes, not producer authenticity or
human acceptance. The UI labels outcomes as reported and preserves executed/reused,
failed, omitted, unsupported and missing distinctions. It never promotes baselines.


### Planned and rendered preview coverage

The preview status reports the number of returned cases against the selected
page’s planned build inventory. A partial or empty response exposes an incomplete
preview and lists the missing IDs. Failed responses retain the planned count and
show the error; they create no rendered receipt. Candidate exports keep the
required and returned inventories distinct. Rendered coverage does not establish
interaction, visual or accessibility acceptance.
