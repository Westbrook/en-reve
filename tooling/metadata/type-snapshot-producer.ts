import { generateTypeSnapshot } from './type-snapshot.ts';
import { captureTypeDependencyQueries } from './type-dependencies.ts';
import { resolve } from 'node:path';
const directory = process.argv[2];
if (!directory) throw new Error('Snapshot producer requires an explicit package directory');
const captured = await captureTypeDependencyQueries(() => generateTypeSnapshot(resolve(directory)));
if (captured.result.gaps.length) throw new Error('Type snapshot has unresolved contracts: ' + captured.result.gaps.join('\n'));
process.stdout.write(JSON.stringify(captured) + '\n');
