import {readFile,writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createReviewDraft,contrastRatio,flattenTokens} from '@en-reve/tokens';
const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defs=JSON.parse(await readFile(`${root}/definitions.json`)).filter(def=>['vellum','signal','kinetic'].includes(def.id));
if(defs.length!==3)throw new Error('Expected all three original theme definitions.');
const cases=[];let failures=0;
for(const def of defs)for(const mode of ['light','dark']){
 const draft=createReviewDraft(def.baseOptions[mode]);const edits=JSON.parse(await readFile(`${root}/${def.inputs[mode]}`));
 for(const e of edits)if(e.type==='context'){const {type,...ctx}=e;draft.setContext(ctx);}else draft.setToken(e.id,e.value);
 if(draft.theme.diagnostics.length){failures++;console.error(def.id,mode,draft.theme.diagnostics);}
 const v=id=>draft.theme.tokens[id].value;
 const checks=[];
 const check=(fg,bg,min=4.5,label=`${fg} / ${bg}`)=>{
  const f=v(fg),b=v(bg);if((f.alpha??1)!==1||(b.alpha??1)!==1)return;
  const ratio=contrastRatio(f,b),pass=ratio>=min;checks.push({foreground:fg,background:bg,ratio:Number(ratio.toFixed(3)),minimum:min,pass});if(!pass){failures++;console.log(def.id,mode,'FAIL',ratio.toFixed(2),label);}
 };
 for(const surface of ['canvas','surface','surface-raised','surface-subtle','selected'])for(const text of ['text','text-muted'])check(`color.${text}`,`color.${surface}`);
 for(const text of ['action-text','danger-text','warning-text','success-text'])for(const surface of ['surface','surface-subtle','accent-subtle'])check(`color.${text}`,`color.${surface}`);
 check('color.on-brand','color.brand');for(const state of ['action','action-hover','action-pressed'])check('color.on-action',`color.${state}`);
 for(const state of ['hover','active','pressed','selected'])check(`component.option.${state}-color`,`component.option.${state}-background`);
 for(const state of ['background','hover-background','pressed-background'])check('component.editor-token.color',`component.editor-token.${state}`);
 check('component.toast.color','component.toast.background');for(const variant of ['info','success','warning','danger'])check(`component.toast.${variant}-icon-color`,'component.toast.background',3);
 for(const family of ['presence','activity'])for(const text of ['text','text-muted'])check(`color.${text}`,`component.${family}.background`);
 check('color.text','component.presence.hover-background');check('color.text-muted','component.presence.hover-background');
 for(const surface of ['surface','surface-subtle','selected'])check('color.focus',`color.${surface}`,3);
 for(const state of ['hover','active','pressed','selected'])check('component.option.focus-color',`component.option.${state}-background`,3);
 check('component.option.focus-color','component.option-list.background',3);
 check('color.boundary','color.surface',3);check('color.boundary','color.surface-subtle',3);
 const groups={};for(const e of edits.filter(x=>x.type==='token')){const family=e.id.startsWith('component.')?e.id.split('.').slice(0,2).join('.'):e.id.split('.')[0];groups[family]=(groups[family]??0)+1;}
 cases.push({id:def.id,mode,sourceHash:draft.theme.sourceHash,tokenEditCount:edits.filter(e=>e.type==='token').length,sourceDefinitionCount:Object.keys(flattenTokens(def.baseOptions[mode].source)).length,tokenGroups:groups,compilerDiagnostics:draft.theme.diagnostics,checks});
}
if(process.argv.includes('--write-artifact'))await writeFile(`${root}/originals/contrast-review.json`,JSON.stringify({scope:'Authored opaque token pairs relevant to existing consumers; excludes translucent compositing, rendered focus adjacency, disabled text exemptions and manual accessibility review.',cases},null,'\t')+'\n');
console.log(JSON.stringify({branches:cases.length,checks:cases.reduce((n,c)=>n+c.checks.length,0),failures}));
process.exitCode=failures?1:0;
