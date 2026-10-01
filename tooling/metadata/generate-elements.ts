import {effectivePublicEventContracts} from './public-event-contracts.ts';
import {readEventContracts} from './event-contracts.ts';
import {generatorIdentity} from './generator-identity.ts';
import {verifyCandidateReceipt, verifyCandidateComposition} from './generate-wc-toolkit.ts';
import { readdir, readFile, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { generateCem } from './generate.ts';
import { digestBytes, digestJson } from '../evidence/identity.ts';
import {finalizeCustomization} from './finalize-customization.ts';

import {readDefinitionGraph} from './definition-graph.ts';
const defaultPackageRoot = fileURLToPath(new URL('../../packages/elements/', import.meta.url));
const customizationSources = ['customization.ts', 'customization-data.ts', 'source.ts', 'sizing.ts'] as const;

async function readCustomizationState() {
  const [{ customizationContracts }, { resolveTheme }] = await Promise.all([
    import('../../packages/tokens/dist/customization.js'), import('../../packages/tokens/dist/theme.js'),
  ]);
  const contracts = customizationContracts(resolveTheme());
  const sources = Object.fromEntries(await Promise.all(customizationSources.map(async name => [
    `packages/tokens/src/${name}`, digestBytes(await readFile(new URL(`../../packages/tokens/src/${name}`, import.meta.url))),
  ])));
  return { contracts, registryDigest: digestJson(contracts), sources };
}

/** Maintainer sources only; generated output, tests, fixtures and runner configuration stay out. */
export async function discoverElementSources(packageRoot: string): Promise<string[]> {
  const sourceRoot = resolve(packageRoot, 'src');
  const files: string[] = [];
  const excludedDirectories = new Set(['test', 'tests', '__tests__', 'fixtures', 'test-results', 'playwright-report', 'results']);
  async function visit(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!excludedDirectories.has(entry.name)) await visit(join(directory, entry.name));
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        const tokens = entry.name.slice(0, -3).split(/[.-]/);
        if (tokens.some(token => ['test', 'spec', 'fixture', 'config'].includes(token))) continue;
        files.push(relative(packageRoot, join(directory, entry.name)).split(sep).join('/'));
      }
    }
  }
  await visit(sourceRoot);
  return files.sort();
}

/** Read the actual catalog AST without importing its Lit component classes or invoking registration. */
export async function readCatalogDefinitions(packageRoot: string): Promise<Array<{ tagName: string; className: string }>> {
  return (await readDefinitionGraph(packageRoot)).map(({tagName, className}) => ({tagName, className}));
}

