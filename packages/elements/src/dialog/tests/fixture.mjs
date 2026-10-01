import { EnDialog } from '../dialog.ts';
import { EnDrawer } from '../../drawer/drawer.ts';
import { EnPopover } from '../../popover/popover.ts';
import { EnTooltip } from '../../tooltip/tooltip.ts';
import { EnButton } from '../../button/element.ts';
import { EnIcon } from '../../icon/element.ts';
import { EnCommandPalette } from '../../command-palette/element.ts';

customElements.define('en-dialog', EnDialog);
customElements.define('en-drawer', EnDrawer);
customElements.define('en-popover', EnPopover);
customElements.define('en-tooltip', EnTooltip);
customElements.define('en-button', EnButton);
customElements.define('en-icon', EnIcon);
customElements.define('en-command-palette', EnCommandPalette);
class FallbackDialog extends EnDialog {
  get supportsNativeClosedBy() { return false; }
}
customElements.define('en-fallback-dialog', FallbackDialog);

window.overlayEvents = [];
window.cancelOverlayChanges = false;
document.addEventListener('en-change', event => {
  const surface = event.target.shadowRoot?.querySelector('dialog');
  window.overlayEvents.push({ target: event.target.id, type: event.type, ...event.detail,
    open: event.target.open, surfaceOpen: surface?.open, modal: surface?.matches(':modal'),
    cancelable: event.cancelable, bubbles: event.bubbles, composed: event.composed });
  if (window.cancelOverlayChanges) event.preventDefault();
});
document.querySelector('#open-dialog').onclick = () => document.querySelector('#dialog').show();
document.querySelector('#open-drawer').onclick = () => document.querySelector('#drawer').show();
document.querySelector('#open-command-palette').onclick = () => document.querySelector('#command-palette').show();
for (const [id, name] of [['shadow-a', 'Scope A'], ['shadow-b', 'Scope B']]) {
  const root = document.getElementById(id).attachShadow({ mode: 'open' });
  root.innerHTML = `<button id="same-trigger">${name} trigger</button><en-popover id="local-popover" for="same-trigger" label="${name} options"><p>${name} content</p></en-popover><en-tooltip id="local-tooltip" for="same-trigger" show-delay="0"><span slot="content">${name} hint</span></en-tooltip>`;
}
const missingRoot = document.getElementById('shadow-missing').attachShadow({ mode: 'open' });
missingRoot.innerHTML = '<en-popover id="local-popover" for="same-trigger" label="Late scope options"><p>Local content</p></en-popover>';
window.overlaysReady = true;
