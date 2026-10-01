import { registerAll } from '../../catalog.js';
import { emitThemeCSS, resolveTheme } from '@en-reve/tokens';
registerAll();
const style=document.createElement('style');style.textContent=emitThemeCSS(resolveTheme({name:'patterns',mode:'light'}));document.head.append(style);
document.documentElement.setAttribute('data-en-theme','patterns');document.documentElement.setAttribute('data-en-appearance','light');
