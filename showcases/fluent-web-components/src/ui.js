import { setTheme } from "@fluentui/web-components/theme/set-theme.js";
import { webLightTheme } from "@fluentui/tokens";
import "./style.css";
setTheme(webLightTheme);
export const libraryName = "Fluent 2 Web Components";
export const provider = (s) => s;
export const card = (s) => `<div class="native-card">${s}</div>`;
export const button = (label, action, secondary = false, attrs = "") =>
  `<fluent-button appearance="${secondary ? "secondary" : "primary"}" data-action="${action}" ${attrs}>${label}</fluent-button>`;
const field = (id, label, control) =>
  `<fluent-field><label slot="label" for="${id}">${label}</label>${control}</fluent-field>`;
export const input = (id, label, placeholder = "", type = "text", value = "") =>
  field(
    id,
    label,
    type === "textarea"
      ? `<fluent-textarea id="${id}" slot="input" aria-label="${label}" placeholder="${placeholder}" value="${value}" rows="3"></fluent-textarea>`
      : `<fluent-text-input id="${id}" slot="input" aria-label="${label}" type="${type}" placeholder="${placeholder}" value="${value}"></fluent-text-input>`,
  );
export const check = (id, label, checked = false) =>
  `<div class="row"><fluent-checkbox id="${id}" aria-label="${label}" ${checked ? "checked" : ""}></fluent-checkbox><label for="${id}">${label}</label></div>`;
export const toggle = (id, label, checked = false) =>
  `<div class="row"><fluent-switch id="${id}" aria-label="${label}" ${checked ? "checked" : ""}></fluent-switch><label for="${id}">${label}</label></div>`;
export const badge = (s, id = "") =>
  `<fluent-badge ${id ? `id="${id}"` : ""}>${s}</fluent-badge>`;
export const avatar = (name) =>
  `<fluent-avatar name="${name}" aria-label="${name}"></fluent-avatar>`;
export const select = (
  id,
  label,
  options,
  value = options[0],
  type = "dropdown",
) =>
  field(
    id,
    label,
    `<fluent-dropdown id="${id}" slot="input" aria-label="${label}" type="${type}" value="${value}"><fluent-listbox>${options.map((x) => `<fluent-option value="${x}" ${value === x ? "selected" : ""}>${x}</fluent-option>`).join("")}</fluent-listbox></fluent-dropdown>`,
  );
export const combo = (id, label, options) =>
  select(id, label, options, "", "combobox");
export const segments = (id, label, options) => select(id, label, options);
export const tabs = (items) =>
  `<fluent-tablist id="brief-tabs" aria-label="Creative brief">${items.map((x, i) => `<fluent-tab id="tab-${x.id}" ${i === 0 ? "selected" : ""} aria-controls="panel-${x.id}">${x.label}</fluent-tab>`).join("")}</fluent-tablist>${items.map((x, i) => `<div role="tabpanel" id="panel-${x.id}" aria-labelledby="tab-${x.id}" ${i ? "hidden" : ""}>${x.content}</div>`).join("")}`;
export const disclosure = (label, s) =>
  `<fluent-accordion><fluent-accordion-item><span slot="heading">${label}</span><p>${s}</p></fluent-accordion-item></fluent-accordion>`;
export const radio = (label, options) =>
  `<fluent-radio-group aria-label="${label}">${options.map((x, i) => `<div class="row"><fluent-radio id="quality-${i}" value="${x}" aria-label="${x}" ${i ? "" : "checked"}></fluent-radio><label for="quality-${i}">${x}</label></div>`).join("")}</fluent-radio-group>`;
export const slider = (id, label, value) =>
  field(
    id,
    label,
    `<fluent-slider slot="input" id="${id}" aria-label="${label}" value="${value}" min="0" max="100" step="1"></fluent-slider>`,
  );
export const number = (id, label, value) =>
  input(id, label, "", "number", value);
export const color = (id, label, value) =>
  field(
    id,
    label,
    `<input slot="input" id="${id}" aria-label="${label}" type="color" value="${value}">`,
  );
export const progress = (id, value, max) =>
  `<fluent-progress-bar id="${id}" aria-label="Review checklist" value="${value}" max="${max}"></fluent-progress-bar>`;
export const dialog = (id, title, body) =>
  `<fluent-dialog id="${id}-dialog" aria-label="${title}"><fluent-dialog-body><h2 slot="title">${title}</h2><div class="stack">${body}</div><div slot="action">${button("Close", "close:" + id, true)}</div></fluent-dialog-body></fluent-dialog>`;
export const drawer = (id, title, body) =>
  `<fluent-drawer id="${id}-dialog" position="end" aria-label="${title}"><fluent-drawer-body><h2 slot="title">${title}</h2><div class="stack">${body}</div><div slot="footer">${button("Close", "close:" + id, true)}</div></fluent-drawer-body></fluent-drawer>`;
export const menu = (label, items) =>
  `<fluent-menu><fluent-menu-button slot="trigger">${label}</fluent-menu-button><fluent-menu-list>${items.map(([l, a]) => `<fluent-menu-item data-action="${a}">${l}</fluent-menu-item>`).join("")}</fluent-menu-list></fluent-menu>`;
let pop = 0;
export const popover = (label, body) => {
  const id = "help-" + ++pop;
  return `<fluent-button appearance="secondary" data-popover="${id}" aria-controls="${id}" aria-expanded="false">${label}</fluent-button><div popover id="${id}" class="native-popover"><div class="stack">${body}</div></div>`;
};
export const open = (e) => e.show();
export const close = (e) => e.hide();
export const value = (e) => e.value ?? "";
export const setValue = (e, v) => {
  e.value = v;
};
export const checked = (e) => e.checked;
export const setProgress = (e, v, m) => {
  e.value = v;
  e.max = m;
};
export function connect() {
  document.addEventListener(
    "toggle",
    (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.hasAttribute("popover")) {
        document
          .querySelector(`[data-popover="${target.id}"]`)
          ?.setAttribute(
            "aria-expanded",
            String(target.matches(":popover-open")),
          );
      }
    },
    true,
  );
  document.addEventListener("click", (event) => {
    const trigger = event
      .composedPath()
      .find((x) => x instanceof HTMLElement && x.dataset.popover);
    if (trigger) {
      const popover = document.getElementById(trigger.dataset.popover);
      popover.togglePopover();
      trigger.setAttribute(
        "aria-expanded",
        String(popover.matches(":popover-open")),
      );
    }
  });
  document.addEventListener("change", (e) => {
    const tabs = e.composedPath().find((x) => x.id === "brief-tabs");
    if (tabs) {
      const active = tabs.activetab;
      if (active)
        for (const panel of document.querySelectorAll('[id^="panel-"]'))
          panel.hidden = panel.id !== active.getAttribute("aria-controls");
    }
  });
}

export const link = (href, label) =>
  `<fluent-link href="${href}">${label}</fluent-link>`;
