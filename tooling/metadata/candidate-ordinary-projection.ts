import {createHash} from 'node:crypto';
import {resolve, relative, isAbsolute} from 'node:path';
import {ts} from './compiler-api.mjs';
import {constructorCohort} from './candidate-constructor-cohort.ts';
import {guardParsedSources} from './captured-compiler-program.ts';

function jsonText(value:any,omitUndefined=false,ancestors=new Set<object>()):string {
  if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
  if(typeof value!=='object'||value===null)throw new Error('Ordinary projection requires plain JSON data');
  const array=Array.isArray(value),prototype=Object.getPrototypeOf(value);
  if(prototype!==(array?Array.prototype:Object.prototype)&&!(prototype===null&&!array))
    throw new Error('Ordinary projection requires plain JSON prototypes');
  if(ancestors.has(value))throw new Error('Ordinary projection requires acyclic JSON data');
  ancestors.add(value);
  try {
    const keys=Reflect.ownKeys(value),descriptors=new Map<string,PropertyDescriptor>();
    for(const key of keys) {
      if(typeof key!=='string')throw new Error('Ordinary projection rejects symbol properties');
      const descriptor=Object.getOwnPropertyDescriptor(value,key)!;
      if(!('value' in descriptor)||(!descriptor.enumerable&&!(array&&key==='length')))
        throw new Error('Ordinary projection rejects accessors and non-enumerable properties');
      descriptors.set(key,descriptor);
    }
    if(array) {
      const length=descriptors.get('length')!.value;
      if(descriptors.size!==length+1)throw new Error('Ordinary projection requires dense JSON arrays without extra properties');
      const elements:string[]=[];
      for(let index=0;index<length;index++) {
        const descriptor=descriptors.get(String(index));
        if(!descriptor)throw new Error('Ordinary projection requires dense JSON arrays');
        elements.push(jsonText(descriptor.value,omitUndefined,ancestors));
      }
      return '['+elements.join(',')+']';
    }
    const properties:string[]=[];
    for(const [key,descriptor] of descriptors) {
      if(omitUndefined&&descriptor.value===undefined)continue;
      properties.push(JSON.stringify(key)+':'+jsonText(descriptor.value,omitUndefined,ancestors));
    }
    return '{'+properties.join(',')+'}';
  } finally {ancestors.delete(value);}
}

const owners = new WeakMap<object, any>();
const digest = (value: any) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const same = (left: readonly any[], right: readonly any[]) => left.length === right.length && left.every((value, index) => value === right[index]);
function freeze(value: any): any {
  if (value && typeof value === 'object') {for (const item of Object.values(value)) freeze(item); Object.freeze(value);}
  return value;
}

/** Bind an ordinary producer's completed rows to exact original Program nodes.
 * This is an internal routing seam, not a metadata-extraction or visibility
 * certificate. The merged producer must still run strict source validation.
 */
