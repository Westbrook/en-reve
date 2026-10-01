import { installReferenceTarget } from './vendor/src/core.js';
import { labels } from './vendor/src/adapters/labels.js';
import { probeReferenceTarget } from './vendor/src/detect.js';

const mode = new URL(location.href).searchParams.get('mode') ?? 'native';
const diagnostics = [];
const capabilities = probeReferenceTarget();
const adapter = () => labels({ activation: 'focus', naming: true });
const install = () => installReferenceTarget({
  adapters: [adapter()], force: mode === 'forced',
  onDiagnostic: diagnostic => diagnostics.push(diagnostic),
});
// Explicit application setup, before element definitions. 'forced' is a test
// comparison only; production must preserve the package's native routing.
let handle = mode === 'forced' || mode === 'automatic' ? install() : null;
await import('@en-reve/elements/define/text-field.js');
const face = document.querySelector('#face');
await face.updateComplete;
const plain = document.querySelector('#plain');
const root = plain.attachShadow({ mode: 'open', referenceTarget: 'control' });
root.innerHTML = '<input id="control"><input id="alternate" aria-label="Author alternate">';
// Test-fixture ownership only. This is not a public private-input getter or a
// production adapter; the FACE relationship is deliberately characterized.
if (capabilities.surface && mode !== 'forced') face.shadowRoot.referenceTarget = 'control';
handle?.hydrate(document);
window.referenceProbe = {
  mode, capabilities, diagnostics,
  get handle() { return handle; },
  lateInstall() { handle = installReferenceTarget({ adapters: [adapter()], force: true }); handle.hydrate(document); },
  refresh() { handle?.refresh(); },
  dispose() { handle?.dispose(); },
};
document.body.dataset.ready = 'true';
