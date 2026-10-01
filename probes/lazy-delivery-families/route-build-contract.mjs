import { readFile, readdir, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { digest, inventoryFiles } from '../lazy-delivery-performance/source-seal.mjs';

export const runtimeExclusions = Object.freeze(['.cache', '.bin', '.vite', '.vite-temp', '@en-reve/docs']);
export const acceptedReferenceHead = '806886d104febb0b3deb4aef2b3e4dad7947ae87';
export function assertSourceSubjects(subjects) {
  if (subjects.reference?.seal?.git?.head !== acceptedReferenceHead) throw new Error('Reference is not the frozen accepted Git commit: ' + acceptedReferenceHead);
  for (const subject of Object.values(subjects)) if (subject.seal.git.dirty || subject.seal.git.status) throw new Error('Production subjects require clean committed source seals');
  if (subjects.reference.seal.rootLockSha256 !== subjects.candidate?.seal?.rootLockSha256) throw new Error('Matched docs subjects require the same exact dependency lock');
  if (subjects.reference.seal.performanceLockSha256 !== subjects.candidate.seal.performanceLockSha256) throw new Error('Matched docs subjects require the same exact performance lock');
}
/** Runtime code is immutable; build caches and the unconsumed docs workspace link are disclosed exclusions. */
export async function runtimeInventory(root) {
  const paths = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name), name = relative(root, path).replaceAll('\\', '/');
      if (runtimeExclusions.some(excluded => name === excluded || name.startsWith(excluded + '/'))) continue;
      if (entry.isDirectory()) await visit(path); else paths.push(name);
    }
  }
  await visit(root);
  return inventoryFiles(root, paths.sort());
}

/** Retained descriptor history for parser regressions; this is not the active acquisition scope. */
export const historicalRouteSubjects = Object.freeze([
  { id: 'media', workload: 'media2images', route: '/component-patterns.html', source: 'apps/docs/src/component-patterns.ts', tag: 'en-media-viewer', identity: ['id', 'viewer'], ssr: { supported: false, reason: 'The existing component-patterns production route renders this specimen on the client; the production SSR entry has no corresponding route renderer.' } },
  { id: 'combobox', workload: 'combobox40projects', route: '/workflows/selection.html', source: 'apps/docs/src/workflows/selection/template.ts', tag: 'en-combobox', identity: ['name', 'project'], ssr: { supported: true, exportName: 'renderWorkflows', args: ['selection'] } },
  { id: 'editor', workload: 'contextual-richtext-toolbar', route: '/api-examples/rich-text.html', source: 'apps/docs/src/rich-text-demo.ts', tag: 'en-editor-toolbar', identity: ['id', 'selection-toolbar'], ssr: { supported: true, exportName: 'renderAPIExample', args: ['rich-text'] } },
  { id: 'command', workload: 'settings4commands', route: '/workflows/settings.html', source: 'apps/docs/src/workflows/settings/template.ts', tag: 'en-command-palette', identity: ['id', 'settings-command-palette'], ssr: { supported: true, exportName: 'renderWorkflows', args: ['settings'] } },
  {
    id: 'pagination', workload: 'pagination7pagers', route: '/api-examples/pagination.html', source: 'apps/docs/src/examples.ts', tag: 'en-pagination',
    sourceRegion: { start: '// example-start:pagination', end: '// example-end:pagination' },
    targets: [
      { id: 'primary', identity: ['id', 'api-pagination'] },
      { id: 'intermediate', identity: ['id', 'api-pagination-intermediate'] },
      { id: 'mobile', identity: ['id', 'api-pagination-mobile'] },
      { id: 'start-aligned', identity: ['class', 'pagination-start'] },
      { id: 'distributed', identity: ['class', 'pagination-distributed'] },
      { id: 'text-slotted', identity: ['label', 'Text slot example pages'] },
    ],
    unmodifiedControls: [
      { id: 'icon-slotted-eager', identity: ['id', 'api-pagination-slotted'], reason: 'Existing known-total icon-slot specimen remains eager; it is not an accepted opt-in target.' },
      { id: 'unknown-total', identity: ['id', 'api-pagination-unknown'], reason: 'Existing unknown-total specimen already has no chooser body and remains unchanged.' },
    ],
    population: { totalHosts: 8, knownTotalHosts: 7, onDemandTargets: 6, eagerKnownTotalControls: 1, unknownTotalControls: 1 },
    ssr: { supported: true, exportName: 'renderAPIExample', args: ['pagination'] },
  },
]);

