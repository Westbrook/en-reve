# API-06 — Canonical customization surfaces

Implementation authorized September 19, 2026. Implementation, integration into main and publication for review are complete. User review remains separate. The accepted prerelease direction supersedes the original audit's compatibility-alias recommendations.

## Contract

Use one canonical name for an equivalent role. Keep separate names when the elements have different ownership, scope or semantics. Removed names have no compatibility aliases in this prerelease.

- `base`: the root layout/landmark surface, not a promise about its HTML tag.
- `content`: generic authored content. Table `body` continues to mean the native `tbody`; overlay `body` retains its scoped panel-body purpose.
- `control`: the primary native interaction or editing surface. A scoped auxiliary surface may use `editor`, `disclosure-control` or `pagination-next`.
- Host Parts and forwarded native Parts remain distinct: `editor-field` is a field host; `editor` is its input. Data-table `surface` is the table host; `table-surface` is the inner bordered box.
- Every existing slot remains supported. Added attributes/properties are fallback content only. Assigned slot content always wins, including an empty assigned element. Property writes do not replace authored nodes. Removing assigned content restores the latest fallback. Native slot assignment decides presence, not trimmed text or truthiness.
- Parts apply only where their owned region exists. A hidden pagination, absent exact editor, metadata-replaced timestamp, or custom authored child does not gain a synthetic styling target.

## Part migration and support matrix

| Component | Previous name | Canonical surface | Applicability / ownership |
| --- | --- | --- | --- |
| Command palette | `base` alias | `surface` | Native modal surface, matching dialog/drawer. |
| Card | `body` | `content` | Wrapper around retained default slot. |
| Pagination | `navigation` | `base` | Native navigation landmark. Existing action Parts remain. |
| Accordion item | `trigger` | `control` | Native disclosure button. Label and heading slots remain. |
| Navigation | `toggle` | `control` | Compact native summary when responsive disclosure is configured. |
| Navigation group | `toggle` | `control` | Native summary. |
| Progress steps | `navigation`, `summary` | `base`, `disclosure-control` | Navigation and compact summary. `summary` slot remains; `control` still identifies step buttons/static read-only step surfaces. |
| Toast region | `region` | `base` | Focusable collection/scroll surface, distinct from its announcement nodes. |
| Token/rich editor | `editor` (and alias `control`) | `control` | Primary editing surface before and after hydration. `editor` slot in chat composer is unrelated and remains. |
| Color wheel | `field`, `input` | `editor-field`, `editor` | Exact-value field host and nested native input. `editor-label` and `error` forward its label and validation. |
| Color picker | merged `error` | `hex-description`, `hex-error` | Separate hex guidance and validation; no ambiguous combined target. `validation-message` remains distinct authored-color/model feedback. |
| Text field | `supporting-text`, `validation-message` aliases | `description`, `error` | Original canonical targets; duplicate forwarding aliases are unnecessary after picker cleanup. |
| Activity item | authored metadata inside `time` | `metadata` wrapper; `time` fallback | Generic context owns its semantics. Native timestamp is fallback only. |

Existing THEME-06 forwarding stays supported: data-table `table-surface` and `pagination-control/previous/page/next`; presence-group `overflow-control`; color-slider `editor-label`/`error`; plane/picker `channel-error`. These identify distinct targets rather than compatibility names for the same role.

```css
/* Card content; existing selectors must move from body to content. */
en-card::part(content) { line-height: 1.6; }

/* Layout and native paint remain independently addressable. */
en-color-wheel::part(editor-field) { margin-inline-start: .5rem; }
en-color-wheel::part(editor) { border-style: dashed; }
en-data-table::part(table-surface) { border-radius: 1rem; }
en-data-table::part(pagination-next) { font-weight: 700; }
```

Internal selectors inspecting a Part token list must use `[part~="token"]`, not exact equality, when multiple distinct roles are possible.

## Slots and fallbacks

