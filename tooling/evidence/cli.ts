import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { digestJson, renderingIdentity, comparisonIdentity, reviewIdentity } from './identity.ts';
import { selectAffected, coverageReceipt } from './graph.ts';

export const help = `Usage: node tooling/evidence/cli.ts <command> <input.json>

Commands:
  digest       Hash parsed JSON with stable object-key ordering.
  rendering    Create an identity from explicit rendering inputs.
  comparison   Create an identity from image digests and comparison configuration.
  review       Scope a review request to exact content; does not approve anything.
  select       Input: { "graph": { "schemaVersion": 1, "nodes": [...] }, "changed": [...] }
  coverage     Input: { "required": [...], "outcomes": { ... } }

Output is JSON on stdout. Local cache APIs live in cache.ts. No publication,
baseline adoption, browser execution or review approval occurs here.
`;

export async function main(args: string[]): Promise<void> {
  if (!args.length || args.includes('--help')) { process.stdout.write(help); return; }
  if (args.length !== 2) throw new Error(help);
  const [command, file] = args as [string, string];
  const input = JSON.parse(await readFile(file, 'utf8'));
  let result: unknown;
  switch (command) {
    case 'digest': result = { digest: digestJson(input) }; break;
    case 'rendering': result = renderingIdentity(input); break;
    case 'comparison': result = comparisonIdentity(input); break;
    case 'review': result = reviewIdentity(input); break;
    case 'select': result = selectAffected(input.graph, input.changed); break;
    case 'coverage': result = coverageReceipt(input.required, input.outcomes); break;
    default: throw new Error(`Unknown command: ${command}\n${help}`);
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