/** Fresh acquisition follows the qualified common button fix and the retained family dispositions. */
export const activeFamilies = Object.freeze(['combobox', 'command']);
export const routeSubjects = Object.freeze(historicalRouteSubjects.filter(subject => activeFamilies.includes(subject.id)));
export function assertActiveFamilies(families) {
  if (!Array.isArray(families) || !families.length || new Set(families).size !== families.length || families.some(family => !activeFamilies.includes(family))) throw new Error('Active acquisition permits only combobox and command; rejected, unknown or repeated families require a new reviewed protocol');
}

// These reviewed authored tags contain ordinary Lit ${...} expressions. Skip
// their JavaScript when finding the closing angle bracket: an arrow is not HTML.
// Unsupported interpolation syntax fails closed and requires a new source review.
function interpolationEnd(source, start) {
  let depth = 1;
  for (let index = start + 2; index < source.length; index++) {
    const char = source[index];
    if (char === "'" || char === '"') {
      const quote = char; let closed = false;
      for (++index; index < source.length; index++) {
        if (source[index] === '\\') { index++; continue; }
        if (source[index] === quote) { closed = true; break; }
      }
      if (!closed) throw new Error('Unterminated quoted expression in authored policy target');
    } else if (char === '`' || char === '/') throw new Error('Unsupported interpolation syntax in authored policy target');
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return index + 1;
  }
  throw new Error('Unterminated interpolation in authored policy target');
}

function openingTags(source, tag) {
  const start = new RegExp(`<${tag}(?=\\s|>)`, 'g'), tags = [];
  for (let match; (match = start.exec(source));) {
    let quote = null, literal = '', closed = false;
    for (let index = match.index; index < source.length; index++) {
      const char = source[index];
      if (char === '$' && source[index + 1] === '{') {
        const end = interpolationEnd(source, index);
        literal += ' '.repeat(end - index); index = end - 1; continue;
      }
      literal += char;
      if (quote) { if (char === quote) quote = null; }
      else if (char === '"' || char === "'") quote = char;
      else if (char === '>') {
        tags.push({ index: match.index, before: source.slice(match.index, index + 1), literal });
        start.lastIndex = index + 1; closed = true; break;
      }
    }
    if (!closed) throw new Error('Unterminated authored policy target: ' + tag);
  }
  return tags;
}

function targetOverlay(source, descriptor, policy, reference) {
  const [attribute, value] = descriptor.identity;
  const identity = new RegExp(`\\s${attribute}="${value}"`);
  const matches = openingTags(source, descriptor.tag).filter(tag => identity.test(tag.literal));
  if (matches.length !== 1) throw new Error(`${descriptor.id}: expected exactly one original route target, found ${matches.length}`);
  const { before, literal } = matches[0], policies = [...literal.matchAll(/\scontent-rendering="([^"]*)"/g)];
  if ([...literal.matchAll(/\scontent-rendering(?=\s|=|>)/g)].length !== policies.length || /\.contentRendering\s*=/.test(literal)) throw new Error(descriptor.id + ': policy overlay requires one literal authored attribute');
  if (policies.length > 1 || (policies.length && !['eager', 'on-demand'].includes(policies[0][1]))) throw new Error(descriptor.id + ': unsupported authored construction policy');
  if (reference && policies[0]?.[1] === 'on-demand') throw new Error('Accepted reference route already opts in: ' + descriptor.id);
  let after = before;
  if (!reference) after = policies.length ? before.slice(0, policies[0].index) + ` content-rendering="${policy}"` + before.slice(policies[0].index + policies[0][0].length) : before.replace(new RegExp(`^<${descriptor.tag}(?=\\s|>)`), `<${descriptor.tag} content-rendering="${policy}"`);
  return { id: descriptor.id, identity: descriptor.identity, index: matches[0].index, before, after };
}

