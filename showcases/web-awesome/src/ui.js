const esc = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
// Web Awesome option values cannot contain spaces. Preserve the shared fixture's
// logical values through a reversible encoding, without changing visible labels.
const optionValue = (value) => esc(encodeURIComponent(value));

export const libraryName = "Web Awesome";
// The shared fixture authors this one breadcrumb inline. Adapt it before DOM
// insertion so the native library component renders it without a second paint.
export const provider = (content) => content.replace(
  /<nav aria-label="Current study path">.*?<\/nav>/,
  '<wa-breadcrumb label="Current study path"><wa-breadcrumb-item href="#showcase-navigation">Studio</wa-breadcrumb-item><wa-breadcrumb-item href="#showcase-project">Projects</wa-breadcrumb-item><wa-breadcrumb-item>New study</wa-breadcrumb-item></wa-breadcrumb>',
);
export const card = (content) => `<wa-card>${content}</wa-card>`;
export const button = (label, action, secondary = false, attrs = "") =>
  `<wa-button variant="${secondary ? "neutral" : "brand"}" appearance="${secondary ? "outlined" : "accent"}" data-action="${action}" ${attrs}>${label}</wa-button>`;
export const input = (id, label, placeholder = "", type = "text", value = "") =>
  type === "textarea"
    ? `<wa-textarea id="${id}" label="${esc(label)}" placeholder="${esc(placeholder)}" value="${esc(value)}" rows="3"></wa-textarea>`
    : `<wa-input id="${id}" label="${esc(label)}" type="${type}" placeholder="${esc(placeholder)}" value="${esc(value)}"></wa-input>`;
export const check = (id, label, checked = false) =>
  `<wa-checkbox id="${id}" ${checked ? "checked" : ""}>${label}</wa-checkbox>`;
export const toggle = (id, label, checked = false) =>
  `<wa-switch id="${id}" ${checked ? "checked" : ""}>${label}</wa-switch>`;
export const badge = (content, id = "") =>
  `<wa-badge ${id ? `id="${id}"` : ""}>${content}</wa-badge>`;
export const avatar = (name) =>
  `<wa-avatar label="${esc(name)}" initials="${esc(name.split(" ").map((part) => part[0]).join(""))}"></wa-avatar>`;
export const select = (id, label, options, value = options[0]) =>
  id === "rating"
    ? `<div class="field"><span>${esc(label)}</span><wa-rating id="${id}" label="${esc(label)}" value="${esc(value)}" max="5"></wa-rating></div>`
    : `<wa-select id="${id}" label="${esc(label)}" placeholder="Choose one">${options.map((option) => `<wa-option value="${optionValue(option)}" ${option === value ? "selected" : ""}>${esc(option)}</wa-option>`).join("")}</wa-select>`;
// Searchable combobox is a Pro component; the free select keeps the same choices.
export const combo = (id, label, options) => select(id, label, options, "");
export const segments = (id, label, options) =>
  `<wa-radio-group id="${id}" label="${esc(label)}" orientation="horizontal" value="${optionValue(options[0])}">${options.map((option) => `<wa-radio appearance="button" value="${optionValue(option)}">${esc(option)}</wa-radio>`).join("")}</wa-radio-group>`;
export const tabs = (items) =>
  `<wa-tab-group active="${items[0].id}" aria-label="Creative brief">${items.map((item) => `<wa-tab panel="${item.id}">${item.label}</wa-tab>`).join("")}${items.map((item) => `<wa-tab-panel name="${item.id}"><div class="stack">${item.content}</div></wa-tab-panel>`).join("")}</wa-tab-group>`;
export const disclosure = (label, content) =>
  `<wa-details summary="${esc(label)}"><p>${content}</p></wa-details>`;
export const radio = (label, options) =>
  `<wa-radio-group label="${esc(label)}" value="${optionValue(options[0])}">${options.map((option) => `<wa-radio value="${optionValue(option)}">${esc(option)}</wa-radio>`).join("")}</wa-radio-group>`;
export const slider = (id, label, value) =>
  `<wa-slider id="${id}" label="${esc(label)}" value="${value}" min="0" max="100" step="1"></wa-slider>`;
export const number = (id, label, value) =>
  `<wa-number-input id="${id}" label="${esc(label)}" value="${value}" min="25" max="400" step="25"></wa-number-input>`;
export const color = (id, label, value) =>
  `<wa-color-picker id="${id}" label="${esc(label)}" value="${value}" format="hex"></wa-color-picker>`;
export const progress = (id, value, max) =>
  `<wa-progress-bar id="${id}" label="Review checklist" value="${value / max * 100}"></wa-progress-bar>`;
export const dialog = (id, title, body) =>
  `<wa-dialog id="${id}-dialog" label="${esc(title)}"><div class="stack">${body}</div>${button("Close", "close:" + id, true, 'slot="footer"')}</wa-dialog>`;
export const drawer = (id, title, body) =>
  `<wa-drawer id="${id}-dialog" label="${esc(title)}" placement="end"><div class="stack">${body}</div>${button("Close", "close:" + id, true, 'slot="footer"')}</wa-drawer>`;
export const menu = (label, items) =>
  `<wa-dropdown><wa-button slot="trigger" appearance="outlined" with-caret>${label}</wa-button>${items.map(([label, action]) => `<wa-dropdown-item data-action="${action}">${label}</wa-dropdown-item>`).join("")}</wa-dropdown>`;
let popoverCount = 0;
export const popover = (label, body) => {
  const id = `help-${++popoverCount}`;
  return `<wa-button id="${id}" appearance="outlined">${label}</wa-button><wa-popover for="${id}" placement="bottom-start"><div class="stack">${body}</div></wa-popover>`;
};
export const open = (element) => { element.open = true; };
export const close = (element) => { element.open = false; };
export const value = (element) =>
  ["wa-select", "wa-radio-group"].includes(element.localName)
    ? decodeURIComponent(element.value ?? "")
    : (element.value ?? "");
export const setValue = (element, value) => { element.value = value; };
export const checked = (element) => element.checked;
export const setProgress = (element, value, max) => { element.value = value / max * 100; };
export const link = (href, label) => `<a href="${href}">${label}</a>`;
export const connect = () => {};
