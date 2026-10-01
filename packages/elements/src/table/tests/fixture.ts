import { EnTable } from '../index.js';
import { tableStyles } from '@en-reve/styles/table.js';
const sheet = new CSSStyleSheet();
sheet.replaceSync(tableStyles.cssText);
document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
customElements.define('en-table', EnTable);
