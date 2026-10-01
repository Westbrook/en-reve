import { readFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { compile } from './compiler.mjs';

async function snapshot(root) {
  const { definitions } = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
  if (!Array.isArray(definitions) || !definitions.length) throw new Error('An explicit nonempty definition manifest is required');
  return Promise.all(definitions.map(async name => {
    const path = resolve(root, name), local = relative(root, path);
    if (local === '..' || local.startsWith(`..${sep}`) || !name.endsWith('.css')) throw new Error('Definition paths must be CSS files within the pilot directory');
    return { filename: name, css: await readFile(path, 'utf8') };
  }));
}
export async function rebuild(root, consumer, engine) {
  return compile(await snapshot(root), consumer, engine);
}
// Portable bounded watcher: polls this small explicit manifest, not the project.
// Full content snapshots catch add/remove/atomic-save changes without platform
// filesystem-event ordering. This is deliberately not a Vite/HMR integration.
export function watchDefinitions(root, consumer, engine, onResult) {
  let closed = false, active = false, previous, inFlight = Promise.resolve();
  const tick = () => {
    if (closed || active) return;
    active = true;
    inFlight = (async()=>{
      try {
        const inputs = await snapshot(root), key = JSON.stringify(inputs);
        if (closed || key === previous) return;
        previous = key;
        try { onResult({ok:true,result:compile(inputs,consumer,engine)}); }
        catch(error) { onResult({ok:false,error:error.message}); }
      } catch(error) {
        const key='error:'+error.message;
        if (!closed && key !== previous) {previous=key;onResult({ok:false,error:error.message});}
      } finally {active=false;}
    })();
  };
  const interval = setInterval(tick,100);
  tick();
  return async()=>{closed=true;clearInterval(interval);await inFlight;};
}
