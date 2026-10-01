import { fileURLToPath } from 'node:url';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { activationFor, packageLifecycle } from './command-activation.mjs';
import { root, publicGraph } from './pathways.mjs';
import { inventoryDigest } from '../evidence/setup.mjs';
const excluded=new Set(['node_modules','.git','.cache','.vite','.vite-temp','dist','artifacts','results','test-results','playwright-report','reports','baselines','runs','vendor']);
export async function maintainedFiles(workspaceRoot=root) {
 const paths=[];
 async function visit(directory) {
  for(const entry of await readdir(resolve(workspaceRoot,directory),{withFileTypes:true})) {
   if(excluded.has(entry.name))continue;
   const path=`${directory}/${entry.name}`;
   if(entry.isDirectory())await visit(path);else if(entry.isFile())paths.push(path);
  }
 }
 for(const directory of ['packages','apps','tooling','probes','showcases'])await visit(directory);
 return paths.sort();
}
/** A caller-configured wrapper has no independent fixture or assertion selection. */
export function configurationRole(path) {
 if(path==='tooling/integration-gates/playwright.config.ts')return {kind:'orchestration-wrapper',provider:'tooling/integration-gates/run.mjs',requiredEnvironment:['EN_GATE_CONFIG','EN_GATE_STAGE_OUTPUT'],reason:'The Integration catalog selects a concrete owning config; this wrapper only supplies run-owned output and server settings. Concrete configs remain independently inventoried.'};
 return {kind:'standalone'};
}
/** Unknown custom-program edges are visible blockers, never silently omitted from a complete label. */
export async function workloadManifest() {
 const files=await maintainedFiles(),graph=await publicGraph(),commands=[],installations=[],configs=[],assertions=[],types=[],custom=[],typeConfigurations=[];
 const fileSet=new Set(['package.json','package-lock.json',...files]);
 for(const path of ['package.json',...files]) {
  if(path.endsWith('/package.json')||path==='package.json') {
   const pkg=JSON.parse(await readFile(resolve(root,path),'utf8'));
   commands.push(...packageLifecycle(path,pkg.scripts??{}));
   const lock=path.replace(/package\.json$/,'package-lock.json');
   installations.push({manifest:path,lock:fileSet.has(lock)?lock:null,name:pkg.name??null,engines:pkg.engines??{},packageManager:pkg.packageManager??null,workspaces:pkg.workspaces??null,installation:path==='package.json'?'root-workspace':/^packages\/[^/]+\/package\.json$/.test(path)||path==='apps/docs/package.json'?'root-workspace-member':fileSet.has(lock)?'isolated-locked':'fixture-or-inherited-review-required',activation:activationFor(path),policy:'Retain the documented install flags and isolated package boundary; a lockfile alone does not authorize a new install mode.'});
  }
  if(/(?:^|\/)tsconfig(?:\.[^/]+)?\.json$/.test(path)) {
   const source=await readFile(resolve(root,path),'utf8');
   typeConfigurations.push({path,digest:inventoryDigest(source),activation:activationFor(path),policy:'Resolved through the owning build or explicit consumer-type command; configuration presence alone is not a test typecheck.'});
  }
  if(!/\.([cm]?[jt]s|py)$/.test(path))continue;
  const source=await readFile(resolve(root,path),'utf8'),digest=inventoryDigest(source);
  if(path.includes('config.')&&source.includes('defineConfig')&&source.includes('@playwright/test')){const role=configurationRole(path);configs.push({path,digest,role,activation:activationFor(path),discovery:role.kind==='standalone'?['node',path.startsWith('showcases/performance-results/')?'showcases/performance-results/node_modules/@playwright/test/cli.js':'node_modules/@playwright/test/cli.js','test','--config',path,'--list','--reporter=list']:null,facetPolicy:'Keep exact configured projects, media, viewport, engine, delivery and fixture'});}
  if(/\.(test|spec)\.([cm]?[jt]s|py)$/.test(path))assertions.push({path,digest,activation:activationFor(path),kind:path.endsWith('.py')?'python':source.includes('@playwright/test')?'browser-or-hybrid':source.includes('node:test')?'node':'case-registration'});
  if(/consumer.*\.ts$/.test(path))types.push({path,digest,activation:activationFor(path)});
  if(path.startsWith('showcases/performance/experiments/')||/\/(?:verify[^/]*|probe|campaign|calibrate[^/]*|check[^/]*|audit[^/]*|measure[^/]*|functional|qualify[^/]*|smoke|secondary|inspect[^/]*|prepare[^/]*|analyze|report[^/]*|snapshot|freeze|consumer-types|assets|extended|scaling|range-regression|warm-proof)\.(mjs|py)$/.test(path))custom.push({path,digest,activation:activationFor(path),status:'requires-explicit-activation-review',reason:'Cannot infer required CLI options, historical fixture scope or performance protocol from filename.'});
 }
 return {schemaVersion:1,complete:false,graph,commands,installations,configs,assertions,types,typeConfigurations,typeCoverage:{production:'Owning package/docs build and check commands retain their existing TypeScript project selections.',consumers:'Explicit consumer-types, scoped-registry, breadcrumbs and primitives type commands retain their original files and flags.',testSources:{status:'no-existing-complete-test-typecheck',reason:'Node TypeScript stripping and Playwright transformation execute tests but do not typecheck them. Production project selections exclude tests; the manifest must not claim a pre-existing all-test-types gate.',selection:assertions.filter(item=>/\.[cm]?ts$/.test(item.path)).map(item=>item.path)}},custom,resourcePolicy:{correctnessWorkers:3,performance:'exclusive serial; retain sample counts and collector controls'},reusePolicy:{setup:'content-verified immutable outputs',completedResults:false,changedOnly:false},manual:['physical device','assistive technology','IME'],countReconciliation:{staticEquivalentBrowserCandidates:486,apiReleaseThemeRepeatedInvocations:846,additive:false,reason:'Intersecting scopes; only identical graph task IDs currently deduplicated.'}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await workloadManifest(),null,2));
