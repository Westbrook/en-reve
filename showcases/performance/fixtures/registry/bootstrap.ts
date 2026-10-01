// Install before the dynamic import evaluates Lit or any element classes.
import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import type {Config} from './runtime.js';
const config = JSON.parse(document.querySelector('#config')!.textContent!) as Config;
performance.mark('registry:bootstrap');
let runtime: Awaited<ReturnType<typeof import('./runtime.js')['prepare']>>;
let pending: Promise<typeof runtime> | undefined;
const status = document.querySelector<HTMLElement>('#status')!;
async function load() {
  return pending ??= (async () => {
    performance.mark('registry:load-requested');
    const module = await import('./runtime.js'); performance.mark('registry:modules-ready');
    runtime = await module.prepare(config); performance.mark('registry:prepared');
    performance.measure('registry:module-load', 'registry:load-requested', 'registry:modules-ready');
    if (runtime.unsupported) status.textContent = 'Native scoped registries are unavailable in this browser.';
    else status.textContent = 'Prepared. Activate a workflow to use it.';
    return runtime;
  })();
}
async function activate(id = 0) {
  const start = performance.now(); performance.mark('registry:action-requested');
  const result = await load(); if (result.unsupported) return {unsupported:true, capability:result.capability};
  await result.activate(id); performance.mark('registry:action-ready');
  performance.measure('registry:request-to-ready', 'registry:action-requested', 'registry:action-ready');
  status.textContent = 'Workflow ready.'; return {requested:start, ready:performance.now()};
}
(window as unknown as {registryBench: unknown}).registryBench = {load, activate, get runtime() {return runtime;}, config};
document.querySelector('#activate')!.addEventListener('click', () => void activate().catch(error => {status.textContent = `Activation failed: ${error.message}`;}));
if (new URL(location.href).searchParams.has('progress-report')) {
  const link = document.createElement('a'); link.href = 'http://127.0.0.1:4177'; link.textContent = 'Progress Report'; link.style.cssText = 'position:fixed;bottom:1rem;right:1rem;padding:.7rem;background:white;border:1px solid'; document.body.append(link);
}