Validation summary gains a string `description` attribute/property, defaulting to empty. Its existing slot stays in the render tree and takes precedence. The summary still renders only when it has issues; no automatic focus or live announcement is added. Guidance stays slot-owned; no new layout wrapper is introduced just for API symmetry.

```html
<en-validation-summary description="Correct the highlighted fields.">
  <strong slot="description">Authored guidance wins.</strong>
  <a href="#email">Enter an email address.</a>
</en-validation-summary>
```

Activity `metadata` now projects into a generic span. Without assignment, its fallback is `<time part="time">` using `datetime` and `timeLabel`. An authored `<time slot="metadata">` owns its own `datetime`; it is never nested inside a component-owned time element. Generic metadata should be styled through `metadata`; style authored nodes directly when they need individual presentation.

## Atomic editor tokens

Both editors expose `token`, `token-content`, optional type-specific Part, and `token-interactive` when `TokenOptions.extension` configures an edit button. The button stays present while the extension is unregistered and is disabled until available; disabled/read-only editors also disable it. Other rich tokens retain node-selection behavior.

Absent or throwing renderers fall back to `token.text`, preserving trigger text such as `@Mira`. `token.label` supplies the accessible wrapper name. Renderers return noninteractive DOM content and apply after hydration; SSR emits escaped text fallback and `token-content`. Shared token CSS hooks are documented on both components.

## Padding grammar

Public axis-qualified padding uses `inline-padding` / `block-padding`, matching existing control, input, button and option hooks:

| Previous | Canonical |
| --- | --- |
| `--en-editor-token-padding-inline` | `--en-editor-token-inline-padding` |
| `--en-editor-token-padding-block` | `--en-editor-token-block-padding` |
| `--en-table-cell-padding-inline` | `--en-table-cell-inline-padding` |
| `--en-table-cell-padding-block` | `--en-table-cell-block-padding` |
| `component.editor-token.padding-inline` | `component.editor-token.inline-padding` |
| `component.editor-token.padding-block` | `component.editor-token.block-padding` |

Update authored CSS and managed theme documents. The registry, full/partial reset emission, CSS property registration and administration choices use the new names. There is no old/new precedence rule because obsolete names are removed. Private table sizing variables are internal and unchanged.

## Evidence mapping

CSS-08 / FORMS-05: inherited label/error forwarding retained, wheel validation reach added, merged picker hook removed. CSS-09: host/native support matrix and existing scoped forwarding verified. CSS-10: exact editor and padding grammar normalized. E6: renderer fallback, wrapper availability, token Parts and shared CSS metadata aligned. OVL-10 / N4: canonical root/disclosure names. FORMS-04: retained description slot with fallback. C09: metadata/timestamp ownership. C12: card content name, table semantics retained.

Build, generated metadata, browser composition/interaction tests, server-rendering/hydration checks and token/tooling tests provide verification. Browser tests do not imply new manual assistive-technology or physical-device validation.

## Verification receipt

- Full workspace build passes, including generated API documentation and SSR examples.
- 93 composition/browser cases, 27 SSR/hydration cases and 396 affected documentation integration cases pass across Chromium, Firefox and WebKit. Three WebKit theme cases failed during the concurrent integration run and passed on isolated rerun; no product changes were made for those reruns.
- 126 token tests, 41 tooling/metadata tests and 62 SSR Node tests pass.
- Source-backed metadata and customization freshness checks pass with zero unreviewed findings. All 77 catalog elements retain their previous slots.
- [Machine-readable verification](api-06-verification.json) records commands and limitations.

API-06 was integrated with committed API-05 on main. Uncommitted API-07–10 edits are preserved separately and excluded from this publication. Shared metadata was regenerated from the integrated source.

Integration verification on committed API-05/main: full workspace build, 93 composition/browser cases, 75 API-05 browser cases, 41 tooling tests, 62 SSR Node tests, 5 editor primitive tests, and source/customization freshness all pass.
