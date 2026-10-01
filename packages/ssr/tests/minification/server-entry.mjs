import '@en-reve/elements/define/rich-text-editor.js';
import '@en-reve/elements/define/token-editor.js';
import '@en-reve/elements/define/text-field.js';
import '@en-reve/elements/define/textarea.js';
import { renderToString } from '@en-reve/ssr';
import { fixtureStyles, initial, template, MinifierProbe } from './template.mjs';

customElements.define('en-minifier-probe', MinifierProbe);
export async function renderFixture() {
  return { markup: await renderToString(template(initial())), css: fixtureStyles.cssText };
}
