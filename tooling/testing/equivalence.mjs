import { resolve, dirname, relative } from 'node:path';
import { inventoryDigest } from '../evidence/setup.mjs';

// Deliberately reviewed source relationships. Other similar-looking configurations stay separate.
export const configurationAliases = new Map([
  ['probes/scoped-registry/context-regressions.config.ts', 'probes/context-protocol/playwright.config.ts'],
  ['apps/docs/tests/theme-proof.config.ts', 'apps/docs/tests/theme-regression.config.ts'],
  ['apps/docs/tests/theme-composition.config.ts', 'apps/docs/tests/playwright.config.ts'],
]);
function serverIdentity(discovery) {
  const definitions = discovery.webServer ? (Array.isArray(discovery.webServer) ? discovery.webServer : [discovery.webServer]) : [];
  return definitions.map(server => ({ ...server,
    cwd: resolve(dirname(discovery.configFile), server.cwd ?? '.'),
  }));
}
function cases(discovery) {
  return discovery.selected.map(test => {
    const project = discovery.projects.find(project => project.name === test.titlePath[1]);
    if (!project) throw new Error('Unable to bind discovered test to its resolved project');
    if (!test.id || !test.file || !discovery.sourceHashes[test.file]) throw new Error('Missing selected case or assertion source identity');
    const context = { fullyParallel:project.fullyParallel??null,workers:project.workers??null,ignoreSnapshots:project.ignoreSnapshots??null,snapshotDir:project.snapshotDir??null,snapshotPathTemplate:project.snapshotPathTemplate??null,teardown:project.teardown??null,use: project.use, retries: test.retries ?? project.retries, repeatEach: project.repeatEach, expect: project.expect ?? null, metadata: project.metadata ?? null,
      timeout: test.timeout, dependencies: project.dependencies, expectedStatus: test.expectedStatus,
      annotations: test.annotations, file: test.file, source: discovery.sourceHashes[test.file],
      line: test.line, titlePath: test.titlePath.slice(1),
    };
    return { id: test.id, digest: inventoryDigest(context) };
  });
}
/** A source alias is insufficient: require the same verified runtime/fixture/environment and resolved facets. */
export function proveConfigurationAlias(alias, producer, aliasDiscovery, producerDiscovery, binding) {
  if(!aliasDiscovery.resolvedFacetsComplete || !producerDiscovery.resolvedFacetsComplete)throw new Error('Resolved assertion and scheduling facets are incomplete; execute separately');
  if (configurationAliases.get(alias) !== producer) throw new Error('Configuration relationship was not reviewed');
  for (const key of ['candidateDigest', 'fixtureDigest', 'browserDigest', 'environmentDigest']) {
    if (!binding?.alias?.[key] || !binding?.producer?.[key]) throw new Error('Missing actual candidate, fixture, browser or environment identity');
    if (binding.alias[key] !== binding.producer[key]) throw new Error('Candidate, fixture, browser or environment mismatch');
  }
  if (aliasDiscovery.workers !== producerDiscovery.workers || aliasDiscovery.fullyParallel !== producerDiscovery.fullyParallel ||
      inventoryDigest(serverIdentity(aliasDiscovery)) !== inventoryDigest(serverIdentity(producerDiscovery))) throw new Error('Configuration scheduling or producer mismatch');
  const globalFacets = value => ({failurePolicy:value.failurePolicy??null,expect:value.expect ?? null,globalTimeout:value.globalTimeout ?? null,maxFailures:value.maxFailures ?? null,shard:value.shard ?? null});
  if(inventoryDigest(globalFacets(aliasDiscovery))!==inventoryDigest(globalFacets(producerDiscovery)))throw new Error('Configuration assertion or failure policy mismatch');
  const sourceCases = cases(producerDiscovery), aliasCases = cases(aliasDiscovery);
  const byDigest = new Map();
  for (const item of sourceCases) {
    if (byDigest.has(item.digest)) throw new Error('Ambiguous producer test facet');
    byDigest.set(item.digest, item.id);
  }
  const partial = alias === 'apps/docs/tests/theme-composition.config.ts';
  const remaining = [];
  const coverage = aliasCases.flatMap(item => {
    const producerCase = byDigest.get(item.digest);
    if (!producerCase) {
      if (!partial) throw new Error('Alias adds a distinct required facet; execute it separately');
      remaining.push(item.id); return [];
    }
    return [{ aliasCase: item.id, producerCase, facetDigest: item.digest }];
  });
  if (!coverage.length || new Set(coverage.map(item => item.aliasCase)).size !== coverage.length) throw new Error('Empty or duplicate alias selection');
  return { alias, producer, binding, coverage, remaining, equivalenceDigest: inventoryDigest({ alias, producer, binding, coverage, remaining }),
    policy: 'Same-invocation receipt reference only; no completed-result reuse.' };
}

/** Exact Playwright 1.63 test-list format; unsupported delimiters force conservative full execution. */
export function testListLines(discovery, ids) {
 const selected=discovery.selected.filter(item=>ids.includes(item.id));
 if(ids.length!==new Set(ids).size || selected.length!==new Set(ids).size)throw new Error('Unknown or duplicate selected case');
 return selected.map(item=>{
  const project=item.titlePath[1],titles=item.titlePath.slice(3),file=relative(discovery.rootDir,item.file).replaceAll('\\','/');
  if([project,file,...titles].some(text=>/[\n\r›]/.test(text)||text!==text.trim()))throw new Error('Test-list delimiter cannot represent this case safely');
  return [`[${project}]`,file,...titles].join(' › ');
 }).join('\n')+'\n';
}
