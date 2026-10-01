import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const stable = value => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b, 'en'))) : item);
const nameFor = (kind, item) => kind === 'members' ? `${item.kind}:${item.name}:${item.static === true}`
  : kind === 'exports' ? `${item.kind}:${item.name}` : item.name;
const lists = new Set(['declarations','exports','members','attributes','events','slots','cssParts','cssProperties','cssStates']);
function keyed(value, path = '') {
  if (Array.isArray(value)) return value.map((item, index) => keyed(item, path + '/' + index));
  if (!value || typeof value !== 'object') return value;
  const result = Object.create(null);
  for (const [key, item] of Object.entries(value)) {
    if (lists.has(key) && Array.isArray(item)) {
      const mapped = Object.create(null);
      for (const entry of item) {
        const name = nameFor(key, entry);
        if (typeof name !== 'string' || Object.hasOwn(mapped, name)) throw new Error('Missing/duplicate contract key at ' + path + '/' + key + '/' + name);
        mapped[name] = keyed(entry, path + '/' + key + '/' + name);
      }
      result[key] = mapped;
    } else result[key] = keyed(item, path + '/' + key);
  }
  return result;
}
function snapshot(input) {
  if (!['1.0.0', '2.1.0'].includes(input?.schemaVersion) || !Array.isArray(input.modules)) throw new Error('Unsupported CEM comparison input');
  const modules = Object.create(null), provenance = Object.create(null);
  for (const module of input.modules) {
    if (typeof module.path !== 'string' || Object.hasOwn(modules, module.path)) throw new Error('Missing/duplicate module path');
    const {source, ...contract} = module;
    if (source !== undefined) provenance[module.path] = source;
    modules[module.path] = keyed(contract, module.path);
  }
  const {schemaVersion, modules: _modules, ...metadata} = input;
  return {contract: {metadata, modules}, schemaVersion, provenance};
}
function differences(a, b, path = '') {
  if (stable(a) === stable(b)) return [];
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort().flatMap(key => differences(Object.hasOwn(a, key) ? a[key] : undefined, Object.hasOwn(b, key) ? b[key] : undefined, path + '/' + key.replaceAll('~','~0').replaceAll('/','~1')));
  }
  return [{path: path || '/', operation: a === undefined ? 'added' : b === undefined ? 'removed' : 'changed',
    ...(a === undefined ? {} : {before: a}), ...(b === undefined ? {} : {after: b})}];
}
/** Only named-list order, CEM version and module.source provenance are classified separately. */
export function compareCandidateCem(before, after) {
  const old = snapshot(before), candidate = snapshot(after);
  const semanticChanges = differences(old.contract, candidate.contract);
  const schemaChanges = differences(old.schemaVersion, candidate.schemaVersion, '/schemaVersion');
  const sourceProvenanceChanges = differences(old.provenance, candidate.provenance, '/moduleSources');
  return {schemaVersion: 1, rawChanges: differences(before, after), semanticChanges, schemaChanges, sourceProvenanceChanges,
    requiresReview: Boolean(semanticChanges.length || schemaChanges.length || sourceProvenanceChanges.length),
    policy: 'Type/default/privacy/inheritance/reference/docs/customization/absence differences remain exact. No baseline promotion or automatic acceptance.'};
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [before, after, output] = process.argv.slice(2);
  if (!before || !after || !output) throw new Error('Usage: node candidate-compare.mjs <baseline-cem> <candidate-cem> <fresh-output-directory>');
  const result = compareCandidateCem(JSON.parse(await readFile(before, 'utf8')), JSON.parse(await readFile(after, 'utf8')));
  await mkdir(resolve(output));
  await writeFile(resolve(output, 'comparison.json'), JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify({output: resolve(output), semanticChanges: result.semanticChanges.length, requiresReview: result.requiresReview}));
}
