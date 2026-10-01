import {mkdir, writeFile, realpath} from 'node:fs/promises';
import {resolve, relative, isAbsolute, sep, join, dirname, basename} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {generateElements} from './generate-elements.ts';
import {generateTypeSnapshot} from './type-snapshot.ts';
import {captureTypeDependencyQueries} from './type-dependencies.ts';
import {verifyDefinitionEntries} from './definition-graph.ts';
import {assemblePublicGraph} from './public-graph.ts';
import {compilerResolution} from './compiler-api.mjs';
import {assertCandidateElementsRoot, candidateElementsRoot} from './candidate-workspace.ts';

/** Produce all inputs together without reading or replacing retained public metadata. */
export async function generateCandidatePublicArtifacts(packageRoot = candidateElementsRoot) {
  packageRoot = await assertCandidateElementsRoot(packageRoot);
  const generated = await generateElements(packageRoot);
  const captured = await captureTypeDependencyQueries(() => generateTypeSnapshot(packageRoot));
  const definitions = await verifyDefinitionEntries(packageRoot);
  const graph = await assemblePublicGraph(generated.manifest, generated.receipt, captured.result, definitions);
  return {manifest: generated.manifest, receipt: generated.receipt, types: captured.result, graph,
    compiler: captured.compiler, resolution: compilerResolution()};
}

/** Fresh candidate evidence bundle; no retained package artifact is read or replaced. */
export async function writeCandidatePublicArtifacts(output: string, packageRoot = fileURLToPath(new URL('../../packages/elements/',import.meta.url))) {
  output = resolve(output); packageRoot = resolve(packageRoot);
  const physicalPackage = await realpath(packageRoot);
  const physicalOutput = join(await realpath(dirname(output)), basename(output));
  const location = relative(physicalPackage, physicalOutput);
  if (!location || (!isAbsolute(location) && location !== '..' && !location.startsWith('..' + sep))) throw new Error('Candidate output must be outside the elements package.');
  await mkdir(output);
  const save = (name: string, value: unknown) => writeFile(join(output, name), JSON.stringify(value, null, 2) + '\n', {flag: 'wx'});
  const status = (value: unknown) => writeFile(join(output, 'status.json'), JSON.stringify(value, null, 2) + '\n');
  await save('status.json', {status: 'running', kind: 'unqualified-candidate-public-bundle'});
  try {
    const artifacts = await generateCandidatePublicArtifacts(packageRoot);
    await save('custom-elements.json', artifacts.manifest);
    await save('custom-elements.json.receipt.json', artifacts.receipt);
    await save('public-types.json', artifacts.types);
    await save('public-api.json', artifacts.graph);
    await save('compiler-queries.json', artifacts.compiler);
    await save('compiler-resolution.json', artifacts.resolution);
    await status({status: 'generated-unqualified', components: artifacts.graph.components.length, requiresBaselineComparison: true});
    return artifacts;
  } catch (error) {
    await status({status: 'failed', error: String(error)});
    throw error;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2] || process.argv.length > 4) throw new Error('Usage: node generate-candidate-public.ts <fresh-output-directory> [elements-package-root]');
  await writeCandidatePublicArtifacts(process.argv[2], process.argv[3]);
}