export function describeCoverage(manifest: any, intended: Array<{ tagName: string; className: string }>) {
  const declarations = manifest.modules.flatMap((module: any) => (module.declarations ?? [])
    .map((declaration: any) => ({ declaration, source: module.path })));
  const emitted = declarations.filter((entry: any) => typeof entry.declaration.tagName === 'string');
  const tags = emitted.map((entry: any) => entry.declaration.tagName as string);
  const intendedTags = intended.map(entry => entry.tagName);
  const coverage = intended.map(({ tagName, className }) => {
    const entry = emitted.find((entry: any) => entry.declaration.tagName === tagName);
    const declaration = entry?.declaration;
    const publicMembers = (declaration?.members ?? []).filter((member: any) => member.privacy !== 'private' && member.privacy !== 'protected');
    return {
      tagName,
      intendedClass: className,
      emittedClass: declaration?.name ?? null,
      source: entry?.source ?? null,
      emitted: !!declaration,
      counts: {
        attributes: declaration?.attributes?.length ?? 0,
        properties: publicMembers.filter((member: any) => member.kind === 'field').length,
        methods: publicMembers.filter((member: any) => member.kind === 'method').length,
        events: declaration?.events?.length ?? 0,
        slots: declaration?.slots?.length ?? 0,
        cssParts: declaration?.cssParts?.length ?? 0,
        cssProperties: declaration?.cssProperties?.length ?? 0,
      },
      untypedEvents: (declaration?.events ?? []).filter((event: any) => !event.type?.text).map((event: any) => event.name),
      undocumentedPublicMembers: publicMembers.filter((member: any) => !member.description?.trim() && !member.summary?.trim()).map((member: any) => member.name),
      undescribedAttributes: (declaration?.attributes ?? []).filter((attribute: any) => !attribute.description?.trim() && !attribute.summary?.trim()).map((attribute: any) => attribute.name),
      missingAttributeTypes: (declaration?.attributes ?? []).filter((attribute: any) => !attribute.type?.text).map((attribute: any) => attribute.name),
    };
  });
  const sharedBase = declarations.find((entry: any) => entry.declaration.name === 'EnElement');
  const sharedSize = sharedBase?.declaration.members?.find((member: any) => member.name === 'size');
  const sharedSizeCoverage = sharedSize ? emitted.map((entry: any) => {
    const size = entry.declaration.members?.find((member: any) => member.name === 'size' && member.privacy !== 'private' && member.privacy !== 'protected');
    const attribute = entry.declaration.attributes?.find((attribute: any) => attribute.name === 'size');
    return {
      tagName: entry.declaration.tagName,
      property: Boolean(size),
      attribute: Boolean(attribute),
      default: size?.default ?? null,
      inheritsBase: size?.inheritedFrom?.name === 'EnElement' && size?.inheritedFrom?.module === sharedBase.source,
      documented: Boolean(size?.description?.trim()) && size.description === sharedSize.description && attribute?.description === sharedSize.description,
      matchesBaseType: size?.type?.text === sharedSize.type?.text && attribute?.type?.text === sharedSize.type?.text,
      matchesBaseDefault: size?.default === sharedSize.default && attribute?.default === sharedSize.default,
    };
  }) : [];
  return {
    schemaVersion: 1,
    kind: 'source-metadata-coverage',
    intendedTagCount: intendedTags.length,
    emittedTagCount: tags.length,
    customElementDefinitionExports: manifest.modules.flatMap((module: any) => module.exports ?? [])
      .filter((entry: any) => entry.kind === 'custom-element-definition').map((entry: any) => entry.name).sort(),
    missingTags: intendedTags.filter(tag => !tags.includes(tag)).sort(),
    unexpectedTags: tags.filter((tag: string) => !intendedTags.includes(tag)).sort(),
    mismatchedClasses: coverage.filter(entry => entry.emitted && entry.intendedClass !== entry.emittedClass).map(entry => entry.tagName),
    duplicateTags: [...new Set(tags.filter((tag: string, index: number) => tags.indexOf(tag) !== index))].sort(),
    findings: {
      untypedEventEntries: coverage.reduce((count, element) => count + element.untypedEvents.length, 0),
      undocumentedPublicMemberOccurrences: coverage.reduce((count, element) => count + element.undocumentedPublicMembers.length, 0),
      undescribedAttributeOccurrences: coverage.reduce((count, element) => count + element.undescribedAttributes.length, 0),
      missingAttributeTypeOccurrences: coverage.reduce((count, element) => count + element.missingAttributeTypes.length, 0),
      tagsWithoutCssPropertyAnnotations: coverage.filter(element => !element.counts.cssProperties).map(element => element.tagName),
    },
    elements: coverage,
    sharedContracts: {
      size: sharedSize ? { source: sharedBase.source, baseClass: 'EnElement', default: sharedSize.default ?? null, type: sharedSize.type?.text ?? null, elements: sharedSizeCoverage } : null,
      namedLabelSlotTags: emitted.filter((entry: any) => entry.declaration.slots?.some((slot: any) => slot.name === 'label')).map((entry: any) => entry.declaration.tagName).sort(),
    },
    limits: [
      'Counts describe emitted source metadata, not browser verification or proof of complete supported APIs.',
      'No slots, events or CSS properties can be valid for a component; a zero count alone is not a failure.',
      'External superclass metadata, package-entry mapping, detailed event behavior and CSS usage need separate public-contract review.',
      'Undocumented public members can include lifecycle/platform overrides or implementation helpers; source owners must decide supported visibility.',
    ],
  };
}

export async function generateElements(packageRoot = defaultPackageRoot, {checkTagTypes = true} = {}) {
  packageRoot = resolve(packageRoot);
  const [sources, intended] = await Promise.all([discoverElementSources(packageRoot), readCatalogDefinitions(packageRoot)]);
  const extracted = await generateCem({ sourceRoot: packageRoot, sources });
  const customization = await readCustomizationState();
  const finalized = finalizeCustomization(extracted.manifest, customization.contracts);
  const eventContracts=await readEventContracts(packageRoot,sources,checkTagTypes,effectivePublicEventContracts(finalized.manifest,extracted.receipt));
  const generated = {...extracted, manifest: finalized.manifest};
  const coverage = describeCoverage(generated.manifest, intended);
  if (coverage.missingTags.length || coverage.unexpectedTags.length || coverage.mismatchedClasses.length || coverage.duplicateTags.length) {
    throw new Error(`Generated CEM does not match intended catalog: ${JSON.stringify({ missing: coverage.missingTags, unexpected: coverage.unexpectedTags, mismatched: coverage.mismatchedClasses, duplicate: coverage.duplicateTags })}`);
  }
  const receipt = { ...generated.receipt, eventContracts, generator: await generatorIdentity(), manifestDigest: digestJson(generated.manifest), catalogDigest: digestJson(intended),
    customization: { registryDigest: customization.registryDigest, sources: customization.sources, policy: 'enrich-authored-css-properties-only', enrichment: finalized.enrichment }, coverage };
  return { manifest: generated.manifest, receipt };
}

