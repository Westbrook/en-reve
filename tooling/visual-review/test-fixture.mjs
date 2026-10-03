import {hashValue} from '@en-reve/tokens';
import {renderingIdentity,comparisonIdentity,reviewIdentity,digestBytes} from '../evidence/identity.ts';
const source='sha256:'+'a'.repeat(64),old='sha256:'+'b'.repeat(64);
const seal=value=>{const {integrity,...body}=value;return {...body,integrity:hashValue(body)};};
export function fixture(checks){
 const build={schemaVersion:1,fingerprint:source,pages:[{id:'sheet',path:'/',caseIds:['buttons']}],caseIds:['buttons'],assets:[]};
 const envelope=(sourceHash,title)=>seal({schema:'en-reve/local-theme-review',schemaVersion:1,build,draft:{candidate:{candidateSourceHash:sourceHash,theme:{mode:'light'},title}}});
 const candidate=envelope(source,'Actual'),baseline=envelope(old,'Expected'),files=new Map(),artifacts=[];
 const artifact=(bytes,mediaType,label)=>{const digest=digestBytes(bytes),path='artifacts/'+digest.slice(7)+(mediaType==='image/png'?'.png':'.json');const ref={digest,path,mediaType,label};files.set(path,new Uint8Array(bytes));artifacts.push(ref);return ref;};
 artifact(Buffer.from(JSON.stringify(candidate)),'application/json','Candidate');artifact(Buffer.from(JSON.stringify(baseline)),'application/json','Baseline');
 const image=artifact(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aG1sAAAAASUVORK5CYII=','base64'),'image/png','Synthetic one-pixel fixture');
 const view={id:'desktop',width:1000,height:800},environment={engine:'chromium',version:'synthetic'};
 const testCase={id:'buttons',page:'sheet',state:'default',selector:'[data-specimen=buttons]',actions:[],...(checks?{checks}:{})};
 const scope={cases:[testCase,{...testCase,state:'omitted'}],selected:['buttons:default'],engines:['chromium'],viewports:[view],policy:'test inventory'};
 const capture=theme=>({identity:renderingIdentity({artifacts:{build:source},fixture:hashValue(testCase),testCode:source,resolvedDependencies:{},theme,assets:{},environment,locale:'en-US',direction:'ltr',preferences:{colorScheme:'light'},viewport:view,readiness:{},capture:{}}),artifact:image,reused:false,originatingRun:'fixture',details:{reply:{sourceHash:theme,buildFingerprint:source,effectiveMode:'light'},...(checks?{stateChecks:checks.map(check=>({...check,status:'passed'}))}:{})}});
 const settings={channelThreshold:0,maxDifferentPixels:0};
 const comparison={identity:comparisonIdentity({candidateImage:image.digest,baselineImage:image.digest,implementation:source,settings}),artifact:image,reused:true,originatingRun:'earlier-fixture',stats:{expected:{width:1,height:1},actual:{width:1,height:1},differentPixels:0,totalPixels:1,dimensionsMatch:true,match:true}};
 const results=[{key:'chromium/desktop/light/buttons/default',engine:'chromium',viewport:view,appearance:'light',fixture:testCase,status:'passed',captures:{expected:capture(old),actual:capture(source)},comparison},{key:'chromium/desktop/light/buttons/omitted',engine:'chromium',viewport:view,appearance:'light',fixture:scope.cases[1],status:'not-run',reason:'Not selected.'}];
 const report=seal({schema:'en-reve/candidate-visual-evidence',schemaVersion:1,run:'fixture',createdAt:'2026-10-03',status:'incomplete',buildFingerprint:source,candidate:{sourceHash:source,envelopeIntegrity:candidate.integrity},baseline:{sourceHash:old,envelopeIntegrity:baseline.integrity},scope,environments:{chromium:environment},results,artifacts,comparisonSettings:settings,manualAcceptance:'not-run',reviewIdentity:reviewIdentity({candidate:candidate.integrity,baseline:baseline.integrity,scope,evidence:[comparison.identity.digest]})});
 return {report,files,build,image};
}
