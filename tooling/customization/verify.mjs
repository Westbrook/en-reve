import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { collectSourceInventory } from './source-inventory.mjs';
import { applyReviewedExceptions } from './reviewed-exceptions.mjs';
import { cemAssociations, decorateCustomizationMetadata } from './cem.mjs';

const defaultRoot = fileURLToPath(new URL('../../', import.meta.url));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const distinct = values => [...new Set(values)].sort();

export function inspectCoverage({ inventory, contracts, manifest, theme, resetNames, fullDeclarations, editorDescriptor }) {
  const findings = [];
  const byName = new Map(contracts.map(contract => [contract.cssName, contract]));
  const add = (code, cssName, sources = [], detail = '') => findings.push({ code, cssName, sources: distinct(sources), detail });
  if (byName.size !== contracts.length) add('duplicate-contract', '*', [], 'Registry CSS names must be unique.');
  const names = distinct([...inventory.references, ...inventory.declarations, ...inventory.annotations].map(item => item.cssName));
  const associations = cemAssociations(manifest);
  const expectedManifest = decorateCustomizationMetadata(structuredClone(manifest), contracts);
  const expectedAssociations = cemAssociations(expectedManifest);
  for (const name of names) {
    const refs = inventory.references.filter(item => item.cssName === name);
    const declarations = inventory.declarations.filter(item => item.cssName === name);
    const annotations = inventory.annotations.filter(item => item.cssName === name);
    if (!byName.has(name)) {
      if (refs.length) add('unclassified-reference', name, refs.map(item => item.file));
      if (declarations.length) add('unclassified-declaration', name, declarations.map(item => item.file));
      if (annotations.length) add('unclassified-annotation', name, annotations.map(item => item.file));
    }
    for (const annotation of annotations) if (!associations.some(item => item.cssName === name && item.source === annotation.file)) {
      add('missing-cem-annotation', name, [annotation.file], 'Authored @cssprop is absent from the generated component metadata.');
    }
  }
  for (const unresolved of inventory.unresolved) add('unresolved-source-expression', '*', [unresolved.file], `${unresolved.line}: ${unresolved.expression}`);
  // A forwarding var() can exist without any effective downstream reader.
  // Detect the bounded public-property transfer; do not claim general CSS liveness.
  for (const declaration of inventory.declarations) {
    if (inventory.references.some(reference => reference.cssName === declaration.cssName)) continue;
    for (const match of declaration.value.matchAll(/var\(\s*(--en-[a-z0-9-]+)/g)) {
      if (!byName.has(match[1]) || findings.some(finding => finding.code === 'disconnected-hook' && finding.cssName === match[1])) continue;
      if (inventory.references.some(reference => reference.cssName === match[1] && (reference.file !== declaration.file || reference.line !== declaration.line))) continue;
      add('disconnected-hook', match[1], [declaration.file], `Forwarded to ${declaration.cssName}, which has no production source reader.`);
    }
  }
  for (const contract of contracts) {
    const name = contract.cssName, refs = inventory.references.filter(item => item.cssName === name);
    const sources = refs.map(item => item.file);
    const annotations = inventory.annotations.filter(item => item.cssName === name);
    const isReset = resetNames.includes(name);
    if ((contract.reset === 'theme') !== isReset) add('reset-list-mismatch', name, sources, `Registry policy ${contract.reset}; reset list ${isReset}.`);
    if (contract.reset === 'preserve' && fullDeclarations.has(name)) add('preserved-hook-emitted', name, sources, 'A full theme must not clear a preserved input.');
    if (contract.kind === 'mechanical' && contract.reset !== 'preserve') add('mechanical-reset', name, sources);
    if (contract.kind !== 'semantic' && contract.kind !== 'mechanical' && !annotations.length) add('missing-element-annotation', name, sources);
    if (contract.kind !== 'semantic' && !refs.length) add('missing-source-consumer', name, annotations.map(item => item.file));
    if (contract.consumerStatus === 'unwired' && !findings.some(finding => finding.code === 'disconnected-hook' && finding.cssName === name)) add('disconnected-hook', name, sources, 'Registry records a known disconnected consumer; lexical references do not establish behavior.');
    if (contract.managed?.supported) {
      const tokenId = contract.managed.tokenId ?? contract.tokenId;
      const token = theme.tokens[tokenId];
      if (!token || token.cssName !== name) add('managed-token-mismatch', name, sources);
      else if (editorDescriptor(theme, tokenId)?.tokenId !== tokenId) add('managed-descriptor-mismatch', name, sources);
    } else if (contract.tokenId && theme.tokens[contract.tokenId]) {
      add('managed-token-unclassified', name, sources, 'An existing token requires explicit managed authoring metadata.');
    }
    for (const consumer of contract.consumerStatus === 'source-token' ? [] : contract.consumers ?? []) {
      const file = typeof consumer === 'string' ? consumer : consumer.source ?? consumer.file;
      if (file && !refs.some(item => item.file === file) && !annotations.some(item => item.file === file)) add('stale-registry-consumer', name, [file]);
    }
  }
  for (let index = 0; index < associations.length; index++) {
    const association = associations[index];
    if (byName.has(association.cssName) && digest(association.contract) !== digest(expectedAssociations[index].contract)) {
      add('cem-contract-metadata-mismatch', association.cssName, [association.source]);
    }
  }
  return { findings, associations, names };
}

export async function createCoverageReport(root = defaultRoot) {
  const manifest = JSON.parse(await readFile(join(root, 'packages/elements/custom-elements.json'), 'utf8'));
  return createCoverageReportFromManifest(root, manifest);
}
/** Verify the complete candidate bundle before using its in-memory manifest. No evidence files are replaced. */
export async function createCandidateCoverageReport({root = defaultRoot, bundleRoot}) {
  const {assertCandidateWorkspace} = await import('../metadata/candidate-workspace.ts');
  const {verifyCandidatePublicArtifacts} = await import('../metadata/verify-candidate-public.ts');
  root = await assertCandidateWorkspace(root);
  const {manifest} = await verifyCandidatePublicArtifacts(bundleRoot, join(root,'packages/elements'));
  return createCoverageReportFromManifest(root, manifest);
}
async function createCoverageReportFromManifest(root, manifest) {
  const [{ customizationContracts, styleOverrideNames }, { resolveTheme }, { collectThemeCSSDeclarations }, { editorDescriptor }] = await Promise.all([
    import('../../packages/tokens/dist/customization.js'), import('../../packages/tokens/dist/theme.js'),
    import('../../packages/tokens/dist/css.js'), import('../../packages/tokens/dist/admin.js'),
  ]);
  const theme = resolveTheme(), contracts = customizationContracts(theme);
  const inventory = await collectSourceInventory(root);
  const result = inspectCoverage({ inventory, contracts, manifest, theme, resetNames: styleOverrideNames,
    fullDeclarations: collectThemeCSSDeclarations(theme), editorDescriptor });
  const reviewed = applyReviewedExceptions(result.findings);
  const sourceDigests = Object.fromEntries(await Promise.all(inventory.files.map(async file => [file, digest(await readFile(join(root, file), 'utf8'))])));
  const hooks = distinct([...contracts.map(item => item.cssName), ...result.names]).map(cssName => ({
    cssName, contract: contracts.find(item => item.cssName === cssName) ?? null,
    references: inventory.references.filter(item => item.cssName === cssName),
    declarations: inventory.declarations.filter(item => item.cssName === cssName),
    annotations: inventory.annotations.filter(item => item.cssName === cssName),
    components: result.associations.filter(item => item.cssName === cssName).map(({ partsAvailableOnComponent, ...item }) => item),
    findings: reviewed.findings.filter(item => item.cssName === cssName),
  }));
  const components = [...new Map(result.associations.map(item => [item.tagName, { tagName: item.tagName, source: item.source,
    parts: item.partsAvailableOnComponent, relationship: item.partRelationship }])).values()].sort((a, b) => a.tagName.localeCompare(b.tagName));
  return {
    schemaVersion: 1, kind: 'source-backed-customization-coverage', registryDigest: digest(contracts), sourceDigests,
    limits: [
      'References are lexical production-source evidence, not proof of runtime behavior, cascade reach, visual state coverage or accessibility.',
      'Source locations include raw var(), imported token()/rawToken()/override() aliases and explicitly bounded focus, sizing and toast expansions.',
      'CEM Parts are listed on components that declare a CSS hook; co-declaration does not establish a hook-to-Part relationship.',
      'Registry semantic tokens may be graph-only inputs with no direct CSS consumer. Unsupported names and unwired hooks remain visible as reviewed findings.',
    ],
    summary: { productionFiles: inventory.files.length, registryContracts: contracts.length, discoveredNames: result.names.length,
      sourceReferences: inventory.references.length, authoredAnnotations: inventory.annotations.length,
      cemAssociations: result.associations.length, reviewedFindings: reviewed.findings.filter(item => item.reviewed).length,
      failures: reviewed.findings.filter(item => !item.reviewed).length + reviewed.staleExceptions.length },
    findings: reviewed.findings, staleExceptions: reviewed.staleExceptions, dynamicInputs: inventory.dynamicInputs, components, hooks,
  };
}

export function coverageMarkdown(report) {
  const location = item => `\`${item.file}:${item.line}\``;
  const lines = ['# Customization contract coverage', '',
    `${report.summary.registryContracts} registry contracts; ${report.summary.productionFiles} production source files; ${report.summary.sourceReferences} lexical references; ${report.summary.authoredAnnotations} authored annotations.`, '',
    ...report.limits.map(limit => `- ${limit}`), '', '## Reviewed findings and failures', '',
    '| Status | Hook | Finding | Reason |', '| --- | --- | --- | --- |',
    ...report.findings.map(item => `| ${item.reviewed ? 'Reviewed exception' : 'FAIL'} | \`${item.cssName}\` | ${item.code} | ${(item.reason ?? item.detail).replaceAll('|', '\\|')} |`),
    ...report.staleExceptions.map(item => `| FAIL | \`${item.key}\` | stale exception | Remove or re-review the exception; its finding no longer exists. |`),
    '', '## Source inventory', '', '| Hook | Kind / reset | Managed | Consumers and fallback locations | CEM components |', '| --- | --- | --- | --- | --- |',
    ...report.hooks.map(hook => {
      const sites = [...new Map(hook.references.map(ref => [`${ref.file}:${ref.line}`, ref])).values()];
      return `| \`${hook.cssName}\` | ${hook.contract ? `${hook.contract.kind} / ${hook.contract.reset}` : 'unclassified known issue'} | ${hook.contract?.managed?.supported ? 'yes' : 'no'} | ${sites.map(location).join(', ') || 'No direct lexical consumer'} | ${distinct(hook.components.map(item => item.tagName)).join(', ') || '—'} |`;
    }), '', 'Full fallback expressions, declarations, source annotations, component Parts context and reviewed reasons are retained in `coverage.json`.', ''];
  return lines.join('\n');
}

export async function main(args = process.argv.slice(2)) {
  if (args.some(arg => arg !== '--check')) throw new Error('Usage: node tooling/customization/verify.mjs [--check]');
  const report = await createCoverageReport();
  const directory = join(defaultRoot, 'tooling/customization/evidence');
  const outputs = [['coverage.json', `${JSON.stringify(report, null, 2)}\n`], ['coverage.md', coverageMarkdown(report)]];
  if (args.includes('--check')) {
    for (const [name, contents] of outputs) if (await readFile(join(directory, name), 'utf8') !== contents) throw new Error(`Customization evidence is stale: ${name}; run npm run customization.`);
  } else {
    await mkdir(directory, { recursive: true });
    for (const [name, contents] of outputs) await writeFile(join(directory, name), contents);
  }
  process.stdout.write(`${JSON.stringify(report.summary)}\n`);
  if (report.summary.failures) throw new Error(`Customization coverage has ${report.summary.failures} unreviewed or stale findings; inspect tooling/customization/evidence/coverage.md.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
