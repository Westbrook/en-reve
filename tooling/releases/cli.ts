import {digestJson} from '../evidence/identity.ts';
import {diffPublicGraph} from './graph-diff.ts';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { diffCem } from './cem-diff.ts';
import { diffPublicApi } from './type-diff.ts';
import { createRelease, changelog } from './release.ts';

export const help = `Usage:
  node tooling/releases/cli.ts graph <before-cem.json> <after-cem.json> <before-public-api.json> <after-public-api.json>
  node tooling/releases/cli.ts diff <before-cem.json> <after-cem.json> [--types <before-types.json> <after-types.json> | --cem-only]
  node tooling/releases/cli.ts draft <changes.json> <before-cem.json> <after-cem.json> <output-directory> [--types <before-types.json> <after-types.json> | --cem-only]

diff prints structured public-API facts. draft creates release.json and CHANGELOG.md
in a new output directory (never overwrites an existing review packet).
The schemaVersion is a format version; baseVersion/proposedVersion identify the
coordinated package release. Type/behavior changes require authored classifications.
By default, each CEM must have a sibling public-types.json. --types selects exact
snapshot files. Matching sibling public-api.json files add registration, support and event-behavior review; --cem-only explicitly requests limited CEM coverage.
No command publishes packages, approves a change, or adopts a visual baseline.
`;

async function json(file: string) { return JSON.parse(await readFile(file, 'utf8')); }

export async function main(args: string[]): Promise<void> {
  if (!args.length || args.includes('--help')) { process.stdout.write(help); return; }
  const flags = args.findIndex(arg => arg.startsWith('--'));
  const positional = flags < 0 ? args : args.slice(0, flags);
  const options = flags < 0 ? [] : args.slice(flags);
  const cemOnly = options.length === 1 && options[0] === '--cem-only';
  if (options.length && !cemOnly && !(options.length === 3 && options[0] === '--types')) throw new Error(help);
  args = positional;
  async function snapshots(beforeFile: string, afterFile: string) {
    if (cemOnly) return undefined;
    const [before, after] = await Promise.all([json(options[1] ?? join(dirname(beforeFile), 'public-types.json')), json(options[2] ?? join(dirname(afterFile), 'public-types.json'))]);
    const optional = async (file: string) => {try{return await json(file);}catch(error:any){if(error.code==='ENOENT')return undefined;throw error;}};
    const [oldGraph,newGraph] = await Promise.all([optional(join(dirname(beforeFile),'public-api.json')),optional(join(dirname(afterFile),'public-api.json'))]);
    if (Boolean(oldGraph) !== Boolean(newGraph)) throw new Error('Supply public-api.json for both release sides; graph coverage must not disappear silently.');
    if (oldGraph && (oldGraph.typeDigest !== digestJson(before) || newGraph.typeDigest !== digestJson(after))) throw new Error('Graph and selected type snapshots do not match.');
    return { before, after, ...(oldGraph ? {graphs:{before:oldGraph,after:newGraph}} : {}) };
  }
  if (args[0] === 'graph' && args.length === 5 && !options.length) {
    const [before,after,oldGraph,newGraph] = await Promise.all(args.slice(1).map(json));
    process.stdout.write(JSON.stringify(diffPublicGraph(before,after,oldGraph,newGraph),null,2)+'\n');
    return;
  }
  if (args[0] === 'diff' && args.length === 3) {
    const [before, after] = await Promise.all([json(args[1]!), json(args[2]!)]);
    const types = await snapshots(args[1]!,args[2]!);
    process.stdout.write(`${JSON.stringify(types?.graphs ? diffPublicGraph(before,after,types.graphs.before,types.graphs.after) : cemOnly ? { ...diffCem(before, after), typeCoverage: 'not-supplied' } : diffPublicApi(before, after, types!), null, 2)}\n`);
  } else if (args[0] === 'draft' && args.length === 5) {
    const [input, before, after] = await Promise.all([json(args[1]!), json(args[2]!), json(args[3]!)]);
    const draft = createRelease(input, before, after, await snapshots(args[2]!, args[3]!));
    const output = args[4]!;
    // Reserve the destination without overwriting any prior evidence/review files.
    await mkdir(output, { recursive: false });
    const temporary = join(output, `.release-${randomUUID()}.tmp`);
    await writeFile(temporary, `${JSON.stringify(draft, null, 2)}\n`, { flag: 'wx' });
    await writeFile(join(output, 'CHANGELOG.md'), changelog(draft), { flag: 'wx' });
    await rename(temporary, join(output, 'release.json'));
    process.stdout.write(`${JSON.stringify({ output, status: draft.status, proposedVersion: draft.proposedVersion, issues: draft.issues.length })}\n`);
  } else throw new Error(help);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
