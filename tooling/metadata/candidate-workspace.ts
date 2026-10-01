import {realpath, mkdir} from 'node:fs/promises';
import {resolve, relative, isAbsolute, sep, join, dirname, basename} from 'node:path';
import {fileURLToPath} from 'node:url';

export const candidateWorkspaceRoot = fileURLToPath(new URL('../../', import.meta.url));
export const candidateElementsRoot = join(candidateWorkspaceRoot, 'packages/elements');
/** Root-sensitive imports belong to this implementation checkout. Never mix workspaces. */
export async function assertCandidateWorkspace(workspaceRoot: string) {
  const actual = await realpath(resolve(workspaceRoot));
  if (actual !== await realpath(candidateWorkspaceRoot)) throw new Error('Candidate consumers require the implementation workspace.');
  return actual;
}
export async function assertCandidateElementsRoot(packageRoot: string) {
  const actual = await realpath(resolve(packageRoot));
  if (actual !== await realpath(candidateElementsRoot)) throw new Error('Candidate generation requires the implementation elements package.');
  return actual;
}
/** Reserve a new physical directory outside the complete implementation workspace. */
export async function reserveCandidateConsumerOutput(output: string, workspaceRoot = candidateWorkspaceRoot) {
  const workspace = await assertCandidateWorkspace(workspaceRoot);
  output = resolve(output);
  const physical = join(await realpath(dirname(output)), basename(output));
  const location = relative(workspace, physical);
  if (!location || (!isAbsolute(location) && location !== '..' && !location.startsWith('..' + sep))) throw new Error('Candidate consumer output must be outside the implementation workspace.');
  await mkdir(output);
  return output;
}
