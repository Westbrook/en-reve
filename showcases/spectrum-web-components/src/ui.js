import "@spectrum-web-components/theme/sp-theme.js";
import "@spectrum-web-components/theme/spectrum-two/theme-light.js";
import "@spectrum-web-components/theme/spectrum-two/scale-medium.js";
import "@adobe/spectrum-wc/swc.css";
import "./style.css";
export const libraryName = "Spectrum WC Gen2 + Gen1 controls";
export const provider = (s) =>
  `<sp-theme class="swc-theme swc-theme--light swc-theme--sizeM" system="spectrum-two" color="light" scale="medium">${s}</sp-theme>`;
export const card = (s) => `<div class="native-card">${s}</div>`;
export const button = (label, action, secondary = false, attrs = "") =>
  `<swc-button variant="${secondary ? "secondary" : "accent"}" data-action="${action}" ${attrs}>${label}</swc-button>`;
export const input = (
  id,
  label,
  placeholder = "",
  type = "text",
  value = "",
) =>
  type === "date"
    ? `<label class="field">${label}<input id="${id}" aria-label="${label}" type="date" value="${value}"></label>`
    : `<div class="field"><sp-field-label for="${id}">${label}</sp-field-label><sp-textfield id="${id}" label="${label}" placeholder="${placeholder}" ${type === "textarea" ? 'multiline rows="3"' : `type="${type}"`} value="${value}"></sp-textfield></div>`;
export const check = (id, label, checked = false) =>
  `<sp-checkbox id="${id}" ${checked ? "checked" : ""}>${label}</sp-checkbox>`;
export const toggle = (id, label, checked = false) =>
  `<sp-switch id="${id}" ${checked ? "checked" : ""}>${label}</sp-switch>`;
export const badge = (s, id = "") =>
  `<swc-badge ${id ? `id="${id}"` : ""}>${s}</swc-badge>`;
export const avatar = (name) =>
  `<swc-avatar alt="${name}" src="data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='#ddd'/><text x='20' y='26' text-anchor='middle' font-family='sans-serif' font-size='14'>${name
      .split(" ")
      .map((x) => x[0])
      .join("")}</text></svg>`,
  )}"></swc-avatar>`;
export const select = (id, label, options, value = options[0]) =>
  `<div class="field"><sp-field-label for="${id}">${label}</sp-field-label><sp-picker id="${id}" label="${label}" value="${value}">${options.map((x) => `<sp-menu-item value="${x}" ${value === x ? "selected" : ""}>${x}</sp-menu-item>`).join("")}</sp-picker></div>`;
export const combo = (id, label, options) =>
  `<div class="field"><sp-field-label for="${id}">${label}</sp-field-label><sp-combobox id="${id}" label="${label}" placeholder="Search people…">${options.map((x) => `<sp-menu-item value="${x}">${x}</sp-menu-item>`).join("")}</sp-combobox></div>`;
export const segments = (id, label, options) =>
  `<sp-radio-group id="${id}" label="${label}" selected="${options[0]}" horizontal>${options.map((x, i) => `<sp-radio value="${x}" ${i ? "" : "checked"}>${x}</sp-radio>`).join("")}</sp-radio-group>`;
export const tabs = (items) =>
  `<swc-tabs selected="idea" accessible-label="Creative brief">${items.map((x) => `<swc-tab tab-id="${x.id}">${x.label}</swc-tab><swc-tab-panel tab-id="${x.id}"><div class="stack">${x.content}</div></swc-tab-panel>`).join("")}</swc-tabs>`;
export const disclosure = (label, s) =>
  `<swc-accordion level="3"><swc-accordion-item><span slot="label">${label}</span><p>${s}</p></swc-accordion-item></swc-accordion>`;
export const radio = (label, options) =>
  `<sp-radio-group label="${label}" selected="${options[0]}">${options.map((x, i) => `<sp-radio value="${x}" ${i ? "" : "checked"}>${x}</sp-radio>`).join("")}</sp-radio-group>`;
export const slider = (id, label, value) =>
  `<sp-slider id="${id}" label="${label}" value="${value}" min="0" max="100" step="1"></sp-slider>`;
export const number = (id, label, value) =>
  `<div class="field"><sp-field-label for="${id}">${label}</sp-field-label><sp-number-field id="${id}" label="${label}" value="${value}" min="25" max="400" step="25"></sp-number-field></div>`;
export const color = (id, label, value) =>
  `<div class="field"><sp-field-label for="${id}">${label}</sp-field-label><sp-color-field id="${id}" label="${label}" value="${value}"></sp-color-field></div>`;
export const progress = (id, value, max) =>
  `<swc-progress-bar id="${id}" value="${(value / max) * 100}"><span slot="label">Review checklist</span></swc-progress-bar>`;
export const dialog = (id, title, body) =>
  `<sp-overlay id="${id}-dialog" type="modal"><sp-dialog size="m"><h2 slot="heading">${title}</h2><div class="stack">${body}</div><swc-button slot="button" variant="secondary" data-action="close:${id}">Close</swc-button></sp-dialog></sp-overlay>`;
export const drawer = dialog;
export const menu = (label, items) =>
  `<overlay-trigger placement="bottom-start"><swc-action-button slot="trigger">${label} ▾</swc-action-button><sp-popover slot="click-content"><sp-menu>${items.map(([l, a]) => `<sp-menu-item data-action="${a}">${l}</sp-menu-item>`).join("")}</sp-menu></sp-popover></overlay-trigger>`;
let popoverId = 0;
export const popover = (label, body) => {
  const id = `spectrum-help-${++popoverId}`;
  return `<swc-action-button id="${id}">${label}</swc-action-button><swc-popover for="${id}" placement="bottom-start" accessible-label="${label}"><div class="stack" style="max-width:320px">${body}</div></swc-popover>`;
};
export const open = (e) => {
  e.open = true;
};
export const close = (e) => {
  e.open = false;
};
export const value = (e) =>
  e.localName === "sp-radio-group" ? e.selected : (e.value ?? "");
export const setValue = (e, v) => {
  e.value = v;
};
export const checked = (e) => e.checked;
export const setProgress = (e, v, m) => {
  e.value = (v / m) * 100;
};

export const link = (href, label) =>
  `<a class="swc-Link swc-Link--standalone" href="${href}">${label}</a>`;
