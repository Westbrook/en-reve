import{t as e}from"./modulepreload-polyfill-lLXDlF_5.js";import"./site-CCn1K0Vy.js";import{S as t,_ as n,d as r,n as i,r as a,u as o,x as s}from"./css-vtazsnPq.js";import{n as c,t as l}from"./theme-CqlidhcM.js";import{t as u}from"./validation-summary-BPS-oevj.js";import{t as d}from"./rolldown-runtime-B0lUwjiP.js";function f(e){if(/^#[\da-f]{3}(?:[\da-f]|[\da-f]{3}|[\da-f]{5})?$/i.test(e)||/^(transparent|black|white|red|green|blue|yellow|cyan|magenta|gray|grey|orange|purple|rebeccapurple)$/i.test(e))return!0;let t=/^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(([^()]*)\)$/i.exec(e);if(!t)return!1;let n=t[2].trim(),r=t[1].toLowerCase();if(r===`color`){let e=/^(srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65)\s+/i.exec(n);if(!e)return!1;n=n.slice(e[0].length)}if(n.includes(`,`)){if(![`rgb`,`rgba`,`hsl`,`hsla`].includes(r)||n.includes(`/`))return!1;let e=n.split(`,`).map(e=>e.trim());if(![3,4].includes(e.length)||r.startsWith(`rgb`)&&!e.slice(0,3).every(t=>x.test(t)===x.test(e[0])))return!1;n=e.slice(0,3).join(` `)+(e[3]===void 0?``:` / ${e[3]}`)}let i=n.split(`/`);if(i.length>2)return!1;let a=i[0].trim().split(/\s+/);if(a.length!==3)return!1;let o=e=>w(e,y)||w(e,x);return i[1]!==void 0&&!o(i[1].trim())?!1:a.every((e,t)=>(r.startsWith(`hsl`)||r===`hwb`?t===0:(r===`lch`||r===`oklch`)&&t===2)?w(e,y)||w(e,C):r.startsWith(`hsl`)||r===`hwb`?w(e,x):o(e))}function p(e,t){let r=t=>{throw new n(`invalid-property-registration`,`${e}: ${t}`)};/^--[a-zA-Z][a-zA-Z\d_-]*$/.test(e)||r(`use a public CSS custom property name.`),(!t||!_.has(t.syntax)||typeof t.inherits!=`boolean`)&&r(`supply a supported syntax and an explicit inherits boolean.`);let i=t.initialValue;if(i===void 0){t.syntax!==`*`&&r(`typed properties require an independent initialValue.`);return}(typeof i!=`string`||!i.trim()||/[{};\u0000-\u001f\\"'<>]|\/\*|\*\//.test(i))&&r(`initialValue must be a concrete CSS value without declaration syntax.`);let a=i.trim(),o=()=>a===`0`||w(a,b),s;switch(t.syntax){case`<number>`:s=w(a,y);break;case`<integer>`:s=/^[+-]?\d+$/.test(a)&&Number.isSafeInteger(Number(a));break;case`<length>`:s=o();break;case`<length-percentage>`:s=o()||w(a,x);break;case`<percentage>`:s=w(a,x);break;case`<angle>`:s=w(a,C);break;case`<time>`:s=w(a,S);break;case`<color>`:s=f(a);break;case`*`:s=w(a,y)||o()||w(a,x)||w(a,S)||w(a,C)||f(a)}s||r(`initialValue does not match ${t.syntax}, is context-dependent, or is outside the supported concrete-value grammar.`)}function m(e,t){if(!t||t.startsWith(`component.`))return;let n=(T??=c()).tokens[t];if(!n||n.cssName!==e)return;let r=n.type===`color`?`<color>`:n.type===`number`&&t!==`layout.prose-max`||n.type===`fontWeight`?`<number>`:n.type===`duration`?`<time>`:n.type===`dimension`&&w(n.cssValue,b)?`<length>`:void 0;if(!r)return;let i={syntax:r,inherits:!0,initialValue:n.cssValue};return p(e,i),i}function h(e,t={}){if(t.mode!==void 0&&![`compatible`,`typed`].includes(t.mode))throw new n(`invalid-property-registration`,`Unknown registration mode.`);let r=o(e),i=new Map(r.map(e=>[e.cssName,e])),a=t.definitions??{},c=new Set(t.names??i.keys());for(let e of Object.keys(a))c.add(e);let l=[],u=[];for(let e of[...c].sort()){let r=i.get(e),o=a[e];if(!r&&o===void 0)throw new n(`unknown-customization-property`,`Unknown CSS customization property ${e}. Supply an explicit definition for application-owned properties.`);if(o===!1){u.push({name:e,reason:`Explicitly excluded from registration.`});continue}if(o!==void 0){p(e,o),l.push({name:e,syntax:o.syntax,inherits:o.inherits,...o.initialValue===void 0?{}:{initialValue:o.initialValue},policy:`explicit`,reason:`Explicit application contract; initial/inheritance changes are intentional.`});continue}let s=t.mode===`typed`?m(e,r?.tokenId):void 0;s?l.push({name:e,...s,policy:`typed`,reason:`Opt-in typed semantic token with a stable canonical initial value.`}):l.push({name:e,syntax:`*`,inherits:r.inherits,policy:`compatible`,reason:t.mode===`typed`?`Preserves optional fallback, context-dependent values, configuration or compound CSS grammar; use an explicit definition to opt into different semantics.`:`Preserves inherited token streams and guaranteed-invalid initial values, including var() fallbacks.`})}return s({registrations:l,exclusions:u})}function g(e,t={}){return`/* En Rêve public custom property registrations. Load one policy per document. */
`+h(e,t).registrations.map(({name:e,syntax:t,inherits:n,initialValue:r})=>`@property ${e} {\n  syntax: "${t}";\n  inherits: ${n};${r===void 0?``:`\n  initial-value: ${r.trim()};`}\n}`).join(`
`)+`
`}var _,v,y,b,x,S,C,w,T;function E(){return(E=d((()=>{r(),l(),t(),_=new Set([`*`,`<color>`,`<number>`,`<integer>`,`<length>`,`<length-percentage>`,`<percentage>`,`<angle>`,`<time>`]),v=`[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?`,y=RegExp(`^${v}$`),b=RegExp(`^(${v})(px|cm|mm|q|in|pt|pc)$`,`i`),x=RegExp(`^(${v})%$`),S=RegExp(`^(${v})(ms|s)$`,`i`),C=RegExp(`^(${v})(deg|grad|rad|turn)$`,`i`),w=(e,t)=>{let n=t.exec(e);return!!n&&Number.isFinite(Number(n[1]??n[0]))}})))()}async function D(){let e=[`before`,`full`,`partial`,`local`];await Promise.all(e.map(e=>M(`boundary-${e}`).querySelector(`en-validation-summary`)?.updateComplete));for(let t of e){let e=M(`boundary-${t}`).querySelector(`en-validation-summary`)?.shadowRoot?.querySelector(`[part="base"]`);M(`radius-${t}`).textContent=e?getComputedStyle(e).borderTopLeftRadius:`Unavailable`}}function O(){let e=M(`boundary-appearance`).value===`dark`?`dark`:`light`,t=c({name:`customization-review`,mode:e,pins:{"radius.container":{value:8,unit:`px`}}}),n=c({name:`customization-page`,mode:e});P.textContent=i(n,{scope:`root`,colorScheme:!0})+[`before`,`full`,`local`].map(e=>i(t,{selector:`#boundary-${e}`,colorScheme:!0})).join(`
`)+i(t,{selector:`#boundary-partial`,kind:`partial`,tokenIds:[`radius.container`]})+`
#boundary-before { --en-validation-summary-radius: inherit; }`,D()}function k(){for(let e of[`compatible`,`typed`]){let t=getComputedStyle(M(`${e}-preview`));for(let n of[`level`,`tint`]){let r=t.getPropertyValue(`--en-demo-${e}-${n}`).trim();M(`${e}-${n}`).textContent=r||(n===`level`?`unset → fallback .25`:`unset → fallback #6553c0`)}}}function A(){let e=z?H===`invalid`?`Invalid input: compatible values stay untyped; typed values resolve to the registered initial values.`:H===`unset`?`Declarations removed: compatible samples use var() fallbacks; typed samples use registered initial values.`:`Valid ${H} values applied. Typed values ${B.matches?`update immediately because reduced motion is enabled`:`interpolate over 650ms`}.`:`This browser does not expose property registration. Both samples behave as unregistered custom properties.`;M(`registration-status`).textContent=e}function j(e){H=e;let t=V[e];for(let e of[`compatible`,`typed`]){let n=M(`${e}-preview`);for(let r of[`level`,`tint`]){let i=`--en-demo-${e}-${r}`;t?n.style.setProperty(i,t[r]):n.style.removeProperty(i)}}for(let t of document.querySelectorAll(`[data-property-state]`))t.setAttribute(`aria-pressed`,String(t.dataset.propertyState===e));cancelAnimationFrame(U);let n=performance.now()+(B.matches?0:750),r=()=>{k(),performance.now()<n&&(U=requestAnimationFrame(r))};r(),A()}var M,N,P,F,I,L,R,z,B,V,H,U;function W(){return(W=d((()=>{u(),E(),a(),l(),M=e=>{let t=document.getElementById(e);if(!t)throw Error(`Missing theme customization element: ${e}`);return t},N=(e,t)=>{M(e).textContent=t},P=document.createElement(`style`),P.dataset.themeCustomization=``,document.head.append(P),N(`boundary-source`,`import { emitThemeCSS, resolveTheme } from '@en-reve/tokens';

const theme = resolveTheme({
  name: 'customization-review',
  pins: { 'radius.container': { value: 8, unit: 'px' } },
});

// A complete boundary resets public component overrides.
emitThemeCSS(theme, { selector: '#full', colorScheme: true });

// A partial boundary changes only the selected tokens.
emitThemeCSS(theme, {
  selector: '#partial',
  kind: 'partial',
  tokenIds: ['radius.container'],
});`),N(`override-source`,`/* Ancestor customization, outside all four boundaries. */
.ancestor { --en-validation-summary-radius: 32px; }

/* Full output resets the hook; the component uses its fallback. */
#full { --en-validation-summary-radius: initial; }

/* The Before specimen intentionally recreates the former leak. */
#before { --en-validation-summary-radius: inherit; }

/* The application can still author a value on the component. */
#local en-validation-summary { --en-validation-summary-radius: 2px; }

/* The real component's shared style consumes the hook. */
border-radius: var(--en-validation-summary-radius, var(--en-radius-container));`),M(`ancestor-radius`).addEventListener(`input`,e=>{let t=`${e.currentTarget.value}px`;M(`boundary-specimens`).style.setProperty(`--en-validation-summary-radius`,t),M(`ancestor-radius-value`).textContent=t,D()}),M(`boundary-appearance`).addEventListener(`change`,O),O(),F=c(),I=g(F,{mode:`compatible`,names:[],definitions:{"--en-demo-compatible-level":{syntax:`*`,inherits:!0},"--en-demo-compatible-tint":{syntax:`*`,inherits:!0}}}),L=g(F,{mode:`typed`,names:[],definitions:{"--en-demo-typed-level":{syntax:`<number>`,inherits:!0,initialValue:`0.25`},"--en-demo-typed-tint":{syntax:`<color>`,inherits:!0,initialValue:`#6553c0`}}}),R=document.createElement(`style`),R.dataset.themeCustomizationRegistrations=``,R.textContent=I+`
`+L,document.head.append(R),N(`compatible-source`,I),N(`typed-source`,L+`

.preview {
  transition: --en-demo-typed-level 650ms ease,
              --en-demo-typed-tint 650ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .preview { transition: none; }
}`),N(`configuration-source`,`import {
  createPropertyRegistrationPlan,
  emitPropertyRegistrations,
  resolveTheme,
} from '@en-reve/tokens';

const theme = resolveTheme();

// The generated default stylesheet already includes compatible
// registrations. Choose a policy once for the entire document.
const plan = createPropertyRegistrationPlan(theme, {
  mode: 'compatible',
});

// Register an application-owned typed value explicitly.
// names: [] selects only the supplied definitions.
const css = emitPropertyRegistrations(theme, {
  mode: 'typed',
  names: [],
  definitions: {
    '--app-progress': {
      syntax: '<number>',
      inherits: true,
      initialValue: '0',
    },
  },
});

// Inspect plan.registrations / plan.exclusions before emitting.`),z=typeof CSS<`u`&&`registerProperty`in CSS,B=matchMedia(`(prefers-reduced-motion: reduce)`),V={unset:void 0,calm:{level:`.25`,tint:`#6553c0`},bright:{level:`.85`,tint:`#b84672`},invalid:{level:`not-a-number`,tint:`not-a-color`}},H=`unset`,U=0;for(let e of document.querySelectorAll(`[data-property-state]`))e.addEventListener(`click`,()=>j(e.dataset.propertyState));if(B.addEventListener(`change`,A),j(`unset`),new URLSearchParams(location.search).has(`progress-report`)){M(`progress-return`).hidden=!1;for(let e of document.querySelectorAll(`a[data-preserve-report]`)){let t=new URL(e.href);t.searchParams.set(`progress-report`,``),e.href=t.href}}})))()}function G(){return(G=d((()=>{e(),W()})))()}G();
//# sourceMappingURL=themeCustomization-CpvdI5Bp.js.map