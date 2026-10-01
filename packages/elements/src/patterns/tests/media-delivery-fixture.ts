import { mediaViewerDefinition } from '../../definitions/media-viewer.js';
import { createElementScope, elementScopeCapabilities } from '../../element-scope.js';
import { createThemePair, emitThemePairCSS, resolveTheme } from '@en-reve/tokens';
const style = document.createElement('style');
style.textContent = emitThemePairCSS(createThemePair({
  name: 'media-delivery',
  light: resolveTheme({ name: 'media-delivery-light', mode: 'light' }),
  dark: resolveTheme({ name: 'media-delivery-dark', mode: 'dark' }),
}), { scope: 'root' });
document.head.append(style);
document.documentElement.dataset.enTheme = 'media-delivery';
document.documentElement.dataset.enAppearance = 'light';
const src = (color: string) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="650"><rect width="1000" height="650" fill="${color}"/></svg>`);
const items = [{ key: 'a', alt: 'First image', src: src('red'), caption: 'First study' }, { key: 'b', alt: 'Second image', src: src('blue'), caption: 'Second study' }];
async function settle(root: ParentNode): Promise<void> {
  for (const element of Array.from(root.querySelectorAll('*'))) {
    await (element as HTMLElement & { updateComplete?: Promise<boolean> }).updateComplete;
    if (element.shadowRoot) await settle(element.shadowRoot);
  }
}
Object.assign(window, { mediaDelivery: { createElementScope, elementScopeCapabilities, definition: mediaViewerDefinition, items, settle } });
