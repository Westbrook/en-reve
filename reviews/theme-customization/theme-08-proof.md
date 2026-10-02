# THEME-08 — Three theme proof

Accepted by the user, integrated into main, and published for review. Review: `/theme-proof.html?progress-report`.

One unchanged workspace demonstrates Editorial, Precision, and Studio in both
appearances. Typed definitions live in `apps/docs/src/theme-proof/themes.ts`; they use
public token APIs. A single separate card Part treatment applies semantic elevation.
Existing inspired presets are retained.

## Authoring and transfer

Call `themeOptions(direction, mode, density?)`, resolve it, and emit a full boundary
with `colorScheme:true`. `themeStylesheet()` exports all six baseline variants for
`data-proof-theme` and `data-appearance` attributes. The shared Part treatment uses
`.proof-surface en-card::part(base)`. Application-owned content must consume the
semantic typography/spacing roles; tokens do not automatically style arbitrary HTML.

The demo exports/reopens typed review envelopes against the selected baseline.
Select the same direction, appearance and density before reopening. Review JSON
contains typed values, not the separate CSS Part treatment. The CSS download always
contains the six baselines; custom reopened edits remain in the JSON export.

## Scopes

- System: full workspace replacement, preserving editable content.
- Family: button paint, input paint, or shared control radius on separate siblings.
- Concept: graph-aware radius patch, preserving typography and state paint.
- Region: opposite-appearance full Precision child with reset semantics.
- Instance: square button through documented `control` Part.
- Shadow host: theme CSS installed inside an application-owned shadow root.
- Overlay: nested date dialog and select options inherit the owning region.

## Workaround ledger

| Requirement | Supported route / limitation |
| --- | --- |
| Typography, rhythm, geometry, palette, focus, elevation | Typed semantic tokens; derived sizes retain target floors. |
| Card elevation | Public `base` Part consuming semantic shadow, included in CSS export. |
| Single button geometry | Public `control` Part. |
| Input-only radius | No connected input-radius hook; use shared control radius or instance Part. |
| Custom font loading | Application responsibility; examples use installed fallback stacks. |
| Select popup | Customizable native select surface where supported; otherwise OS/browser popup. Selected value and native color-scheme are verified on both paths; popup paint is platform-owned in the fallback. |
| Application portals | Apply an explicit theme boundary at the portal destination. Native top-layer descendants retain inheritance. |
| Calendar ranges/color wheel | Specialized anatomy retained; not every generic option/radius hook applies. |
| Vertical writing | Not claimed; RTL is exercised. |
| Arbitrary gradients/P3 | Not needed by these baselines; no compiler expansion. |

## Verification

The full workspace builds with THEME-06 composition changes. Seven compiler and
transfer tests cover all 18 direction/appearance/density baselines, exact review
round-trips, and graph-aware radius updates. Browser evidence is retained in this
task's theme-08-evidence folder; the final outcome is recorded in verification.json.

The original 48-case browser matrix passed 46 cases with two documented emulation skips. The follow-up separates reduced motion from forced colors so WebKit runs its independent reduced-motion check. It covers six themes in Chromium, Firefox and WebKit:
rendered body/input/data roles; family/concept/instance scopes; full nested reset;
application-owned shadow hosts; date-dialog and toast inheritance; native-select
fallback; retained edits; keyboard focus; hover/pressed states; selected tree items;
readonly/invalid/loading/empty states; CSS transfer and rejected imports. A size
sweep exercises all 72 direction/appearance/density/size combinations per engine.
Narrow checks use 390px width, RTL and 125% root text enlargement with axe scans.
The September 19 follow-up adds 54 Playwright cases for 200%/400% equivalent reflow
(640px/320px from 1280px) and separately 200% relative-text enlargement. Each covers
LTR/RTL, overflow, control/dialog bounds, computed text scaling, retained edits,
selection, keyboard focus and dialog focus return across themes, appearances and engines.
Desktop screenshots are visually inspected for all three directions.

Two emulation limitations are explicit data in `theme-proof-exceptions.ts`:
Firefox touch and WebKit forced colors. Native platform testing, screen-reader
review and native high contrast remain separate checkpoints in the [native validation record](/reviews/theme-customization/theme-native-validation.md?progress-report). Routine reflow/text enlargement is automated; native browser UI zoom is a targeted diagnostic when warranted by a specific issue. Recorded user acceptance of this proof is preserved.
This does not claim coverage of vertical writing or every component state pair.
Existing focus/motion and component feedback remains open.

## Reproduce and consume

```sh
npm run build
node --test tooling/theme-proof/themes.test.mjs
npx playwright test --config apps/docs/tests/theme-proof.config.ts
# Or rebuild and run the complete focused theme regression set:
npm run test:theme
```

Copy `apps/docs/src/theme-proof/themes.ts` into an application's theme-authoring
code, or download the compiled CSS. The CSS path does not require a runtime compiler:

```html
<link rel="stylesheet" href="/three-theme-proof.css">
<section class="proof-surface" data-proof-theme="editorial" data-appearance="light">
  <en-button>Save project</en-button>
  <aside class="proof-surface" data-proof-theme="precision" data-appearance="dark">
    <en-text-field label="Inspector name"></en-text-field>
  </aside>
</section>
```

Full emitted themes define semantic roles, sized derivatives and optional-hook
resets at each boundary. Avoid inline component pins when a region should replace
them. An explicit application pin on the component itself remains authoritative.

```ts
import { resolveTheme, emitThemeCSS, createThemePatchPlan,
  emitThemePatchCSS, createReviewDraft, reopenReviewDraft } from '@en-reve/tokens';
import { themeOptions } from './themes.js';
const options = themeOptions('editorial', 'light');
const base = resolveTheme(options);
const fullCSS = emitThemeCSS(base, {selector: '.workspace', colorScheme: true});
const patch = createThemePatchPlan(base, {
  changes: {'radius.control': {value: 0, unit: 'px'}},
});
const localCSS = emitThemePatchCSS(patch, base, {selector: '.inspector'});
// Includes dependent small/medium/large radii, not unrelated color/font output.
const draft = createReviewDraft(options);
const json = draft.exportJSON({title: 'Editorial', rationale: 'Application theme'});
const restored = reopenReviewDraft(json, {baseOptions: options});
```

An exact partial (`emitThemeCSS` with `kind:'partial'` and `tokenIds`) only emits
listed values. Use the graph-aware patch for concepts with derived outputs.
The patch base must describe the effective theme; it cannot discover external CSS.
A full nested boundary is appropriate for opposite appearances; partial patches
inherit color-scheme and should not be used as appearance replacements.

The fixtures deliberately retain ordinary application component state during theme
switching. Appearance/density changes reset the draft to the newly selected
baseline. Size and RTL controls preserve the current draft. Export edits before
changing the baseline if they should be retained.
