import { installReferenceTarget } from './vendor/src/core.js';
import { labels } from './vendor/src/adapters/labels.js';
import { textNames } from './vendor/src/adapters/text-names.js';
import { probeReferenceTarget } from './vendor/src/detect.js';

const mode = new URL(location.href).searchParams.get('mode') ?? 'forced';
const capabilities = probeReferenceTarget();
const diagnostics = [];
// This is an explicit fixture-owned plain-text contract, never a generic scrape
// of an application's shadow content or a production fallback.
const install = () => installReferenceTarget({ force: true,
  adapters: [labels({ activation: 'focus', naming: true }), textNames({ getText: host => host.getAttribute('data-public-text') })],
  onDiagnostic: item => diagnostics.push({ code: item.code, message: item.message }),
});
let handle = mode === 'forced' ? install() : null;
const scope = document.querySelector('#fixture');
scope.innerHTML = `
<section><input id="native-described" aria-label="Native account" aria-describedby="native-help" aria-invalid="true" aria-errormessage="native-error"><span id="native-help">Native help</span><span id="native-error">Native error</span></section>
<section><input id="described" aria-label="Account" aria-describedby="hint" aria-invalid="true" aria-errormessage="error">
<probe-text id="hint" data-reference-target="nested" data-public-text="Nested help"></probe-text>
<probe-text id="error" data-reference-target="message" data-public-text="Account required"></probe-text></section>
<section><label id="nested-label" for="nested-field">Nested account</label><probe-label id="nested-field" data-reference-target="inner"></probe-label></section>
<section><input id="combo" role="combobox" aria-label="Project" aria-expanded="true" aria-controls="options" aria-activedescendant="option-host">
<div id="options" role="listbox"><probe-option id="option-host" data-reference-target="option"></probe-option></div></section>
<section><input id="ssr-described" aria-label="Pre-rendered account" aria-describedby="ssr-hint"><probe-text id="ssr-hint" data-reference-target="message" data-public-text="Pre-rendered help"></probe-text></section>`;
const shadow = (host, target, markup) => {
  const root = host.attachShadow({mode:'open',referenceTarget:target});root.innerHTML=markup;return root;
};
const hint = scope.querySelector('#hint');
const hintRoot = shadow(hint,'nested','<probe-text id="nested" data-reference-target="message"></probe-text>');
const nestedHint = hintRoot.querySelector('#nested');
const hintLeaf = shadow(nestedHint,'message','<span id="message">Nested help</span><span id="alternate">Alternate help</span>');
shadow(scope.querySelector('#error'),'message','<span id="message">Account required</span>');
const fieldRoot = shadow(scope.querySelector('#nested-field'),'inner','<probe-label id="inner" data-reference-target="control"></probe-label>');
const fieldLeaf = shadow(fieldRoot.querySelector('#inner'),'control','<input id="control"><input id="alternate">');
const optionRoot = shadow(scope.querySelector('#option-host'),'option','<span id="option" role="option" aria-selected="true">Alpha project</span><span id="alternate" role="option">Beta project</span>');
// parseHTMLUnsafe exercises actual declarative-root parsing before optional late
// adapter hydration. The owned-field suite separately qualifies En Reve SSR.
const prerendered = document.createElement('template');
prerendered.innerHTML = '<probe-text id="ssr-hint" data-reference-target="message" data-public-text="Pre-rendered help"><template shadowrootmode="open" shadowrootreferencetarget="message"><span id="message">Pre-rendered help</span></template></probe-text>';
const parsed = Document.parseHTMLUnsafe(prerendered.innerHTML);
scope.querySelector('#ssr-hint').replaceWith(document.adoptNode(parsed.querySelector('probe-text')));
if (handle) handle.hydrate(document);
window.ariaReferenceProbe = { mode,capabilities,diagnostics,hintLeaf,fieldLeaf,optionRoot,
  get handle(){return handle;},
  lateInstall(){ handle=install();handle.hydrate(document);},
  refresh(){handle?.refresh();},dispose(){handle?.dispose();},
};
document.body.dataset.ready='true';
