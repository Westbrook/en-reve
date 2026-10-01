import { mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { generateCandidateCem } from './generate-wc-toolkit.ts';

export interface GenerateOptions {
  sourceRoot: string;
  sources: string[];
  lit?: boolean;
}

/** Extract source-backed metadata through the qualified TypeScript6 API boundary. */
export async function generateCem(options: GenerateOptions) {
  return generateCandidateCem(options);
}

export const help = `Usage: node tooling/metadata/generate.ts <source-root> <output-cem.json> <source-file> [source-file...]

Source files are explicit paths relative to source-root. WC Toolkit
extracts actual declarations through the recorded TypeScript6 API and Lit plugin. No components are imported or
registered and package.json is never edited. A sibling .receipt.json records source
content and tool versions. Generated metadata still needs public-contract review.
`;

export async function main(args: string[]): Promise<void> {
  if (!args.length || args.includes('--help')) { process.stdout.write(help); return; }
  if (args.length < 3) throw new Error(help);
  const result = await generateCem({ sourceRoot: args[0]!, sources: args.slice(2) });
  const output = resolve(args[1]!);
  await mkdir(dirname(output), { recursive: true });
  for (const [file, value] of [[`${output}.receipt.json`, result.receipt], [output, result.manifest]] as const) {
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
      await rename(temporary, file);
    } finally {
      await rm(temporary, { force: true });
    }
  }
  process.stdout.write(`${JSON.stringify({ output, ...result.receipt })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
