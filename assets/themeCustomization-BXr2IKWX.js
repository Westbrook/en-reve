import{n as e,t}from"./deployment-fragments-C3Yo3Per.js";import"./site-x7Whl3sL.js";import{S as n,_ as r,d as i,n as a,r as o,u as s,x as c}from"./css-BZfAHMMi.js";import{n as l,t as u}from"./theme-BmzUrlv3.js";import{t as d}from"./validation-summary-B6vP0xaH.js";import{t as f}from"./rolldown-runtime-B0lUwjiP.js";function p(e){if(/^#[\da-f]{3}(?:[\da-f]|[\da-f]{3}|[\da-f]{5})?$/i.test(e)||/^(transparent|black|white|red|green|blue|yellow|cyan|magenta|gray|grey|orange|purple|rebeccapurple)$/i.test(e))return!0;let t=/^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(([^()]*)\)$/i.exec(e);if(!t)return!1;let n=t[2].trim(),r=t[1].toLowerCase();if(r===`color`){let e=/^(srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65)\s+/i.exec(n);if(!e)return!1;n=n.slice(e[0].length)}if(n.includes(`,`)){if(![`rgb`,`rgba`,`hsl`,`hsla`].includes(r)||n.includes(`/`))return!1;let e=n.split(`,`).map(e=>e.trim());if(![3,4].includes(e.length)||r.startsWith(`rgb`)&&!e.slice(0,3).every(t=>S.test(t)===S.test(e[0])))return!1;n=e.slice(0,3).join(` `)+(e[3]===void 0?``:` / ${e[3]}`)}let i=n.split(`/`);if(i.length>2)return!1;let a=i[0].trim().split(/\s+/);if(a.length!==3)return!1;let o=e=>T(e,b)||T(e,S);return i[1]!==void 0&&!o(i[1].trim())?!1:a.every((e,t)=>(r.startsWith(`hsl`)||r===`hwb`?t===0:(r===`lch`||r===`oklch`)&&t===2)?T(e,b)||T(e,w):r.startsWith(`hsl`)||r===`hwb`?T(e,S):o(e))}function m(e,t){let n=t=>{throw new r(`invalid-property-registration`,`${e}: ${t}`)};/^--[a-zA-Z][a-zA-Z\d_-]*$/.test(e)||n(`use a public CSS custom property name.`),(!t||!v.has(t.syntax)||typeof t.inherits!=`boolean`)&&n(`supply a supported syntax and an explicit inherits boolean.`);let i=t.initialValue;if(i===void 0){t.syntax!==`*`&&n(`typed properties require an independent initialValue.`);return}(typeof i!=`string`||!i.trim()||/[{};\u0000-\u001f\\"'<>]|\/\*|\*\//.test(i))&&n(`initialValue must be a concrete CSS value without declaration syntax.`);let a=i.trim(),o=()=>a===`0`||T(a,x),s;switch(t.syntax){case`<number>`:s=T(a,b);break;case`<integer>`:s=/^[+-]?\d+$/.test(a)&&Number.isSafeInteger(Number(a));break;case`<length>`:s=o();break;case`<length-percentage>`:s=o()||T(a,S);break;case`<percentage>`:s=T(a,S);break;case`<angle>`:s=T(a,w);break;case`<time>`:s=T(a,C);break;case`<color>`:s=p(a);break;case`*`:s=T(a,b)||o()||T(a,S)||T(a,C)||T(a,w)||p(a)}s||n(`initialValue does not match ${t.syntax}, is context-dependent, or is outside the supported concrete-value grammar.`)}function h(e,t){if(!t||t.startsWith(`component.`))return;let n=(E??=l()).tokens[t];if(!n||n.cssName!==e)return;let r=n.type===`color`?`<color>`:n.type===`number`&&t!==`layout.prose-max`||n.type===`fontWeight`?`<number>`:n.type===`duration`?`<time>`:n.type===`dimension`&&T(n.cssValue,x)?`<length>`:void 0;if(!r)return;let i={syntax:r,inherits:!0,initialValue:n.cssValue};return m(e,i),i}function g(e,t={}){if(t.mode!==void 0&&![`compatible`,`typed`].includes(t.mode))throw new r(`invalid-property-registration`,`Unknown registration mode.`);let n=s(e),i=new Map(n.map(e=>[e.cssName,e])),a=t.definitions??{},o=new Set(t.names??i.keys());for(let e of Object.keys(a))o.add(e);let l=[],u=[];for(let e of[...o].sort()){let n=i.get(e),o=a[e];if(!n&&o===void 0)throw new r(`unknown-customization-property`,`Unknown CSS customization property ${e}. Supply an explicit definition for application-owned properties.`);if(o===!1){u.push({name:e,reason:`Explicitly excluded from registration.`});continue}if(o!==void 0){m(e,o),l.push({name:e,syntax:o.syntax,inherits:o.inherits,...o.initialValue===void 0?{}:{initialValue:o.initialValue},policy:`explicit`,reason:`Explicit application contract; initial/inheritance changes are intentional.`});continue}let s=t.mode===`typed`?h(e,n?.tokenId):void 0;s?l.push({name:e,...s,policy:`typed`,reason:`Opt-in typed semantic token with a stable canonical initial value.`}):l.push({name:e,syntax:`*`,inherits:n.inherits,policy:`compatible`,reason:t.mode===`typed`?`Preserves optional fallback, context-dependent values, configuration or compound CSS grammar; use an explicit definition to opt into different semantics.`:`Preserves inherited token streams and guaranteed-invalid initial values, including var() fallbacks.`})}return c({registrations:l,exclusions:u})}function _(e,t={}){return`/* En Rêve public custom property registrations. Load one policy per document. */
`+g(e,t).registrations.map(({name:e,syntax:t,inherits:n,initialValue:r})=>`@property ${e} {\n  syntax: "${t}";\n  inherits: ${n};${r===void 0?``:`\n  initial-value: ${r.trim()};`}\n}`).join(`
`)+`
`}var v,y,b,x,S,C,w,T,E;function D(){return(D=f((()=>{i(),u(),n(),v=new Set([`*`,`<color>`,`<number>`,`<integer>`,`<length>`,`<length-percentage>`,`<percentage>`,`<angle>`,`<time>`]),y=`[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?`,b=RegExp(`^${y}$`),x=RegExp(`^(${y})(px|cm|mm|q|in|pt|pc)$`,`i`),S=RegExp(`^(${y})%$`),C=RegExp(`^(${y})(ms|s)$`,`i`),w=RegExp(`^(${y})(deg|grad|rad|turn)$`,`i`),T=(e,t)=>{let n=t.exec(e);return!!n&&Number.isFinite(Number(n[1]??n[0]))}})))()}async function O(){let e=[`before`,`full`,`partial`,`local`];await Promise.all(e.map(e=>N(`boundary-${e}`).querySelector(`en-validation-summary`)?.updateComplete));for(let t of e){let e=N(`boundary-${t}`).querySelector(`en-validation-summary`)?.shadowRoot?.querySelector(`[part="base"]`);N(`radius-${t}`).textContent=e?getComputedStyle(e).borderTopLeftRadius:`Unavailable`}}function k(){let e=N(`boundary-appearance`).value===`dark`?`dark`:`light`,t=l({name:`customization-review`,mode:e,pins:{"radius.container":{value:8,unit:`px`}}}),n=l({name:`customization-page`,mode:e});F.textContent=a(n,{scope:`root`,colorScheme:!0})+[`before`,`full`,`local`].map(e=>a(t,{selector:`#boundary-${e}`,colorScheme:!0})).join(`
`)+a(t,{selector:`#boundary-partial`,kind:`partial`,tokenIds:[`radius.container`]})+`
#boundary-before { --en-validation-summary-radius: inherit; }`,O()}function A(){for(let e of[`compatible`,`typed`]){let t=getComputedStyle(N(`${e}-preview`));for(let n of[`level`,`tint`]){let r=t.getPropertyValue(`--en-demo-${e}-${n}`).trim();N(`${e}-${n}`).textContent=r||(n===`level`?`unset → fallback .25`:`unset → fallback #6553c0`)}}}function j(){let e=B?U===`invalid`?`Invalid input: compatible values stay untyped; typed values resolve to the registered initial values.`:U===`unset`?`Declarations removed: compatible samples use var() fallbacks; typed samples use registered initial values.`:`Valid ${U} values applied. Typed values ${V.matches?`update immediately because reduced motion is enabled`:`interpolate over 650ms`}.`:`This browser does not expose property registration. Both samples behave as unregistered custom properties.`;N(`registration-status`).textContent=e}function M(e){U=e;let t=H[e];for(let e of[`compatible`,`typed`]){let n=N(`${e}-preview`);for(let r of[`level`,`tint`]){let i=`--en-demo-${e}-${r}`;t?n.style.setProperty(i,t[r]):n.style.removeProperty(i)}}for(let t of document.querySelectorAll(`[data-property-state]`))t.setAttribute(`aria-pressed`,String(t.dataset.propertyState===e));cancelAnimationFrame(W);let n=performance.now()+(V.matches?0:750),r=()=>{A(),performance.now()<n&&(W=requestAnimationFrame(r))};r(),j()}var N,P,F,I,L,R,z,B,V,H,U,W;function G(){return(G=f((()=>{d(),D(),o(),u(),N=e=>{let t=document.getElementById(e);if(!t)throw Error(`Missing theme customization element: ${e}`);return t},P=(e,t)=>{N(e).textContent=t},F=document.createElement(`style`),F.dataset.themeCustomization=``,document.head.append(F),P(`boundary-source`,`import { emitThemeCSS, resolveTheme } from '@en-reve/tokens';

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
});`),P(`override-source`,`/* Ancestor customization, outside all four boundaries. */
.ancestor { --en-validation-summary-radius: 32px; }

/* Full output resets the hook; the component uses its fallback. */
#full { --en-validation-summary-radius: initial; }

/* The Before specimen intentionally recreates the former leak. */
#before { --en-validation-summary-radius: inherit; }

/* The application can still author a value on the component. */
#local en-validation-summary { --en-validation-summary-radius: 2px; }

/* The real component's shared style consumes the hook. */
border-radius: var(--en-validation-summary-radius, var(--en-radius-container));`),N(`ancestor-radius`).addEventListener(`input`,e=>{let t=`${e.currentTarget.value}px`;N(`boundary-specimens`).style.setProperty(`--en-validation-summary-radius`,t),N(`ancestor-radius-value`).textContent=t,O()}),N(`boundary-appearance`).addEventListener(`change`,k),k(),I=l(),L=_(I,{mode:`compatible`,names:[],definitions:{"--en-demo-compatible-level":{syntax:`*`,inherits:!0},"--en-demo-compatible-tint":{syntax:`*`,inherits:!0}}}),R=_(I,{mode:`typed`,names:[],definitions:{"--en-demo-typed-level":{syntax:`<number>`,inherits:!0,initialValue:`0.25`},"--en-demo-typed-tint":{syntax:`<color>`,inherits:!0,initialValue:`#6553c0`}}}),z=document.createElement(`style`),z.dataset.themeCustomizationRegistrations=``,z.textContent=L+`
`+R,document.head.append(z),P(`compatible-source`,L),P(`typed-source`,R+`

.preview {
  transition: --en-demo-typed-level 650ms ease,
              --en-demo-typed-tint 650ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .preview { transition: none; }
}`),P(`configuration-source`,`import {
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

// Inspect plan.registrations / plan.exclusions before emitting.`),B=typeof CSS<`u`&&`registerProperty`in CSS,V=matchMedia(`(prefers-reduced-motion: reduce)`),H={unset:void 0,calm:{level:`.25`,tint:`#6553c0`},bright:{level:`.85`,tint:`#b84672`},invalid:{level:`not-a-number`,tint:`not-a-color`}},U=`unset`,W=0;for(let e of document.querySelectorAll(`[data-property-state]`))e.addEventListener(`click`,()=>M(e.dataset.propertyState));if(V.addEventListener(`change`,j),M(`unset`),new URLSearchParams(location.search).has(`progress-report`)){N(`progress-return`).hidden=!1;for(let e of document.querySelectorAll(`a[data-preserve-report]`)){let t=new URL(e.href);t.searchParams.set(`progress-report`,``),e.href=t.href}}})))()}function K(){return(K=f((()=>{e(),t(),G()})))()}K();
//# sourceMappingURL=themeCustomization-BXr2IKWX.js.map