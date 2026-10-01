import {readFile, writeFile, rename} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {digestJson, digestBytes} from '../evidence/identity.ts';
import {verifyGeneratedElements} from './generate-elements.ts';
import {verifyDefinitionEntries, type SourceDefinition} from './definition-graph.ts';
import type {TypeSnapshot} from './type-snapshot.ts';
import {verifyTypeSnapshot} from './prepared-types.ts';
import {createReferenceResolver} from './references.ts';
import {publicEntryPolicy, eventBehavior} from './public-policy.ts';

export async function generatePublicGraph(packageRoot: string) {
  const [, typed, definitions] = await Promise.all([verifyGeneratedElements(packageRoot), verifyTypeSnapshot(packageRoot), verifyDefinitionEntries(packageRoot)]);
  const manifest = JSON.parse(await readFile(join(packageRoot,'custom-elements.json'),'utf8'));
  const receipt = JSON.parse(await readFile(join(packageRoot,'custom-elements.json.receipt.json'),'utf8'));
  return assemblePublicGraph(manifest, receipt, typed.snapshot, definitions);
}

/** Assemble already verified inputs; callers retain responsibility for source freshness. */
export async function assemblePublicGraph(manifest: any, receipt: any, types: TypeSnapshot, definitions: SourceDefinition[]) {
  if (digestJson(manifest) !== receipt.manifestDigest) throw new Error('Public graph CEM does not match its receipt.');
  const catalog = definitions.map(({tagName, className}) => ({tagName, className}));
  if (digestJson(catalog) !== receipt.catalogDigest) throw new Error('Public graph catalog does not match its CEM receipt.');
  if (types.schemaVersion !== 1 || !Array.isArray(types.gaps) || types.gaps.length) throw new Error('Public graph requires a complete type snapshot.');
  const resolver = createReferenceResolver(manifest);
  const supported = new Set(publicEntryPolicy.additionalEntries.map(path => types.packageName + (path === '.' ? '' : path.slice(1))));
  for (const definition of definitions) for (const path of [definition.tagName.slice(3), 'define/'+definition.tagName.slice(3), 'definitions/'+definition.tagName.slice(3)]) supported.add(types.packageName+'/'+path+'.js');
  for (const path of supported) if (!types.entrypoints[path]) throw new Error(`Supported entrypoint is not exported: ${path}`);
  const components = definitions.map(definition => {
    const resolved = resolver({name: definition.className, module: definition.classSource}, definition.source);
    if (!resolved?.declaration.tagName || resolved.declaration.tagName !== definition.tagName) throw new Error(`Unresolved registered class: ${definition.tagName}`);
    const declaration = resolved.declaration;
    const classImport = types.packageName+'/'+definition.tagName.slice(3)+'.js';
    const typeId = types.exports[classImport+'#'+definition.className];
    if (!typeId || !types.declarations[typeId]) throw new Error(`No public class type for ${definition.tagName}`);
    const contracts = receipt.eventContracts ?? [];
    const events = (declaration.events ?? []).filter((event: any) => !['private','protected'].includes(event.privacy)).map((event: any) => {
      const origin = event.inheritedFrom ? resolver(event.inheritedFrom, resolved.modulePath) : resolved;
      const contract = contracts.find((entry: any) => entry.name === event.name && entry.source === origin?.modulePath && entry.className === origin?.declaration.name)
        ?? contracts.find((entry: any) => entry.name === event.name && entry.source === resolved.modulePath && entry.className === declaration.name);
      if (!contract || !event.type?.text || event.type.text === 'CustomEvent') throw new Error(`Unclassified or untyped public event: ${definition.tagName}.${event.name}`);
      return {...event, type: contract.type, detail: contract.detail, behavior: eventBehavior(definition.tagName,event.name)};
    });
    return {tagName: definition.tagName, className: definition.className, source: resolved.modulePath, typeId, classImport,
      definitionImport: types.packageName+'/define/'+definition.tagName.slice(3)+'.js',
      definition: definition.source, dependencies: definition.dependencies.map(item => item.tagName),
      members: (declaration.members ?? []).filter((member: any) => !['private','protected'].includes(member.privacy)),
      attributes: declaration.attributes ?? [], events, slots: declaration.slots ?? [], parts: declaration.cssParts ?? [], cssProperties: declaration.cssProperties ?? []};
  });
  return {schemaVersion: 1, packageName: types.packageName, policy: publicEntryPolicy,
    generatorDigest: digestBytes(await readFile(fileURLToPath(import.meta.url))) + ':' + digestBytes(await readFile(new URL('./public-policy.ts',import.meta.url))),
    manifestDigest: receipt.manifestDigest, typeDigest: digestJson(types),
    entrypoints: Object.fromEntries(Object.entries(types.entrypoints).map(([path,source]) => [path,{source,supported:supported.has(path)}])),
    components, types,
    limits: ['Type graphs retain external dependency identities, not their declaration bodies.', 'Rendered Parts evidence covers named fixture states; no finite matrix proves all application states.', 'Behavior metadata is an authored contract; browser transaction and event tests remain required.']};
}

export async function verifyPublicGraph(packageRoot: string) {
  const graph = JSON.parse(await readFile(join(packageRoot,'public-api.json'),'utf8'));
  const generated = await generatePublicGraph(packageRoot);
  if (digestJson(graph) !== digestJson(generated)) throw new Error('Public API graph is stale; run npm run metadata.');
  return graph;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = resolve(fileURLToPath(new URL('../../packages/elements/',import.meta.url)));
  const check = process.argv.includes('--check');
  const graph = await (check ? verifyPublicGraph(root) : generatePublicGraph(root));
  if (!check) {const file=join(root,'public-api.json'), temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(graph,null,2)+'\n');await rename(temp,file);}
  console.log(JSON.stringify({components:graph.components.length,entrypoints:Object.keys(graph.entrypoints).length,digest:digestJson(graph),checked:check}));
}
