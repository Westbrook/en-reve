import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { relative } from 'node:path';
const hash=value=>createHash('sha256').update(value).digest('hex');
function clean(value,key='') {
 if(value===undefined)return null;
 if(typeof value==='function')return {functionSource:hash(String(value))};
 if(value instanceof RegExp)return {regex:value.source,flags:value.flags};
 if(value && typeof value==='object') {
  if(Array.isArray(value))return value.map(item=>clean(item));
  if(['env','httpCredentials','extraHTTPHeaders','proxy'].includes(key))return {contentDigest:hash(JSON.stringify(value))};
  return Object.fromEntries(Object.entries(value).map(([name,item])=>[name,clean(item,name)]));
 }
 return value;
}
/** Explicit stdout-only discovery. Never writes a configured test report or claims execution. */
export default class SelectionReporter {
 onBegin(config,suite) {
  // Playwright's public FullProject omits expect and project-level scheduling.
  // Bind the pinned runtime's resolved internal object; missing access disables aliases.
  const internal=Object.getOwnPropertySymbols(config).map(symbol=>config[symbol]).find(value=>value?.config===config && Array.isArray(value.projects));
  const internals=new Map((internal?.projects??[]).map(project=>[project.project,project]));
  const resolvedFacetsComplete=config.version==='1.63.0' && config.projects.every(project=>internals.has(project));
  const tests=suite.allTests(),files=[...new Set(tests.map(test=>test.location.file))].sort();
  const sourceHashes=Object.fromEntries(files.map(file=>[file,hash(readFileSync(file))]));
  const data={schemaVersion:1,kind:'discovery-only',playwright:config.version,resolvedFacetsComplete,configFile:config.configFile,rootDir:config.rootDir,workers:config.workers,forbidOnly:config.forbidOnly,fullyParallel:config.fullyParallel,globalTimeout:config.globalTimeout,maxFailures:config.maxFailures,shard:config.shard,failurePolicy:clean({forbidOnly:config.forbidOnly,failOnFlakyTests:config.failOnFlakyTests,retryStrategy:internal?.retryStrategy,globalSetups:internal?.globalSetups,globalTeardowns:internal?.globalTeardowns,updateSnapshots:config.updateSnapshots,updateSourceMethod:config.updateSourceMethod}),webServer:clean(internal?.webServers??config.webServer),
   projects:config.projects.map(project=>({name:project.name,expect:clean(internals.get(project)?.expect),fullyParallel:internals.get(project)?.fullyParallel??config.fullyParallel,workers:internals.get(project)?.workers??config.workers,ignoreSnapshots:project.ignoreSnapshots,snapshotDir:project.snapshotDir,snapshotPathTemplate:clean(internals.get(project)?.snapshotPathTemplate),teardown:project.teardown??null,metadata:clean(project.metadata),testDir:project.testDir,use:clean(project.use),testMatch:clean(project.testMatch),testIgnore:clean(project.testIgnore),retries:project.retries,repeatEach:project.repeatEach,timeout:project.timeout,dependencies:project.dependencies})),sourceHashes,
   selected:tests.map(test=>({id:test.id,titlePath:test.titlePath(),file:test.location.file,line:test.location.line,expectedStatus:test.expectedStatus,retries:test.retries,timeout:test.timeout,annotations:test.annotations})),environmentDigest:hash(JSON.stringify(Object.fromEntries(Object.entries(process.env).sort())))};
  console.log('EN_EXECUTION_DISCOVERY '+JSON.stringify(data));
 }
 printsToStdio(){return true;}
}
