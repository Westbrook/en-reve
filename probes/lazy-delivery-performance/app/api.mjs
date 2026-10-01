import {createElementScope} from '@en-reve/elements/element-scope.js';
import {createDefinitionLoader} from '@en-reve/elements/lazy-loader.js';
import {loaders} from './selected.mjs';
import {errors, snapshot, settle, install} from './metrics.mjs';
const requestedMode = new URLSearchParams(location.search).get('mode') ?? 'global';
const scope = createElementScope({document, registry: requestedMode === 'global' ? 'global' : 'auto'});
const loader = createDefinitionLoader(scope.registry, loaders), fields = document.querySelector('#fields');
let action = null, component = null;
async function activate() {
  const start = performance.now(), before = snapshot(component), registered = scope.get('en-button');
  const loadStart = performance.now(); await loader.load(['en-button']); const loadMs = performance.now() - loadStart;
  if (scope.get('en-button') !== registered || snapshot(component).nodes !== before.nodes) throw new Error('load() registered or constructed UI');
  const ensureStart = performance.now(); await loader.ensure(['en-button']); const ensureMs = performance.now() - ensureStart;
  if (!scope.get('en-button')) throw new Error('ensure() did not register the requested definition');
  component ??= scope.createElement('en-button'); component.textContent = 'Optional command'; fields.append(component); await settle(component);
  return {start, loadMs, ensureMs, firstReadyMs: performance.now() - start, focusInside: null, open: null};
}
document.querySelector('#trigger').addEventListener('click', () => { action = activate(); action.catch(e => errors.push(String(e))); });
const startup = snapshot(component), shellReadyMs = performance.now();
install({family: 'api', policy: __POLICY__, requestedMode, actualMode: scope.mode, startup, shellReadyMs, errors, triggerSelector: '#trigger',
  snapshot: () => snapshot(component), get action() { return action; }, preparation: null,
  async close() {}, async cycle() { await loader.ensure(['en-button']); const item = scope.createElement('en-button'); item.textContent = 'Optional command'; fields.append(item); await settle(item); item.remove(); },
});
