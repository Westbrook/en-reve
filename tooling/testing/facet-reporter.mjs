import { mkdir, rename, writeFile } from 'node:fs/promises';
import { readFileSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
/** Execution-only companion receipt. Discovery must explicitly select --reporter=list. */
export default class FacetReporter {
  constructor(options = {}) { this.outputFile=options.outputFile; this.results=[]; this.errors=[]; }
  onBegin(config, suite) {
    if (!this.outputFile) throw new Error('Facet reporter needs a caller-owned outputFile');
    this.start=performance.now();
    const tests=suite.allTests(), files=[...new Set(tests.map(test=>test.location.file))].sort();
    const sourceHashes=Object.fromEntries(files.map(file=>[relative(config.rootDir,file),sha(readFileSync(file))]));
    const gaps=[];
    const clean=(value,path)=>JSON.parse(JSON.stringify(value,(key,item)=>{
      if(typeof item==='function') {gaps.push(`${path}.${key}: function retained in source identity`);return {functionSource:sha(String(item))};}
      if(item instanceof RegExp)return {regex:item.source,flags:item.flags};return item;
    }));
    this.receipt={schemaVersion:1,kind:'fresh-execution',argv:process.argv,startedAt:new Date().toISOString(),node:process.version,platform:process.platform,arch:process.arch,workers:config.workers,sourceHashes,
      projects:config.projects.map(project=>({name:project.name,outputDir:project.outputDir,use:clean(project.use,project.name),testMatch:clean(project.testMatch,project.name),testIgnore:clean(project.testIgnore,project.name),retries:project.retries,repeatEach:project.repeatEach,timeout:project.timeout})),
      selected:tests.map(test=>({id:test.id,titlePath:test.titlePath(),file:relative(config.rootDir,test.location.file),line:test.location.line,expectedStatus:test.expectedStatus,retries:test.retries,timeout:test.timeout,annotations:test.annotations})),serializationGaps:gaps,environmentDigest:sha(JSON.stringify(Object.fromEntries(Object.entries(process.env).sort()))),results:this.results,errors:this.errors};
    // Playwright does not await onBegin. Finish identity collection and the initial
    // write synchronously so fast cases cannot overwrite or outrun initialization.
    const file=resolve(this.outputFile),temporary=`${file}.${randomUUID()}.tmp`;
    mkdirSync(dirname(file),{recursive:true});
    writeFileSync(temporary,JSON.stringify({...this.receipt,status:'running'},null,2)+'\n');
    renameSync(temporary,file);
  }
  onError(error) { this.errors.push(error); }
  onTestEnd(test,result) {
    this.results.push({id:test.id,titlePath:test.titlePath(),status:result.status,expectedStatus:test.expectedStatus,retry:result.retry,durationMs:result.duration,workerIndex:result.workerIndex,parallelIndex:result.parallelIndex,annotations:test.annotations,errors:result.errors});
  }
  async onEnd(result) {await this.save(result.status);}
  async save(status) {
    const file=resolve(this.outputFile);await mkdir(dirname(file),{recursive:true});
    const temporary=`${file}.${randomUUID()}.tmp`;
    await writeFile(temporary,JSON.stringify({...this.receipt,status,wallMs:performance.now()-this.start,maximumCaseMs:Math.max(0,...this.results.map(result=>result.durationMs))},null,2)+'\n');await rename(temporary,file);
  }
}
