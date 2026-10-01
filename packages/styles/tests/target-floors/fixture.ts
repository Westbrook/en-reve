import '@en-reve/tokens/default.css';
import * as styles from '../../src/index.js';
import {navigationDisclosureStyles} from '../../src/navigation.js';
import {treeDataStyles} from '../../src/tree.js';
import {tokenEditorStyles} from '../../src/token-editor.js';
import '@en-reve/elements/define/slider.js';
import '@en-reve/elements/define/color-slider.js';
import '@en-reve/elements/define/calendar.js';
import '@en-reve/elements/define/carousel.js';
import '@en-reve/elements/define/data-table.js';
import '@en-reve/elements/define/navigation.js';
import '@en-reve/elements/define/navigation-group.js';
import '@en-reve/elements/define/breadcrumbs.js';
const families = {
 swatch:[styles.swatchStyles],
 split:[styles.layoutStyles],
 wheel:[styles.colorWheelStyles],
 plane:[styles.colorPlaneStyles],
 control:[styles.controlStyles,styles.formStyles,styles.selectEnhancementStyles],
 button:[styles.buttonStyles],
 selection:[styles.selectionStyles],
 menu:[styles.menuStyles,styles.menuItemStyles,styles.commandPaletteStyles],
 combobox:[styles.controlStyles,styles.comboboxStyles],
 tree:[styles.treeStyles,styles.treeItemStyles,treeDataStyles],
 file:[styles.fileUploadStyles],
 editor:[tokenEditorStyles],
 navigation:[styles.navigationStyles,navigationDisclosureStyles],
 carousel:[styles.buttonStyles,styles.carouselStyles],
 pagination:[styles.buttonStyles,styles.paginationStyles],
};
customElements.define('en-target-sample',class extends HTMLElement {
 connectedCallback(){
  const root=this.attachShadow({mode:'open'}),sheet=new CSSStyleSheet();
  const family=this.dataset.family as keyof typeof families;
  sheet.replaceSync([styles.foundationStyles,...families[family]].map(s=>s.cssText).join('\n'));
  root.adoptedStyleSheets=[sheet];root.innerHTML=this.innerHTML;this.innerHTML='';
 }
});
document.body.dataset.ready='true';