export function policyOverlay(source, descriptor, policy, { reference = false } = {}) {
  if (!['eager', 'on-demand'].includes(policy) || reference && policy !== 'eager') throw new Error('Unsupported production route policy: ' + policy);
  let region = source, offset = 0;
  if (descriptor.sourceRegion) {
    const { start, end } = descriptor.sourceRegion;
    if (source.split(start).length !== 2 || source.split(end).length !== 2) throw new Error(descriptor.id + ': expected one exact authored source region');
    offset = source.indexOf(start) + start.length;
    const endIndex = source.indexOf(end);
    if (endIndex < offset) throw new Error(descriptor.id + ': authored source region is reversed');
    region = source.slice(offset, endIndex);
  }
  const targets = (descriptor.targets ?? [descriptor]).map(target => targetOverlay(region, { tag: descriptor.tag, ...target }, policy, reference));
  const controls = (descriptor.unmodifiedControls ?? []).map(target => ({ ...targetOverlay(region, { tag: descriptor.tag, ...target }, 'eager', true), reason: target.reason }));
  if (!targets.length || new Set([...targets, ...controls].map(target => target.index)).size !== targets.length + controls.length) throw new Error(descriptor.id + ': policy targets and unmodified controls must be distinct');
  if (descriptor.population && (openingTags(region, descriptor.tag).length !== descriptor.population.totalHosts || targets.length !== descriptor.population.onDemandTargets || targets.length + controls.length !== descriptor.population.totalHosts)) throw new Error(descriptor.id + ': authored population differs from the frozen workload');
  let executed = source;
  for (const target of [...targets].sort((a, b) => b.index - a.index)) {
    const index = offset + target.index;
    executed = executed.slice(0, index) + target.after + executed.slice(index + target.before.length);
  }
  const publicTarget = ({ index, ...target }) => target;
  return { source: executed, ...(descriptor.targets ? {} : { before: targets[0].before, after: targets[0].after }), targets: targets.map(publicTarget), unmodifiedControls: controls.map(publicTarget) };
}

export async function applyRoutePolicies(root, policy, { reference = false, families = activeFamilies } = {}) {
  assertActiveFamilies(families);
  const overlays = [];
  for (const descriptor of routeSubjects.filter(subject => families.includes(subject.id))) {
    const path = resolve(root, descriptor.source), original = await readFile(path, 'utf8');
    const applied = policyOverlay(original, descriptor, policy, { reference });
    if (applied.source !== original) await writeFile(path, applied.source);
    overlays.push({ kind: 'authored-construction-policy', routeSubject: descriptor.id, path: descriptor.source, policy, changed: applied.source !== original, originalSha256: digest(original), executedSha256: digest(applied.source), before: applied.before, after: applied.after, targets: applied.targets, unmodifiedControls: applied.unmodifiedControls });
  }
  return overlays;
}

/** Parse final production HTML, then follow the bundler's actual static chunk graph. */
export function routeEntryAssets(html, route, graph, parse) {
  const document = parse(html), roots = new Set();
  function localAsset(value) {
    const url = new URL(value, 'https://fixture.invalid' + route);
    if (url.origin !== 'https://fixture.invalid') throw new Error('Production route has an external executable entry: ' + value);
    return decodeURIComponent(url.pathname).replace(/^\//, '');
  }
  function visit(node) {
    const attrs = Object.fromEntries((node.attrs ?? []).map(attribute => [attribute.name, attribute.value]));
    if (node.tagName === 'script' && (!attrs.type || ['module', 'text/javascript', 'application/javascript'].includes(attrs.type))) {
      if (attrs.src) roots.add(localAsset(attrs.src));
      else if ((node.childNodes ?? []).some(child => child.value?.trim())) throw new Error('Inline executable script needs an explicit parser-backed dependency receipt: ' + route);
    }
    if (node.tagName === 'link' && (attrs.rel ?? '').split(/\s+/).includes('modulepreload') && attrs.href) roots.add(localAsset(attrs.href));
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(document);
  if (!roots.size) throw new Error('No executable production entry found: ' + route);
  const closure = new Set();
  function include(path) {
    if (closure.has(path)) return;
    const chunk = graph.chunks.find(chunk => chunk.fileName === path);
    if (!chunk) throw new Error(`Missing emitted JavaScript chunk for ${route}: ${path}`);
    closure.add(path);
    for (const dependency of chunk.imports) include(dependency);
  }
  for (const path of roots) include(path);
  return { roots: [...roots].sort(), assets: [...closure].sort(), policy: 'Final HTML script/modulepreload entries parsed with parse5, followed through emitted static chunk.imports; dynamic imports and settled browser traffic are separate.' };
}
