import { readFile, mkdir, open, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, delimiter } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { contentInventory, inventoryDigest, atomicJSON, immutable } from '../../../tooling/evidence/setup.mjs';
import { createRequire } from 'node:module';
import { setupEnvironment, setupEnvironmentInputs } from '../../../tooling/evidence/setup-environment.mjs';
import { stylesheetAssets } from './prepare-docs-producer.mjs';
export { stylesheetAssets };

const root = fileURLToPath(new URL('../../../', import.meta.url));
const cache = resolve(process.env.EN_DOCS_PREPARATION_CACHE ?? resolve(root, 'node_modules/.cache/docs-preparation'));
const receiptPath = resolve(cache, 'receipt.json');
const outputs = ['apps/docs/src/generated', 'apps/docs/public/reviews', 'apps/docs/public/guides', 'apps/docs/public/styles',
  'apps/docs/api-examples', 'apps/docs/api-examples.html', 'apps/docs/workflows/settings',
  ...['custom-elements.json', 'custom-elements.json.receipt.json', 'public-api.json', 'public-types.json'].map(name => `apps/docs/public/${name}`)];
const roots = ['skills', 'packages', 'apps/docs', 'tooling', 'plans', 'probes/framework-consumption/README.md', 'package.json', 'package-lock.json', 'tsconfig.base.json', 'node_modules'];
const ignored = name => outputs.some(output => name === output || name.startsWith(output + '/')) ||
  /(^|\/)(\.git|\.cache|\.vite|\.vite-temp|artifacts|results|test-results|playwright-report)(\/|$)/.test(name) || name.endsWith('.tsbuildinfo');
function producerEnvironment() { return setupEnvironment(); }

export async function preparationInputs() {
  const files = await contentInventory(root, [...roots, process.execPath], ignored);
  return { files, runtime: process.version, platform: process.platform, arch: process.arch,
    environment: Object.fromEntries(Object.entries(setupEnvironmentInputs(producerEnvironment())).filter(([key]) => !key.startsWith('npm_') && !['SHLVL', '_', 'PWD', 'OLDPWD', 'INIT_CWD'].includes(key)).map(([key, value]) => [key, inventoryDigest(value)])) };
}

function validResult(result) {
  return result && typeof result === 'object' && !Array.isArray(result)
    && ['settingsScenarioPages','apiExamplePages','stylesheets'].every(key => Array.isArray(result[key]))
    && ['specimens','workflows','changedFiles'].every(key => Number.isInteger(result[key]) && result[key] >= 0);
}

