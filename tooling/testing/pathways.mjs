import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = fileURLToPath(new URL('../../', import.meta.url));
const node = process.execPath;
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const browser = config => [node, 'node_modules/@playwright/test/cli.js', 'test', '--config', config];
/** Source-level cases are never merged across configurations or engines. Only identical task IDs share producers. */
export async function publicGraph({workspaceRoot=root}={}) {
  const tasks = new Map();
  const add = (id, command, dependencies = ['build'], extra = {}) => { if (tasks.has(id)) return id; tasks.set(id, { id, command, dependencies, ...extra }); return id; };
  for (const [name, dependencies] of [['tokens', []], ['styles', ['tokens']], ['primitives', []], ['elements', ['styles','primitives']]]) {
    add(`build:${name}`, [npm, 'run', 'build', '-w', `@en-reve/${name}`], dependencies.map(name => `build:${name}`), {kind:'producer',priority:15});
  }
  add('metadata:lazy',[],['build:elements'],{kind:'barrier',scope:'Lazy metadata generated once by the elements build before declaration emit'});
  let prior='metadata:lazy';
  for(const [name,command] of [
    ['cem',[node,'tooling/metadata/generate-elements.ts']],
    ['types',[npm,'run','metadata:types']],
    ['api',[npm,'run','metadata:api']],
    ['customization',[npm,'run','customization']],
  ]) prior=add(`metadata:${name}`,command,[prior],{kind:'producer'});
  add('metadata',[],[prior],{kind:'barrier',scope:'Exact ordered stages from the root metadata script'});
  add('build:ssr', [npm, 'run', 'build', '-w', '@en-reve/ssr'], ['build:elements'], {kind:'producer',priority:15});
  add('build:docs-sources', [npm, 'run', 'prepare:docs', '-w', '@en-reve/docs'], ['metadata','build:ssr'], {kind:'producer'});
  add('build:docs', [npm, 'run', 'build', '--ignore-scripts', '-w', '@en-reve/docs'], ['build:docs-sources'], {kind:'producer',scope:'Explicit docs preparation owns the prebuild lifecycle once; SSR/Vite retain verified input checks'});
  add('build', [], ['build:docs'], {kind:'barrier', scope:'Equivalent ordered stages from the root build script'});
  const unit = (file, dependencies = ['build']) => add(`node:${file}`, [node, '--test', '--test-reporter=tap', file], dependencies, { kind: 'node', assertionSources: [file] });
  const pw = (config, dependencies = ['build']) => add(`browser:${config}`, browser(config), dependencies, { kind: 'browser', config });
  const check = (id, file, args = [], kind = 'check') => add(id, [node, file, ...args], ['build'], {kind,assertionSources:[file]});
  const tooling = ['tooling/visual-review/reader.test.mjs', 'tooling/visual-review/plan.test.mjs', 'tooling/evidence/impact-client.test.mjs', 'tooling/evidence/impact.test.mjs', 'tooling/releases/review-package.test.mjs', 'tooling/offline-review/offline-review.test.mjs', 'tooling/testing/support-ledger.test.mjs', 'tooling/releases/releases.test.ts', 'tooling/releases/source-identity.test.mjs', 'tooling/evidence/evidence.test.ts', 'tooling/metadata/metadata.test.ts', 'tooling/metadata/definition-graph.test.ts', 'tooling/metadata/delivery-inventory-validation.test.ts', 'tooling/metadata/type-snapshot.test.ts', 'tooling/customization/customization.test.mjs', 'tooling/metadata/public-contract.test.ts', 'tooling/browser/popup-measurement.test.ts'];
  const api = [add('check-api', [node,'tooling/metadata/public-graph.ts','--check'], [], {kind:'check',failurePolicy:'Run before any standalone API assertions; never silently repair stale metadata first.'}), ...tooling.map(file=>unit(file,[])), ...['api-contracts', 'api-events', 'api-transactions'].map(name => pw(`probes/${name}/playwright.config.ts`,[]))];
  const customization = check('customization', 'tooling/customization/verify.mjs', ['--check']);
  const release = ['build', ...api, ...['packages/primitives/tests/events.test.mjs', 'packages/primitives/tests/token-document.test.ts', 'probes/api-forms/metadata.test.mjs'].map(file=>unit(file)), customization, pw('packages/elements/src/internal/tests/playwright.config.ts'), pw('packages/elements/src/commands/tests/playwright.config.ts')];
  const tokenFiles = (await readdir(resolve(workspaceRoot, 'packages/tokens/test'))).filter(name => name.endsWith('.test.mjs')).sort().map(name => `packages/tokens/test/${name}`);
  const theme = ['build', customization, ...[...tokenFiles, 'tooling/customization/customization.test.mjs', 'tooling/metadata/metadata.test.ts', 'tooling/css-authoring/compiler.test.mjs', 'tooling/theme-proof/themes.test.mjs', ...[1,2,3].map(group => `tooling/theme-candidates/catalogue-group-${group}.test.mjs`)].map(file=>unit(file)),
    check('candidate-contrast', 'tooling/theme-candidates/originals/verify.mjs'), check('properties','packages/tokens/test/property-browser/probe.mjs',[],'custom-browser'), check('scopes','packages/tokens/test/scope-browser/probe.mjs',[],'custom-browser'),
    ...['packages/styles/tests/theme-cascade/playwright.config.ts', 'packages/styles/tests/state-paint/playwright.config.ts', 'probes/api-contracts/playwright.config.ts', 'packages/styles/tests/composition/playwright.config.ts', 'apps/docs/tests/theme-regression.config.ts', 'apps/docs/tests/theme-refresh.config.ts'].map(config=>pw(config))];
  const attestation = add('attestation:release', [], release, {kind:'release-attestation'});
  return { schemaVersion:1, tasks:[...tasks.values()], pathways:{api,release:[...release,attestation],theme}, completeness:'named API/release/theme union only; use the workload inventory for remaining required families', completedResultReuse:false };
}
export function selectTasks(graph, pathways) {
  const tasks=new Map(graph.tasks.map(task=>[task.id,task]));const selected=new Set(),visiting=new Set(),ordered=[];
  function visit(id) {
    if(selected.has(id)) return;
    if(visiting.has(id)) throw new Error(`Execution dependency cycle: ${id}`);
    const task=tasks.get(id);if(!task) throw new Error(`Unknown execution dependency: ${id}`);
    visiting.add(id);task.dependencies.forEach(visit);visiting.delete(id);selected.add(id);ordered.push(task);
  }
  for(const pathway of pathways) { if(!graph.pathways[pathway]) throw new Error(`Unknown pathway: ${pathway}`);graph.pathways[pathway].forEach(visit); }
  return ordered;
}
