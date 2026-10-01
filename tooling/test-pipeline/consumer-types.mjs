import { globSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const files = [...globSync('probes/*/consumer.types.ts'), 'tooling/css-authoring/consumer.types.ts'];
const result = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '--ignoreConfig', '--strict', '--noEmit', '--skipLibCheck', '--target', 'ES2022', '--module', 'NodeNext', ...files], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