/** Check the retained manifest against its receipt and current production sources without rewriting it. */
export async function verifyGeneratedElements(packageRoot = defaultPackageRoot) {
  packageRoot = resolve(packageRoot);
  const output = join(packageRoot, 'custom-elements.json');
  const [manifest, receipt, sources, intended] = await Promise.all([
    readFile(output, 'utf8').then(JSON.parse), readFile(`${output}.receipt.json`, 'utf8').then(JSON.parse),
    discoverElementSources(packageRoot), readCatalogDefinitions(packageRoot),
  ]);
  if (digestJson(manifest) !== receipt.manifestDigest) throw new Error('CEM content does not match its generation receipt.');
  if (digestJson(receipt.generator ?? null) !== digestJson(await generatorIdentity())) throw new Error('CEM extraction policy or analyzer/parser identity changed; regenerate the CEM.');
  await verifyCandidateReceipt(manifest, receipt, {sourceRoot: packageRoot, sources});
  const customization = await readCustomizationState();
  if (customization.registryDigest !== receipt.customization?.registryDigest || digestJson(customization.sources) !== digestJson(receipt.customization?.sources)) throw new Error('CEM customization contract metadata is stale; rebuild tokens and regenerate the CEM.');
  if (digestJson(sources) !== digestJson(Object.keys(receipt.sources).sort())) throw new Error('Production source selection changed; regenerate the CEM.');
  if (digestJson(intended) !== receipt.catalogDigest) throw new Error('Catalog definitions changed; regenerate the CEM.');
  for (const source of sources) {
    if (digestBytes(await readFile(join(packageRoot, source))) !== receipt.sources[source]) {
      throw new Error(`CEM source receipt is stale: ${source}`);
    }
  }
  // Selected-source hashes cannot detect changed imported declaration bodies or
  // previously failed module lookups. Re-extract with a fresh Program before reuse.
  const current = await generateCem({sourceRoot: packageRoot, sources});
  const finalized = finalizeCustomization(current.manifest, customization.contracts);
  const currentEventContracts=await readEventContracts(packageRoot,sources,false,effectivePublicEventContracts(finalized.manifest,current.receipt));
  if(!Array.isArray(receipt.eventContracts)||digestJson(currentEventContracts)!==digestJson(receipt.eventContracts))throw new Error('CEM event contracts changed; regenerate the CEM.');
  verifyCandidateComposition(receipt, current.receipt);
  // Enrichment includes manifest digests, so report changed extraction before
  // validating enrichment-only evidence against an otherwise unchanged manifest.
  if (digestJson(finalized.manifest) !== receipt.manifestDigest) throw new Error('CEM imported declarations or resolution changed; regenerate the CEM.');
  if (digestJson(finalized.enrichment) !== digestJson(receipt.customization?.enrichment ?? null)) throw new Error('CEM customization enrichment receipt changed; regenerate the CEM.');
  return { output, manifestDigest: receipt.manifestDigest, sourceFiles: sources.length, emittedTags: receipt.coverage.emittedTagCount };
}

async function atomic(file: string, value: unknown) {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
    await rename(temporary, file);
  } finally { await rm(temporary, { force: true }); }
}

export const help = `Usage: node tooling/metadata/generate-elements.ts [--check] [elements-package-root]

Generate packages/elements/custom-elements.json and its .receipt.json from actual
maintainer sources, excluding tests, fixtures, generated output and runner config.
The actual src/catalog.ts definitions must match emitted annotated CEM tags/classes.
Coverage findings are recorded in the receipt; they are not invented API entries.
--check verifies existing manifest/receipt/current-source identities without rewriting.
`;

export async function main(args: string[]) {
  if (args.includes('--help')) { process.stdout.write(help); return; }
  if (args[0] === '--check') {
    if (args.length > 2) throw new Error(help);
    process.stdout.write(`${JSON.stringify(await verifyGeneratedElements(args[1] ?? defaultPackageRoot))}\n`);
    return;
  }
  if (args.length > 1) throw new Error(help);
  const packageRoot = resolve(args[0] ?? defaultPackageRoot);
  const result = await generateElements(packageRoot);
  const output = join(packageRoot, 'custom-elements.json');
  await atomic(`${output}.receipt.json`, result.receipt);
  await atomic(output, result.manifest);
  process.stdout.write(`${JSON.stringify({ output, sourceFiles: Object.keys(result.receipt.sources).length, emittedTags: result.receipt.coverage.emittedTagCount, manifestDigest: result.receipt.manifestDigest })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
