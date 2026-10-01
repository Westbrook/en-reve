import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { VirtualCollectionDemo } from './virtual-collection-demo.js';
if (!customElements.get('en-virtual-collection-demo')) customElements.define('en-virtual-collection-demo', VirtualCollectionDemo);
import { registerAll } from '@en-reve/elements/catalog.js';
import { StickerApp } from './app.js';
import { attachThemePreview } from './theme-review/preview.js';

registerAll();
customElements.define('en-sticker-app', StickerApp);
const app = document.querySelector<StickerApp>('en-sticker-app');
if (app) {
  await app.updateComplete;
  app.followInitialAnchor();
  app.progressReportEnabled = new URLSearchParams(location.search).has('progress-report');
  attachThemePreview(app);
}
