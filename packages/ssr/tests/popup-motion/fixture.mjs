import { html } from 'lit';
import { EnDialog } from '@en-reve/elements/dialog.js';
import { EnDrawer } from '@en-reve/elements/drawer.js';
import { EnPopover } from '@en-reve/elements/popover.js';
import { EnTooltip } from '@en-reve/elements/tooltip.js';
import { EnMenu } from '@en-reve/elements/menu.js';
import { EnMenuItem } from '@en-reve/elements/menu-item.js';
import { EnCommandPalette } from '@en-reve/elements/command-palette.js';
import { EnCombobox } from '@en-reve/elements/combobox.js';
import { EnSelect } from '@en-reve/elements/select.js';
import { EnButton } from '@en-reve/elements/button.js';
import { EnIcon } from '@en-reve/elements/icon.js';
export function registerFixture() {
  for (const [name, ctor] of [['en-button',EnButton],['en-icon',EnIcon],['en-dialog',EnDialog],['en-drawer',EnDrawer],['en-popover',EnPopover],['en-tooltip',EnTooltip],['en-menu',EnMenu],['en-menu-item',EnMenuItem],['en-command-palette',EnCommandPalette],['en-combobox',EnCombobox],['en-select',EnSelect]]) {
    if (!customElements.get(name)) customElements.define(name,ctor);
  }
}
export function fixtureTemplate() {
  return html`
    <button id="dialog-trigger" type="button">Dialog</button>
    <en-dialog id="dialog" label="Project dialog"><button id="dialog-content" type="button">Dialog command</button></en-dialog>
    <button id="drawer-trigger" type="button">Drawer</button>
    <en-drawer id="drawer" label="Project drawer"><button id="drawer-content" type="button">Drawer command</button></en-drawer>
    <button id="popover-trigger" type="button">Popover</button>
    <en-popover id="popover" for="popover-trigger" label="Project popover"><button id="popover-content" type="button">Popover command</button></en-popover>
    <button id="menu-trigger" type="button">Menu</button>
    <en-menu id="menu" for="menu-trigger" label="Project menu"><en-menu-item id="menu-content" action="copy">Copy project</en-menu-item></en-menu>
    <button id="palette-trigger" type="button">Palette</button>
    <en-command-palette id="palette" for="palette-trigger" label="Project commands" .commands=${[{action:'copy',label:'Copy project'}]}></en-command-palette>
    <en-combobox id="combobox" label="Project" value="a" .items=${[{value:'a',label:'Alpha'},{value:'b',label:'Beta'}]}></en-combobox>
    <en-select id="select" label="Export format" value="png" .items=${[{value:'png',label:'PNG'},{value:'svg',label:'SVG'}]}></en-select>
    <button id="tooltip-before" type="button">Before tooltip</button>
    <button id="tooltip-trigger" type="button" aria-describedby="tooltip-existing-description">Tooltip details</button>
    <span id="tooltip-existing-description" hidden>Project history.</span>
    <en-tooltip id="tooltip" for="tooltip-trigger" show-delay="0">
      <span id="tooltip-content" slot="content">Supplemental motion guidance.</span>
    </en-tooltip>
    <button id="after" type="button">After surfaces</button>`;
}
