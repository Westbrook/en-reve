import { html, noChange, nothing } from 'lit';

export const fallbackFormats = Object.freeze([
  { value: 'fallback-png', label: 'Fallback PNG' },
  { value: 'fallback-svg', label: 'Fallback SVG' },
]);
export const fallbackModes = Object.freeze([
  { value: 'fallback-light', label: 'Fallback light' },
  { value: 'fallback-dark', label: 'Fallback dark' },
]);

/** Authored descriptors are the only child source; the SSR adapter plans it. */
export function selectionTemplate(propertyBound = false) {
  return html`<form id="selection-form">
    <label>Before selections<input id="before"></label>
    <en-select id="format" name="format" label="Export format" value="svg" required .value=${propertyBound ? 'svg' : noChange} .items=${fallbackFormats}>
      <en-select-option id="format-png" value="png">PNG</en-select-option>
      <en-select-option id="format-svg" value="svg">SVG</en-select-option>
      <en-select-option id="format-avif" value="avif" disabled>AVIF</en-select-option>
    </en-select>
    <label>Before appearance<input id="between"></label>
    <en-segmented-control id="appearance" name="appearance" label="Appearance" value="dark" required .value=${propertyBound ? 'dark' : noChange} .items=${fallbackModes}>
      <en-segmented-item id="appearance-light" value="light"><span id="rich-light"><strong>Light</strong> <span>mode</span></span></en-segmented-item>
      <en-segmented-item id="appearance-dark" value="dark"><span id="rich-dark"><strong>Dark</strong> <span>mode</span></span></en-segmented-item>
      <en-segmented-item id="appearance-sepia" value="sepia" disabled><span>Sepia mode</span></en-segmented-item>
    </en-segmented-control>
    <label>After appearance<input id="after"></label>
    <button type="reset">Reset selections</button>
    <button type="submit">Submit selections</button>
  </form>`;
}

/** Keep literal attributes so hydration does not replay a bound value setter. */
export function unselectedTemplate() {
  return html`<form id="selection-form">
    <en-select id="format" name="format" label="Export format" value="" required>
      <en-select-option value="png">PNG</en-select-option>
      <en-select-option value="svg">SVG</en-select-option>
    </en-select>
    <en-segmented-control id="appearance" name="appearance" label="Appearance" value="" required>
      <en-segmented-item value="light">Light mode</en-segmented-item>
      <en-segmented-item value="dark">Dark mode</en-segmented-item>
    </en-segmented-control>
  </form>`;
}

// Append to packages/elements/src/selection-authoring/tests/fixture.mjs.
// Add `nothing` to that module's existing Lit import.
export function rejectedSegmentedRootTemplate(attribute) {
  return html`<en-segmented-control label="Invalid authored label" value="one">
    <en-segmented-item value="one"
      tabindex=${attribute === 'tabindex' ? '0' : nothing}
      contenteditable=${attribute === 'contenteditable' ? 'true' : nothing}
      ?inert=${attribute === 'inert'}
      aria-hidden=${attribute === 'aria-hidden' ? 'true' : nothing}>One</en-segmented-item>
  </en-segmented-control>`;
}
