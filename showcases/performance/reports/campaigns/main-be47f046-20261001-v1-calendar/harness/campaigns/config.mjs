import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export const lab = fileURLToPath(new URL('../', import.meta.url));
export const repo = resolve(lab, '../..');
export const safeId = id => typeof id === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,95}$/.test(id);
export function validate(config) {
  const keys = ['schemaVersion','kind','systems','profiles','caches','seed','suites','samples','calendarSamples','preparedSamples','lighthouseSamples','memorySamples','suiteOptions','referenceCampaign'];
  if (Object.keys(config).some(k => !keys.includes(k))) throw Error('Unknown campaign configuration field');
  if (config.schemaVersion !== 1 || !['native','calendar','current'].includes(config.kind)) throw Error('Expected schemaVersion 1 and native/calendar/current kind');
  const registry = JSON.parse(readFileSync(resolve(lab,'registry/systems.json')));
  const profiles = JSON.parse(readFileSync(resolve(lab,'profiles/profiles.json')));
  for (const [key, allowed] of [['systems',registry.map(s=>s.id)],['profiles',Object.keys(profiles)],['caches',['cold','warm']],['suites',['load','startup','interactions','diagnostic','memory','lighthouse','bfcache','overhead']]]) {
    if (!Array.isArray(config[key]) || !config[key].length || new Set(config[key]).size !== config[key].length || config[key].some(x=>!allowed.includes(x))) throw Error('Invalid '+key);
  }
  if (!Number.isSafeInteger(config.seed) || config.seed < 0) throw Error('Nonnegative integer seed required');
  for (const key of ['samples','calendarSamples','preparedSamples','lighthouseSamples','memorySamples']) if (!Number.isInteger(config[key]) || config[key] < 1 || config[key]>10000) throw Error('Positive sample count required: '+key);
  if(config.kind==='calendar' && (config.systems.join()!=='en-reve' || !config.profiles.includes('mobile') || !config.caches.includes('cold'))) throw Error('Calendar campaigns require en-reve, mobile, cold');
  if(config.kind==='calendar' && (config.suites.join(',')!=='load,startup,interactions,memory,lighthouse' || config.profiles.join(',')!=='desktop,mobile' || config.caches.join(',')!=='cold,warm')) throw Error('Calendar recipe retains its complete desktop/mobile, cold/warm and five-suite matrix; change sample counts for a pilot');
  if(config.referenceCampaign!==undefined&&(config.kind!=='calendar'||!safeId(config.referenceCampaign)))throw Error('referenceCampaign requires a calendar recipe and a safe current-source campaign ID');
  if(config.suiteOptions !== undefined) {
    if(config.kind==='calendar'||!config.suiteOptions||typeof config.suiteOptions!=='object'||Array.isArray(config.suiteOptions))throw Error('suiteOptions require a native/current campaign');
    for(const [suite,options] of Object.entries(config.suiteOptions)) {
      if(!config.suites.includes(suite)||!options||Array.isArray(options)||typeof options!=='object'||Object.keys(options).some(k=>!['profiles','samples','checkpoints'].includes(k)))throw Error('Invalid suite override');
      if(options.profiles&&(!Array.isArray(options.profiles)||!options.profiles.length||new Set(options.profiles).size!==options.profiles.length||options.profiles.some(p=>!config.profiles.includes(p))))throw Error('Invalid suite profiles');
      if(options.samples!==undefined&&(!Number.isInteger(options.samples)||options.samples<1||options.samples>10000))throw Error('Invalid suite samples');
      if(options.checkpoints!==undefined&&(suite!=='memory'||!Array.isArray(options.checkpoints)||!options.checkpoints.length||options.checkpoints.some((n,i,a)=>!Number.isSafeInteger(n)||n<0||n>10000||(i&&n<=a[i-1]))))throw Error('Invalid memory checkpoints');
    }
  }
  if(config.kind==='current'&&!config.systems.includes('en-reve'))throw Error('Current-source campaigns include the frozen en-reve control');
  return config;
}
export function context(id, config) {
  if(!safeId(id)) throw Error('Use a fresh simple campaign ID (letters, numbers, hyphens, underscores; max 96 characters)');
  return {schemaVersion:1,id,config:validate(config),directory:resolve(lab,'reports/campaigns',id),primary:id+'-primary',lighthouse:id+'-lighthouse',variants:['eager','deferred','split'].map(policy=>({id:id+'-'+policy,policy:'calendar-'+policy}))};
}
export function plan(ctx) {
  const {id,config:c}=ctx;
  if(c.kind==='calendar')return [
    {stage:'build',script:'experiments/build-calendar-variants.mjs',args:[]},
    {stage:'calibrate',script:'src/cli.mjs',args:['calibrate','--output',resolve(ctx.directory,'calibration.json')]},
    {stage:'qualify',script:'experiments/qualify-calendar-variants.mjs',args:[]},
    {stage:'primary',script:'experiments/run-calendar-variants.mjs',args:[ctx.primary]},
    {stage:'lighthouse-and-recovery',script:'experiments/calendar-followup.mjs',args:[]},
  ];
  const variant=c.kind==='current'?id+'-current':null;
  const variantArgs=variant?['--variant',variant,'--functional-receipt',resolve(lab,'reports','functional-'+id+'-qualification-'+variant+'.json')]:[];
  return [
    ...(variant?[{stage:'build-current',script:'campaigns/current.mjs',args:[]}]:[]),
    ...['chromium','firefox','webkit'].map(engine=>({stage:'qualify-'+engine,script:'src/cli.mjs',args:['functional','--systems',c.systems.join(','),'--engine',engine,'--id',id+'-qualification']})),
    ...(variant?['chromium','firefox','webkit'].map(engine=>({stage:'qualify-current-'+engine,script:'src/cli.mjs',args:['functional','--systems','en-reve','--variant',variant,'--engine',engine,'--id',id+'-qualification']})):[]),
    {stage:'calibrate',script:'src/cli.mjs',args:['calibrate','--output',resolve(ctx.directory,'calibration.json')]},
    ...c.suites.flatMap(suite=>(variant?['native','current']:['native']).flatMap(cohort=>{
      const override=c.suiteOptions?.[suite]||{};
      const run=id+(cohort==='current'?'-current':'')+'-'+suite;
      return [{stage:cohort+'-'+suite,run,script:'src/cli.mjs',args:['run','--suite',suite,'--systems',cohort==='current'?'en-reve':c.systems.join(','),'--profiles',(override.profiles||c.profiles).join(','),'--caches',suite==='load'?c.caches.join(','):'cold','--samples',String(override.samples ?? (suite==='lighthouse'?c.lighthouseSamples:suite==='memory'?c.memorySamples:suite==='diagnostic'?1:c.samples)),'--seed',String(c.seed),'--id',run,...(override.checkpoints?['--checkpoints',override.checkpoints.join(',')]:[]),...(cohort==='current'?variantArgs:[])]},...(suite==='diagnostic'?[{stage:cohort+'-diagnostic-analysis',script:'src/cli.mjs',args:['diagnostics','--run',run]}]:[])];
    })),
    ...(variant?[{stage:'connected-dom',script:'campaigns/dom.mjs',args:[]}]:[]),
  ];
}
export function calendarContext() {
  if(!process.env.EN_PERF_CAMPAIGN)return null;
  const ctx=JSON.parse(readFileSync(process.env.EN_PERF_CAMPAIGN));
  return context(ctx.id,ctx.config);
}