async function ensure() {
  const started = performance.now();
  const inputs = await preparationInputs(), inputDigest = inventoryDigest(inputs);
  try {
    const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
    if (receipt.inputs && receipt.inputDigest !== inputDigest) {
      const changed = Object.keys({ ...receipt.inputs.files, ...inputs.files }).filter(key => inventoryDigest(receipt.inputs.files[key] ?? null) !== inventoryDigest(inputs.files[key] ?? null));
      const environment = Object.keys({ ...receipt.inputs.environment, ...inputs.environment }).filter(key => receipt.inputs.environment[key] !== inputs.environment[key]);
      console.error(`Docs preparation invalidated: ${JSON.stringify({ files: changed.slice(0, 12), environment })}`);
    }
    const { integrity, ...envelope } = receipt;
    if (process.env.EN_SETUP_CACHE !== 'off' && receipt.schemaVersion === 2 && receipt.inputDigest === inputDigest &&
      typeof receipt.originatingRun === 'string' && Number.isFinite(Date.parse(receipt.originatingRun)) &&
      Number.isFinite(receipt.producerMs) && receipt.producerMs >= 0 && validResult(receipt.result) &&
      integrity === inventoryDigest(envelope) &&
      inventoryDigest(await contentInventory(root, outputs)) === inventoryDigest(receipt.outputs)) {
      console.error(`Docs preparation: verified reuse (${(performance.now()-started).toFixed(0)}ms); producer ${receipt.originatingRun}; input ${inputDigest}`);
      return immutable(structuredClone(receipt.result));
    }
  } catch (error) { if (!['ENOENT', undefined].includes(error.code)) throw error; }
  await mkdir(cache, { recursive: true });
  // A second producer must not overwrite outputs beneath a consuming build.
  const lockPath = resolve(cache, 'producer.lock');
  let lock;
  try { lock = await open(lockPath, 'wx'); }
  catch (error) { throw new Error('Docs preparation already owned by another process; serialize builds (remove a stale producer.lock only after verifying its owner is gone).', { cause: error }); }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
    // Fresh process ensures watch changes cannot reuse stale imported generator/token modules.
    const { stdout, stderr } = await promisify(execFile)(process.execPath, [resolve(root, 'apps/docs/scripts/prepare-docs-producer.mjs')], { cwd: root, env: producerEnvironment(), maxBuffer: 16*1024*1024 });
    if (stderr) process.stderr.write(stderr);
    const result = JSON.parse(stdout.trim().split('\n').at(-1));
    if (!validResult(result)) throw new Error('Docs producer returned an incomplete preparation result; no receipt published.');
    if (inputDigest !== inventoryDigest(await preparationInputs())) throw Object.assign(new Error('Docs inputs changed during preparation; no reusable receipt published.'), { code: 'EN_DOCS_INPUT_CHANGED' });
    const outputFiles = await contentInventory(root, outputs);
    const payload = { schemaVersion: 2, inputs, inputDigest, outputs: outputFiles, result, originatingRun: new Date().toISOString(), producerMs: performance.now()-started };
    if (process.env.EN_SETUP_CACHE !== 'off') await atomicJSON(receiptPath, { ...payload, integrity: inventoryDigest(payload) });
    console.error(`Docs preparation: produced (${(performance.now()-started).toFixed(0)}ms)`);
    return immutable(result);
  } finally { await lock.close(); await rm(lockPath, { force: true }); }
}
let pending;
export function prepareDocs() {
  if (!pending) pending = ensure().finally(() => { pending = undefined; });
  return pending;
}
export function prepareDocsPlugin() {
  let closeInputs;
  return {
    async closeBundle() { await closeInputs?.(); },
    name: 'en-reve-prepare-docs',
    config(config) {
      if (config.server?.watch === null) return;
      return { server: { watch: { useFsEvents: false } } };
    },
    async buildStart() { await prepareDocs(); },
    async configureServer(server) {
      if (server.config.server.watch === null) return;
      const cssFiles = stylesheetAssets.map(asset => createRequire(import.meta.url).resolve(asset.specifier));
      const sourceRoots = [...roots.filter(path => path !== 'node_modules').map(path => resolve(root, path)), ...cssFiles];
      // A fresh owner gives us a meaningful ready event for these extra input roots.
      // Adding roots to Vite's already-ready watcher cannot provide that barrier.
      const Watcher = server.watcher.constructor;
      if (Watcher.name !== 'FSWatcher') throw new Error('Unsupported Vite input watcher; requalify docs watch preparation.');
      const sourceWatcher = new Watcher({ ...server.watcher.options, ignoreInitial: true, useFsEvents: false,
        ignored: path => {
          const name = path.slice(root.length).replace(/^\//, '');
          if (cssFiles.some(file => file === path || file.startsWith(path + '/'))) return false;
          return /(^|\/)node_modules(\/|$)/.test(name) || ignored(name);
        },
      });
      let initialized = false, requested = false, running;
      async function regenerate() {
        for (let attempt = 0; ; attempt++) {
          try { return await prepareDocs(); }
          catch (error) { if (error.code !== 'EN_DOCS_INPUT_CHANGED' || attempt >= 2) throw error; }
        }
      }
      function schedule() {
        requested = true;
        if (!initialized || running) return;
        running = (async () => {
          while (requested) { requested = false; await regenerate(); }
        })().catch(error => server.config.logger.error(error.stack)).finally(() => {
          running = undefined;
          if (requested) schedule();
        });
      }
      sourceWatcher.on('all', (event, path) => {
        const name = path.slice(root.length).replace(/^\//, '');
        if (['add', 'change', 'unlink', 'addDir', 'unlinkDir'].includes(event) && !ignored(name)) schedule();
      });
      closeInputs = async () => { await sourceWatcher.close(); await running; };
      sourceWatcher.on('error', error => server.config.logger.error(error.stack));
      try {
        await new Promise((yes, no) => {
          const timeout = setTimeout(() => no(new Error('Docs input watcher did not become ready')), 30000);
          sourceWatcher.once('ready', () => { clearTimeout(timeout); yes(); });
          sourceWatcher.once('error', error => { clearTimeout(timeout); no(error); });
          sourceWatcher.add(sourceRoots);
        });
        // Reconcile edits made while the initial scan was registering paths.
        await regenerate();
        initialized = true;
        if (requested) schedule();
      } catch (error) { await sourceWatcher.close(); throw error; }
    },
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { apiExamplePages, settingsScenarioPages, ...summary } = await prepareDocs();
  console.log(JSON.stringify({ ...summary, apiExamples: apiExamplePages.length, settingsScenarios: settingsScenarioPages.length }));
}
