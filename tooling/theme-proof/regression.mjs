import {spawn} from 'node:child_process';
import {mkdir, readdir, writeFile, readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--skip-build')) throw new Error('Usage: npm run test:theme -- [--skip-build]');
const output = resolve(process.env.EN_THEME_TEST_OUTPUT_DIR ?? resolve(root, 'node_modules/.cache/theme-regression'));
await mkdir(output, {recursive:true});
const env = {...process.env,
  PROPERTY_TEST_OUTPUT_DIR: resolve(output, 'properties'), SCOPE_TEST_OUTPUT_DIR: resolve(output, 'scopes'),
  EN_THEME_CASCADE_OUTPUT_DIR: resolve(output, 'cascade'), EN_STATE_PAINT_OUTPUT_DIR: resolve(output, 'states'),
  EN_COMPOSITION_OUTPUT_DIR: resolve(output, 'composition'), EN_WORKFLOW_TEST_OUTPUT_DIR: resolve(output, 'docs'),
  EN_THEME_REFRESH_OUTPUT_DIR: resolve(output, 'candidates'),
  EN_API_CONTRACTS_TEST_OUTPUT_DIR: resolve(output, 'api-parts'),
  EN_WORKFLOW_TEST_PORT: process.env.EN_WORKFLOW_TEST_PORT ?? '4596',
};
const results = [];
const commandStarted = performance.now();
async function run(id, command, arguments_) {
  console.log(`\nTheme regression: ${id}`);
  const startedAt = new Date().toISOString();
  const monotonicStart = performance.now();
  let log = '';
  const child = spawn(command, arguments_, {cwd:root, env, stdio:['ignore','pipe','pipe']});
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {log += chunk; process.stdout.write(chunk);});
  const exitCode = await new Promise((resolve, reject) => {child.once('error', reject);child.once('exit', (code, signal) => resolve(code ?? `signal:${signal}`));});
  await writeFile(resolve(output, `${id}.log`), log);
  results.push({id, command, args:arguments_, startedAt, finishedAt:new Date().toISOString(), wallMs:performance.now()-monotonicStart, exitCode});
  await writeFile(resolve(output, 'results.json'), JSON.stringify({build:args.includes('--skip-build') ? 'caller-supplied' : 'included', wallMs:performance.now()-commandStarted, results}, null, 2)+'\n');
  if (exitCode !== 0) throw new Error(`${id} failed (${exitCode}); see ${output}/${id}.log`);
}
const node = process.execPath;
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
if (!args.includes('--skip-build')) await run('build', npm, ['run','build']);
await run('customization', node, ['tooling/customization/verify.mjs','--check']);
const tokenTests = (await readdir(resolve(root,'packages/tokens/test'))).filter(name => name.endsWith('.test.mjs')).sort().map(name => `packages/tokens/test/${name}`);
await run('unit', node, ['--test', '--test-concurrency=3', ...tokenTests, 'tooling/customization/customization.test.mjs', 'tooling/metadata/metadata.test.ts', 'tooling/css-authoring/compiler.test.mjs', 'tooling/theme-proof/themes.test.mjs', ...['1', '2', '3'].map(group => `tooling/theme-candidates/catalogue-group-${group}.test.mjs`)]);
await run('candidate-contrast', node, ['tooling/theme-candidates/originals/verify.mjs']);
await run('properties', node, ['packages/tokens/test/property-browser/probe.mjs']);
await run('scopes', node, ['packages/tokens/test/scope-browser/probe.mjs']);
for (const [name, config] of [
  ['cascade','packages/styles/tests/theme-cascade/playwright.config.ts'],
  ['states','packages/styles/tests/state-paint/playwright.config.ts'],
  ['catalog-parts','probes/api-contracts/playwright.config.ts'],
  ['composition','packages/styles/tests/composition/playwright.config.ts'],
  ['docs','apps/docs/tests/theme-regression.config.ts'],
  ['candidates','apps/docs/tests/theme-refresh.config.ts'],
]) await run(name, node, ['node_modules/@playwright/test/cli.js','test','--config',config]);
const docs = JSON.parse(await readFile(resolve(output,'docs/playwright.json'),'utf8'));
console.log(`Theme regression passed. Docs: ${docs.stats.expected} passed, ${docs.stats.skipped} documented skips. Evidence: ${output}`);
