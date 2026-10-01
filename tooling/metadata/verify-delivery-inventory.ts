import {readFile, realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {basename, resolve, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {readDefinitionGraph, type SourceDefinition} from './definition-graph.ts';

export interface DeliveryEvidenceAnchor {
  readonly path: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly sha256: string;
  /** Omitted anchors resolve against inventory.source.commit. */
  readonly revision?: string;
}
export interface DeliveryInventoryValidationOptions {
  readonly requireFinal?: boolean;
  readonly readEvidence: (path: string, revision: string) => Promise<string | Uint8Array>;
}
export interface DeliveryInventoryValidation {
  readonly schemaVersion: 1;
  readonly requireFinal: boolean;
  readonly sourceCommit: string;
  readonly workingTreeHead?: string;
  readonly components: number;
  readonly features: number;
  readonly dispositions: Readonly<Record<string, number>>;
  readonly evidence: {readonly anchors: number; readonly blobs: number; readonly workingTreeAnchors: number; readonly revisions: readonly string[]};
}
const finalDispositions = new Set(['implemented', 'already-conditional', 'essential-eager', 'not-applicable', 'rejected-with-evidence']);
const unfinishedDispositions = new Set(['candidate', 'needs-design', 'unassessed']);
const support: Record<string, string> = {'implemented': 'supported', 'already-conditional': 'existing-conditional', 'essential-eager': 'eager', 'not-applicable': 'not-applicable', 'rejected-with-evidence': 'not-supported', 'candidate': 'not-yet-supported', 'needs-design': 'not-yet-supported', 'unassessed': 'not-yet-supported'};
const costs = new Set(['component-loading', 'registration', 'construction', 'optional-code', 'hydration', 'data', 'virtualization']);
const axes = ['componentLoading', 'registration', 'construction', 'optionalCode', 'hydration', 'data', 'virtualization'];
const sha = /^[0-9a-f]{64}$/, revision = /^[0-9a-f]{40}$/;
function fail(message: string): never { throw new Error(`Delivery inventory: ${message}`); }
function object(value: unknown, label: string): asserts value is Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object.`);
}
function text(value: unknown, label: string): asserts value is string { if (typeof value !== 'string' || !value.trim()) fail(`${label} must be nonempty text.`); }
function strings(value: unknown, label: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item.trim()) || new Set(value).size !== value.length) fail(`${label} must contain unique nonempty strings.`);
}
function notes(value: unknown, label: string): void {
  if (Array.isArray(value)) { strings(value, label); if (!value.length) fail(`${label} must not be empty.`); }
  else text(value, label);
}
function evidencePath(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !value || value.startsWith('/') || /[:\\\0\r\n]/.test(value) || value.split('/').some(part => !part || part === '.' || part === '..')) fail('Evidence path must be repository-relative without traversal.');
}
/** Verify the complete audit against its declared historical/current bytes; never rewrites dispositions. */
export async function verifyDeliveryInventory(input: unknown, definitions: readonly SourceDefinition[], options: DeliveryInventoryValidationOptions): Promise<DeliveryInventoryValidation> {
  object(input, 'Inventory'); object(input.source, 'Inventory source');
  if (input.schemaVersion !== 1 || !revision.test(input.source.commit) || !revision.test(input.source.tree)) fail('Invalid inventory schema or source commit/tree.');
  text(input.source.derivation, 'Source derivation');
  object(input.compatibility, 'Compatibility policy');
  for (const key of ['ids', 'defaults', 'costs']) text(input.compatibility[key], `Compatibility ${key}`);
  strings(input.evidenceLimits, 'Evidence limits'); if (!input.evidenceLimits.length) fail('Evidence limits must not be empty.');
  if (!Array.isArray(input.components)) fail('Components must be an array.');
  const expectedTags = definitions.map(item => item.tagName).sort();
  const actualTags = input.components.map((item: any) => item?.tag).sort();
  if (JSON.stringify(expectedTags) !== JSON.stringify(actualTags)) fail('Components must cover the exact canonical tag set once, including new tags.');
  const blobs = new Map<string, Promise<{digest: string; lines: number}>>();
  const revisions = new Set<string>();
  let anchorCount = 0, workingTreeAnchors = 0, featureCount = 0;
  const dispositions: Record<string, number> = {}, ids = new Set<string>();
  const blob = (path: string, ref: string) => {
    const key = `${ref}:${path}`;
    let result = blobs.get(key);
    if (!result) {
      result = options.readEvidence(path, ref).then(value => {
        const bytes = typeof value === 'string' ? Buffer.from(value) : value;
        const source = Buffer.from(bytes).toString('utf8'), lines = source.split(/\r\n?|\n/);
        if (lines.at(-1) === '') lines.pop();
        return {digest: createHash('sha256').update(bytes).digest('hex'), lines: lines.length};
      }).catch(error => fail(`Cannot read evidence ${path} at ${ref}: ${String(error)}`));
      blobs.set(key, result);
    }
    return result;
  };
  const anchors = async (entries: unknown, label: string) => {
    if (!Array.isArray(entries) || !entries.length) fail(`${label} requires nonempty evidence.`);
    for (const entry of entries) {
      object(entry, `${label} evidence`); evidencePath(entry.path);
      const ref = entry.revision ?? input.source.commit;
      if (ref !== 'working-tree' && !revision.test(ref)) fail(`${label} evidence revision must be a full commit SHA or explicit working-tree.`);
      if (!sha.test(entry.sha256) || !Number.isSafeInteger(entry.startLine) || !Number.isSafeInteger(entry.endLine) || entry.startLine < 1 || entry.endLine < entry.startLine) fail(`${label} has an invalid evidence hash or line range.`);
      const actual = await blob(entry.path, ref);
      if (actual.digest !== entry.sha256) fail(`${label} evidence hash mismatch: ${entry.path} at ${ref}`);
      if (entry.endLine > actual.lines) fail(`${label} evidence line range exceeds ${entry.path} (${actual.lines} lines).`);
      anchorCount++; if (ref === 'working-tree') workingTreeAnchors++; revisions.add(ref);
    }
  };
  for (const [field, path] of [['catalogSha256', 'packages/elements/src/catalog.ts'], ['manifestSha256', 'packages/elements/src/lazy-manifest.ts'], ['graphReaderSha256', 'tooling/metadata/definition-graph.ts']] as const) {
    if (!sha.test(input.source[field])) fail(`Source ${field} is missing or invalid.`);
    if ((await blob(path!, input.source.commit)).digest !== input.source[field]) fail(`Source ${field} hash mismatch at ${input.source.commit}.`);
  }
  for (const component of input.components) {
    object(component, 'Component');
    const definition = definitions.find(item => item.tagName === component.tag)!;
    const name = basename(definition.source, '.ts');
    object(component.publicEntries, `${component.tag} public entries`);
    for (const [key, value] of Object.entries({class: `@en-reve/elements/${name}.js`, definition: `@en-reve/elements/definitions/${name}.js`, define: `@en-reve/elements/define/${name}.js`})) if (component.publicEntries[key] !== value) fail(`${component.tag} has a stale public ${key} entry.`);
    if (JSON.stringify(component.canonicalDependencies) !== JSON.stringify(definition.dependencies.map(child => child.tagName))) fail(`${component.tag} has stale canonical dependencies.`);
    object(component.componentDelivery, `${component.tag} component delivery`);
    if (component.componentDelivery.disposition !== 'implemented' || component.componentDelivery.entry !== component.publicEntries.definition) fail(`${component.tag} must retain canonical component delivery.`);
    text(component.componentDelivery.loader, `${component.tag} loader`); text(component.componentDelivery.registration, `${component.tag} registration`);
    await anchors(component.componentDelivery.evidence, `${component.tag} component delivery`);
    if (!Array.isArray(component.features) || !component.features.length) fail(`${component.tag} needs a nonempty feature assessment.`);
    for (const feature of component.features) {
      object(feature, `${component.tag} feature`);
      if (typeof feature.id !== 'string' || !feature.id.startsWith(`en-reve/${component.tag}/`) || !/^en-reve(?:\/[a-z][a-z0-9._-]*)+$/.test(feature.id) || ids.has(feature.id) || !Number.isSafeInteger(feature.version) || feature.version < 1) fail(`Invalid or duplicate feature identity: ${String(feature.id)}`);
      ids.add(feature.id); featureCount++;
      if (!finalDispositions.has(feature.disposition) && !unfinishedDispositions.has(feature.disposition)) fail(`Unknown feature disposition: ${feature.id}`);
      if (options.requireFinal && !finalDispositions.has(feature.disposition)) fail(`Unfinished final disposition ${feature.disposition}: ${feature.id}`);
      if (feature.support !== support[feature.disposition]) fail(`Support disagrees with disposition: ${feature.id}`);
      dispositions[feature.disposition] = (dispositions[feature.disposition] ?? 0) + 1;
      for (const field of ['owner', 'consumer', 'trigger', 'fallback', 'rationale', 'qualification', 'ssr', 'retention']) text(feature[field], `${feature.id} ${field}`);
      for (const field of ['prerequisites', 'semanticDependencies', 'deferredCosts']) strings(feature[field], `${feature.id} ${field}`);
      if (feature.semanticDependencies.some((tag: string) => !expectedTags.includes(tag))) fail(`${feature.id} has unknown semantic dependencies.`);
      if (feature.deferredCosts.some((cost: string) => !costs.has(cost))) fail(`${feature.id} has unclassified deferred costs.`);
      notes(feature.synchronousConstraints, `${feature.id} synchronous constraints`); notes(feature.reopeningTrigger, `${feature.id} reopening trigger`);
      object(feature.deliveryAxes, `${feature.id} delivery axes`);
      if (JSON.stringify(Object.keys(feature.deliveryAxes).sort()) !== JSON.stringify([...axes].sort())) fail(`${feature.id} must classify every delivery axis exactly once.`);
      for (const axis of axes) text(feature.deliveryAxes[axis], `${feature.id} delivery axis ${axis}`);
      await anchors(feature.evidence, feature.id);
      if (feature.acceptance !== undefined || options.requireFinal && feature.disposition === 'implemented') {
        object(feature.acceptance, `${feature.id} acceptance`);
        if (!['qualified', 'inherited'].includes(feature.acceptance.status)) fail(`${feature.id} acceptance needs qualified or inherited status.`);
        text(feature.acceptance.basis, `${feature.id} acceptance basis`); strings(feature.acceptance.limitations, `${feature.id} acceptance limitations`);
        await anchors(feature.acceptance.evidence, `${feature.id} acceptance`);
      }
    }
  }
  return {schemaVersion: 1, requireFinal: Boolean(options.requireFinal), sourceCommit: input.source.commit, components: input.components.length, features: featureCount, dispositions, evidence: {anchors: anchorCount, blobs: blobs.size, workingTreeAnchors, revisions: [...revisions].sort()}};
}

const git = promisify(execFile);
/** Local command preserves historical Git anchors; live anchors require an explicit revision marker. */
export async function verifyDeliveryInventoryFile(repositoryRoot: string, requireFinal = false): Promise<DeliveryInventoryValidation> {
  const root = resolve(repositoryRoot);
  const input = JSON.parse(await readFile(resolve(root, 'tooling/metadata/delivery-inventory.json'), 'utf8'));
  if (!revision.test(input?.source?.commit)) fail('Invalid source commit.');
  const tree = (await git('git', ['rev-parse', `${input.source.commit}^{tree}`], {cwd: root})).stdout.trim();
  if (tree !== input.source.tree) fail('Declared source tree does not match the source commit.');
  const definitions = await readDefinitionGraph(resolve(root, 'packages/elements'));
  const realRoot = await realpath(root);
  const result = await verifyDeliveryInventory(input, definitions, {requireFinal, readEvidence: async (path, ref) => {
    if (ref === 'working-tree') {
      const actual = await realpath(resolve(root, path));
      if (!actual.startsWith(`${realRoot}${sep}`)) fail(`Working-tree evidence escapes repository: ${path}`);
      return readFile(actual);
    }
    return (await git('git', ['show', `${ref}:${path}`], {cwd: root, encoding: 'buffer', maxBuffer: 32 * 1024 * 1024})).stdout;
  }});
  return result.evidence.workingTreeAnchors ? {...result, workingTreeHead: (await git('git', ['rev-parse', 'HEAD'], {cwd: root})).stdout.trim()} : result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const allowed = new Set(['--require-final']);
  for (const argument of process.argv.slice(2)) if (!allowed.has(argument)) fail(`Unknown option: ${argument}`);
  const root = fileURLToPath(new URL('../../', import.meta.url));
  console.log(JSON.stringify(await verifyDeliveryInventoryFile(root, process.argv.includes('--require-final')), null, 2));
}
