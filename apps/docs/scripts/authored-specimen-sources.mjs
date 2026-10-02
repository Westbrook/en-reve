import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { specimenSources } from './specimen-sources.mjs';

const specimenFiles = [
  'examples.ts', 'token-copy.ts', 'virtual-collection-demo.ts', 'file-upload-demo.ts',
  'tree-data-demo.ts', 'calendar-demo.ts', 'multi-step-demo.ts', 'toast-demo.ts',
  'chat-patterns-demo.ts', 'composable-chat-demo.definition.ts',
  'presence-activity-demo.ts', 'carousel-demo.ts', 'rich-text-demo.ts',
];
const helperFiles = [
  'change-consumption.ts', 'color-spaces-demo.ts', 'editor-color-extension.ts', 'inverse-theme.ts',
];

/** Both docs producers assemble the same complete authored modules without evaluating them. */
export async function readAuthoredSpecimens(docsRoot) {
  const [sources, helpers] = await Promise.all([
    Promise.all(specimenFiles.map(name => readFile(resolve(docsRoot, 'src', name), 'utf8'))),
    Promise.all(helperFiles.map(async name => [
      './' + name.replace(/\.ts$/u, '.js'), await readFile(resolve(docsRoot, 'src', name), 'utf8'),
    ])),
  ]);
  return { authoredSource: sources[0], sources: specimenSources(...sources, Object.fromEntries(helpers)) };
}
