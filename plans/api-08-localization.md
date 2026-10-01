# API-08 — Localization, descriptions and content ownership

Status: implemented and verified for publication. User review remains separate.

The date picker's Clear action, editor internals and color feedback can now be translated through public APIs. Rich-editor suggestions associate secondary descriptions with their options. Existing English defaults and authored slots remain supported.

## Contract

Keep `*Label` properties paired with `*-label` attributes. The component's own name remains `label`. Descriptions, instructions and errors retain their own semantic names.

| Finding | Implementation |
| --- | --- |
| FORMS-04 | Validation summary adds `description` property/attribute fallback. Assigned description slot content wins; no extra wrapper changes layout. |
| FORMS-12 | Range date picker adds `clearLabel` / `clear-label`, defaulting to “Clear range”. Apply, Cancel and other date-picker labels restore their constructor defaults on attribute removal. |
| E7 | Rich suggestion options associate their optional description by ID and `aria-describedby`, matching token-editor semantics. Provider schemas and accessible names are unchanged. |
| E8 | Token editor, rich editor and editor toolbar accept a property-only, shared `EditorMessages` type. Partial groups cover suggestion status/instructions, rich/picker instructions, commands and link UI. |
| FORMS-08 | Color picker/plane forward `validationText` plus optional per-channel messages to their sliders. Wheel exposes `validationText` for exact hue constraints. All three accept a distinct invalid-color message. Picker adds HEX/approximation/gamut/conversion messages. |
| OVL-09 | Retain API-02's navigation/toolbar/pagination and overlay close/back/search default-reset fixes; extend the same policy to the defaulted labels touched here. |
| C10 | Clarify that badge prefix content is author-owned and exposed. Authors hide decorative content explicitly. Alert/activity/presence decorative regions remain component-hidden; chat may retain labeled avatars. |

## Simple label and description examples

```html
<en-date-picker selection="range"
  apply-label="Aplicar"
  cancel-label="Cancelar"
  clear-label="Borrar selección">
</en-date-picker>

<en-validation-summary description="Corrige los errores siguientes.">
  <a href="#name">Introduce un nombre.</a>
</en-validation-summary>
```

A named `description` slot overrides the summary's plain text fallback. Removing its assigned content reveals the current fallback. Heading behavior is unchanged.

## Editor messages

```ts
import type {EditorMessages} from '@en-reve/elements/editor-extensions.js';

const spanish = {
  suggestions: {
    loading: 'Cargando…',
    unavailable: 'Sugerencias no disponibles.',
    empty: 'Sin coincidencias.',
    keyboardHint: 'Flechas para elegir, Intro para insertar y Escape para cerrar.',
  },
  instructions: {
    picker: 'Intro o flecha abajo para entrar al selector. Escape para cancelar.',
    richText: 'Intro inicia un párrafo. Alt+F10 abre los controles de formato.',
  },
  commands: {bold: 'Negrita', italic: 'Cursiva', link: 'Enlace'},
  link: {
    label: 'Dirección del enlace',
    applyLabel: 'Aplicar enlace',
    cancelLabel: 'Cancelar',
    invalid: 'Usa un enlace https, http, mailto o relativo.',
  },
} satisfies EditorMessages;

tokenEditor.messages = spanish;
richEditor.messages = spanish;
toolbar.messages = spanish;
```

The same object may be shared, including a frozen object. Replace the object to change language; nested mutation alone does not request a render. Without a message context provider, missing/nullish entries use English defaults, and explicit empty strings are preserved. Assigning `undefined` clears local overrides. The concurrent API-09 context integration can supply inherited defaults beneath local overrides; clearing a local override then reveals the inherited value. `lang` does not automatically translate strings. Toolbar messages are assigned independently; editor association does not copy them.

`label` still names the editor/toolbar. An extension's required `label` owns its popup name and takes precedence over the `suggestions.label` fallback. Choice labels/descriptions, custom option contents, custom toolbar slots and custom picker UI remain application-owned. Messages are rendered as text, never interpreted as HTML. Replacing messages keeps the document, selection and active provider session intact. Already-visible link validation uses the latest translation.

## Color feedback

```ts
import type {ColorPickerMessages} from '@en-reve/elements/color-picker.js';

picker.validationText = 'Introduce un valor permitido.';
picker.messages = {
  invalidColor: 'Color no admitido. El color aceptado no cambia.',
  hexGuidance: 'Usa 3 o 6 dígitos hexadecimales; 4 u 8 con alfa.',
  exactValueLabel: 'Valor exacto',
  channels: {red: 'Rojo entre 0 y 255.', hue: 'Matiz entre 0 y 360.'},
  convertLabel: 'Convertir a una aproximación sRGB',
} satisfies ColorPickerMessages;
```

`ColorMessages` exposes `invalidColor`, `exactValueLabel` and per-channel overrides for `red`, `green`, `blue`, `hue`, `saturation`, `lightness`, `brightness` and `alpha`. Picker messages also cover `hexGuidance`, `approximationLabel`, `readOnlyApproximation`, `editableApproximation`, `outOfGamut`, `inGamut`, `fallbackPaint`, `supportedPaint` and `convertLabel`.

Channel precedence is the specific channel entry, then `validationText`, then the slider's built-in constraint message. An empty constraint override selects that built-in message. Wheel `validationText` describes an invalid exact hue; wheel `messages.invalidColor` describes an invalid authored color. Invalid-color text can be empty without changing validity.

The existing `invalidMessage` / `invalid-message` remains the HEX guidance fallback; `messages.hexGuidance` overrides it. Translation properties never create an error themselves and do not change the accepted color. Application `error` on form fields remains a separate API that sets invalidity.

## Reset and accessibility ownership

Remove a defaulted localization attribute to restore its constructor default. Explicit empty string attributes are preserved. Simple localization properties remain string APIs: direct `null` or `undefined` writes are not a reset API. This differs intentionally from partial message objects, whose nullish entries fall back safely.

Badge prefix remains exposed. Mark decoration in the authored markup:

```html
<en-badge><span slot="prefix" aria-hidden="true">★</span>Featured</en-badge>
```

If a prefix conveys meaningful information, supply its accessible alternative. Do not hide every avatar or prefix across component families; the documented owner determines the behavior.

## Verification

The focused suite covers 33 browser cases across Chromium, Firefox and WebKit, 25 SSR/metadata/color/calendar checks, and a strict consumer-type fixture. The workspace build and tooling tests pass. All 216 existing editor/color/date-range/form documentation integration checks pass across Chromium, Firefox and WebKit against a frozen production build. Together with the focused suite, this is 249 passing browser checks.

The composed color-editor demo now imports its token-editor definition explicitly; this removes its reliance on editor-trigger registering that dependency as a side effect.

Evidence is recorded under `artifacts/api-08`. Automated accessible-name/description assertions verify the association, not a particular screen reader's spoken phrasing.
