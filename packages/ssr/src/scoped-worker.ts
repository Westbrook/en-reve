import {assertDeliveryIdentity} from '@en-reve/elements/delivery.js';
import {snapshotDeliveryIdentity} from './delivery-identity.js';
import { parentPort, workerData } from 'node:worker_threads';
import type { ScopedRenderModule } from './scoped.js';

try {
  await import('./install.js');
  const { collectDefinitions, registerDefinitions } = await import('@en-reve/primitives/interactions/registration.js');
  const { renderToString } = await import('./index.js');
  const entry: ScopedRenderModule = await import(workerData.module);
  if (entry.version !== workerData.version || typeof entry.template !== 'function' || !Array.isArray(entry.definitions)) throw new Error('Scoped render module does not match its allowlisted version/contract.');
  const delivery = snapshotDeliveryIdentity(entry.delivery);
  assertDeliveryIdentity(workerData.delivery, delivery);
  const definitions = collectDefinitions(entry.definitions);
  registerDefinitions(customElements, definitions);
  const html = await renderToString(await entry.template(workerData.snapshot));
  parentPort!.postMessage({ result: { html, key: workerData.key, version: entry.version, tags: definitions.map(definition => definition.tagName), ...(delivery ? {delivery} : {}) } });
} catch (error) { parentPort!.postMessage({ error: String(error) }); }
