import { EnButton } from '../../../elements/src/button/element.js';
import { EnTextField } from '../../../elements/src/text-field/element.js';
import { EnRating } from '../../../elements/src/rating/index.js';
customElements.define('en-rating', EnRating);
customElements.define('en-button', EnButton);
customElements.define('en-text-field', EnTextField);
const fixture = document.querySelector('#fixture')!;
const mode = new URL(location.href).searchParams.get('mode') ?? 'document';
const controls = `<en-button id="first">First action</en-button><div class="gap"></div>
  <en-text-field id="middle" label="Middle editor"></en-text-field><div class="gap"></div>
  <en-button id="last">Last action</en-button>`;
fixture.innerHTML = mode === 'rating'
  ? `<div class="scrollport"><div class="scrollport-content"><en-button id="first">First action</en-button><div class="gap"></div><en-rating id="rating" label="Study rating" value="3"></en-rating><div class="gap"></div></div></div>`
  : mode === 'nested'
  ? `<div class="scrollport"><div class="scrollport-content">${controls}</div></div>`
  : mode === 'inline'
    ? `<div class="horizontal"><div class="horizontal-content"><en-button id="first">First action</en-button><en-text-field id="middle" label="Middle editor"></en-text-field><en-button id="last">Last action</en-button></div></div>`
    : `<div style="padding-block: 64px">${controls}</div>`;
await Promise.all([...fixture.querySelectorAll('en-button,en-text-field,en-rating')].map((el) => (el as EnButton).updateComplete));
document.body.dataset.ready = 'true';