export function bindOrdinaryProjection(program: any, sources: readonly any[], sourceRoot: string, cohort: any,
  entries: ReadonlyArray<{node: any; module: string; declaration: any}>,
  definitionEntries: ReadonlyArray<{source: any; node: any; edge: any}> = []) {
  const selected = [...sources], root = resolve(sourceRoot), checker = program.getTypeChecker();
  const sourcePath = (source: any) => {
    if (!selected.includes(source) || program.getSourceFile(source.fileName) !== source) throw new Error('Ordinary projection source is outside its exact Program');
    const path = relative(root, resolve(source.fileName)).replaceAll('\\', '/');
    if (!path || path === '..' || path.startsWith('../') || isAbsolute(path)) throw new Error('Ordinary projection source escapes its root');
    return path;
  };
  const expected = constructorCohort(program, selected, sourcePath);
  if (cohort?.program !== program || !same(cohort.sources, selected) || !same(cohort.roots, expected.roots)
    || !same(cohort.ordinary, expected.ordinary) || !same(cohort.support, expected.support) || !same(cohort.factories, expected.factories)) {
    throw new Error('Ordinary projection requires the exact checked declaration cohort');
  }
  if (entries.length !== expected.ordinary.length) throw new Error('Ordinary projection must cover every ordinary declaration exactly once');
  const rows = new Map<any, any>(), nodes = new Map<any, any>(), descriptors: any[] = [];
  const sourceSnapshots = new Map(selected.map(source => [source, source.text]));
  const assertSyntax = guardParsedSources(selected);
  for (const {node, module, declaration} of entries) {
    if (!expected.ordinary.includes(node)) throw new Error('Ordinary projection entry has no unique selected class identity');
    const source = node.getSourceFile();
    if (!expected.ordinary.includes(node) || !ts.isClassDeclaration(node) || !node.name || node.parent !== source
      || program.getSourceFile(source.fileName) !== source || module !== sourcePath(source) || rows.has(node)) {
      throw new Error('Ordinary projection entry has no unique selected class identity');
    }
    const row = freeze(JSON.parse(jsonText(declaration)));
    if (!row || row.kind !== 'class' || row.name !== node.name.text || Object.hasOwn(row, 'x-en-constructor-composition')) {
      throw new Error('Ordinary projection entry is not an ordinary class contract');
    }
    rows.set(node, row); nodes.set(row, node);
    descriptors.push({module, name: node.name.text, kind: node.kind, start: node.getStart(source), end: node.end,
      sourceSha256: createHash('sha256').update(source.text).digest('hex'), declarationSha256: digest(row)});
  }
  if (expected.ordinary.some(node => !rows.has(node))) throw new Error('Ordinary declaration coverage is incomplete');
  const definitions: any[] = [], definitionKeys = new Set<string>();
  for (const {source, node, edge} of definitionEntries) {
    const module = sourcePath(source), declaration = rows.get(node), value = freeze(JSON.parse(jsonText(edge)));
    if (!declaration || value.kind !== 'custom-element-definition' || typeof value.name !== 'string' || !value.name
      || declaration.tagName !== value.name || declaration.customElement !== true || value.declaration?.package !== undefined
      || value.declaration?.name !== node.name.text || value.declaration?.module !== sourcePath(node.getSourceFile())) {
      throw new Error('Ordinary definition has no exact projected class target');
    }
    const key = JSON.stringify([module, value.name]);
    if (definitionKeys.has(key)) throw new Error('Duplicate ordinary definition edge');
    definitionKeys.add(key); definitions.push(Object.freeze({source, node, module, edge: value}));
  }
  for (const [node, declaration] of rows) if (declaration.tagName && !definitions.some(row => row.node === node)) {
    throw new Error('Tagged ordinary class has no completed producer definition edge');
  }
  const portable = freeze({version: 1, declarations: descriptors,
    definitions: definitions.map(row => ({module: row.module, edge: row.edge}))});
  const packet = Object.freeze({portable, qualified: false,
    scope: 'exact ordinary declaration projection only; extraction, export visibility and merged production validation remain required'});
  owners.set(packet, {program, checker, sources: selected, sourceSnapshots, assertSyntax, cohort: expected, sourcePath, definitions, roots: [...cohort.roots], rows, nodes, sourceRoot: root});
  return packet;
}

export function assertOrdinaryProjection(packet: any, program: any, sources: readonly any[], roots: readonly any[]) {
  const owner = packet && owners.get(packet);
  if (!owner || owner.program !== program || owner.checker !== program.getTypeChecker()
    || !same(owner.sources, sources) || !same(owner.roots, roots)) throw new Error('Ordinary projection belongs to different extraction inputs');
  owner.assertSyntax();
  const current = constructorCohort(program, owner.sources, owner.sourcePath);
  if (['roots', 'ordinary', 'support', 'factories'].some(key => !same(current[key], owner.cohort[key]))) throw new Error('Ordinary projection declaration cohort changed');
  for (const source of owner.sources) {
    if (program.getSourceFile(source.fileName) !== source || source.text !== owner.sourceSnapshots.get(source)) {
      throw new Error('Ordinary projection source identity changed');
    }
  }
  return Object.freeze({sourceRoot: owner.sourceRoot, portable: packet.portable,
    declarationFor(node: any) {return owner.rows.get(node);},
    nodeFor(declaration: any) {return owner.nodes.get(declaration);},
    definitions() {return Object.freeze([...owner.definitions]);},
    entries() {return Object.freeze([...owner.rows].map(([node, declaration]) => Object.freeze({node, declaration})));},
  });
}
