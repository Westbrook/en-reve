// Investigation only. Mirrors scoped-worker.ts setup; never reused for a second render.
import {parentPort, workerData} from 'node:worker_threads';
import {performance} from 'node:perf_hooks';
const now = () => performance.timeOrigin + performance.now();
const enteredAt = now(), stages = {};
async function stage(name, operation) {
  const start = now(), result = await operation();
  stages[name] = now() - start;
  return result;
}
try {
  await stage('installMs', () => import('@en-reve/ssr/install.js'));
  const {collectDefinitions, registerDefinitions} = await stage('registrationImportMs', () => import('@en-reve/primitives/interactions/registration.js'));
  const {renderToString} = await stage('ssrImportMs', () => import('@en-reve/ssr'));
  const entry = await stage('applicationImportMs', () => import(workerData.module));
  if (entry.version !== workerData.version || typeof entry.template !== 'function' || !Array.isArray(entry.definitions)) throw Error('Invalid module contract');
  const tags = await stage('definitionsMs', () => {
    const definitions = collectDefinitions(entry.definitions);
    registerDefinitions(customElements, definitions);
    return definitions.map(d => d.tagName);
  });
  const preparedAt = now();
  async function render(snapshot) {
    try {
      const receivedAt = now();
      const template = await stage('templateMs', () => entry.template(snapshot));
      const html = await stage('renderMs', () => renderToString(template));
      parentPort.postMessage({type:'result', html, tags, stages, enteredAt, preparedAt, receivedAt, sentAt:now()});
      parentPort.close();
    } catch (error) { parentPort.postMessage({type:'error', error:String(error)}); parentPort.close(); }
  }
  if (workerData.prewarm) {
    parentPort.once('message', ({snapshot}) => { void render(snapshot); });
    parentPort.postMessage({type:'ready', enteredAt, preparedAt});
  } else await render(workerData.snapshot);
} catch (error) { parentPort.postMessage({type:'error', error:String(error)}); parentPort.close(); }
