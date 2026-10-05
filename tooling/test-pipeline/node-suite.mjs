import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
async function discover(directory) {
  const entries = await readdir(new URL(directory, `file://${root}`), { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? discover(`${directory}/${entry.name}`) : /\.test\.[cm]?ts$|\.test\.mjs$/.test(entry.name) ? [`${directory}/${entry.name}`] : []))).flat();
}
const files = [...await discover('packages/elements/src'), 'apps/docs/tests/api-reference-model.test.ts', 'apps/docs/tests/document-theme-ownership.test.ts', 'apps/docs/tests/api-reference-generator.test.mjs', 'apps/docs/tests/specimen-source-assembly.test.mjs', 'apps/docs/tests/web-app.test.mjs', 'packages/primitives/tests/token-document.test.ts', 'tooling/theme-candidates/asset-selection.test.mjs'];
const result = spawnSync(process.execPath, ['--test', ...files.sort()], { cwd: root, stdio: 'inherit' });
process.exitCode = result.status ?? 1;
