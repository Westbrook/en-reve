const $=id=>document.getElementById(id);
const error=message=>{$('error').textContent=message;$('error').hidden=!message;};
const text=(tag,value,parent)=>{const node=document.createElement(tag);node.textContent=value;parent.append(node);return node;};
const observations=new Map();let revision=0,review,release,session,selected;let scopedGeneration=0,scopedCleanup=[];
const empty=()=>({result:'not-reviewed',notes:''});
const results=new Set(['not-reviewed','no-issue-observed','issue-observed','unable-to-review']);
function save(){if(selected)observations.set(selected.id,{result:$('result').value,notes:$('notes').value});revision++;}
function selectScenario(){
  scopedGeneration++;for(const cleanup of scopedCleanup)cleanup?.();scopedCleanup=[];for(const side of ['before','after'])$('scoped-'+side).replaceChildren();
  save();selected=review.scenarios.find(s=>s.id===$('scenario').value);error('');
  $('instructions').textContent=selected.instructions;
  $('scoped-load').disabled=!selected.scoped;$('scoped-previews').hidden=!selected.scoped;
  $('scoped-status').textContent=selected.scoped?'Exact fixture bundles are available. Loading requires native scoped registry support.':'No scoped component fixture is supplied for this scenario. Full-document previews below are separate evidence.';
  const observation=observations.get(selected.id)??empty();$('result').value=observation.result;$('notes').value=observation.notes;
  for(const side of ['before','after']){
    $(side+'-mount').replaceChildren();const link=$(side+'-link');link.hidden=selected[side]===null;
    if(!link.hidden)link.href=session[side]+selected[side];
    $(side+'-unavailable').textContent=selected[side]===null?'Unavailable: '+selected[side+'Unavailable']:'Activate Load selected scenario to start this version.';
  }
  $('changes').replaceChildren();
  for(const change of release.changes.filter(c=>c.components.includes(selected.component))){
    const article=document.createElement('article');$('changes').append(article);
    text('h3',change.summary,article);text('p',`${change.id} · ${change.level} · ${change.affected??'direct'}`,article);text('p',change.rationale,article);
    if(change.migration)text('p','Migration: '+change.migration,article);
    if(change.replacement)text('p','Replacement: '+change.replacement,article);
    if(change.plannedRemoval)text('p','Planned removal: '+change.plannedRemoval,article);
    for(const evidence of change.evidence){const row=text('p',`${evidence.label}: ${evidence.status}${evidence.reason?' — '+evidence.reason:''}`,article);try{const url=new URL(evidence.href);if(['http:','https:'].includes(url.protocol)){const a=text('a',' Open evidence',row);a.href=url.href;a.target='_blank';a.rel='noopener';}}catch{}}
  }
  if(!$('changes').childElementCount)text('p','No authored change notes for this scenario; inspect its API facts and open requirements.',$('changes'));
  $('facts').replaceChildren();for(const fact of release.cem.facts.filter(f=>f.element===selected.component)){const d=document.createElement('details');$('facts').append(d);text('summary',`${fact.operation} ${fact.surface}: ${fact.name||'(default)'}`,d);text('pre',JSON.stringify({before:fact.before,after:fact.after,reason:fact.reason},null,2),d);}
  if(!$('facts').childElementCount)text('p','No recorded API changes for this component. Behavior and styling still require review.',$('facts'));
  $('status').textContent='Selected '+selected.title+'. Previews have not been loaded.';
}
function load(){
  for(const side of ['before','after']){
    const mount=$(side+'-mount');mount.replaceChildren();if(selected[side]===null)continue;
    $(side+'-unavailable').textContent='';const frame=document.createElement('iframe');frame.title=(side==='before'?'Before':'After')+' version preview';frame.src=session[side]+selected[side];
    // Keep normal editor/download interactions but prevent top-navigation and popup escape.
    frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-downloads');mount.append(frame);
  }
  $('status').textContent='Scenario loaded. Interact with each version independently; observations are not test results.';
}
function layout(value){for(const region of document.querySelectorAll('.previews'))region.dataset.layout=value;document.querySelector(`input[name=layout][value=${value}]`).checked=true;}
try{
  [review,release,session]=await Promise.all(['/review.json','/release.json','/session.json'].map(async path=>{const r=await fetch(path);if(!r.ok)throw new Error('Review data unavailable. Verify and restart the package.');return r.json();}));
  $('release-summary').textContent=`${release.baseVersion} → proposed ${release.proposedVersion} · ${release.status}. No release has been adopted or published.`;
  $('sample').hidden=!release.sample;
  $('identities').textContent=JSON.stringify({review:review.digest,release:review.releaseDigest,sides:review.sides,typeCoverage:release.cem.typeCoverage,graphCoverage:release.cem.graphCoverage??'not-supplied'},null,2);
  for(const side of ['before','after'])$(side+'-identity').textContent=review.sides[side].fingerprint;
  for(const scenario of review.scenarios){const option=document.createElement('option');option.value=scenario.id;option.textContent=scenario.title+' · '+scenario.component;$('scenario').append(option);}
  for(const issue of release.issues)text('li',issue.message,$('issues'));if(!release.issues.length)text('li','No recorded draft requirements. Human release review and adoption remain separate.',$('issues'));
  $('scoped-load').addEventListener('click',async()=>{
    const generation=++scopedGeneration,scenario=selected.id;
    for(const cleanup of scopedCleanup)cleanup?.();scopedCleanup=[];
    for(const side of ['before','after'])$('scoped-'+side).replaceChildren();
    try{
      // Probe real root association; constructor presence alone is insufficient.
      const probeRegistry=new CustomElementRegistry(),probe=document.createElement('div').attachShadow({mode:'open',customElementRegistry:probeRegistry});
      if(probe.customElementRegistry!==probeRegistry)throw new Error('unsupported');
    }catch{$('scoped-status').textContent='Native scoped registries are unsupported here. This comparison is not run; no global fallback is used.';return;}
    $('scoped-load').disabled=true;
    try{
      for(const side of ['before','after']){
        const module=await import(`/scoped/${side}/fixture.js`);if(generation!==scopedGeneration)return;
        const host=document.createElement('div');$('scoped-'+side).append(host);const registry=new CustomElementRegistry();
        if(typeof module.mount!=='function')throw new Error('Fixture must export mount');
        const cleanup=await module.mount({host,registry,scenario});
        if(generation!==scopedGeneration){if(typeof cleanup==='function')cleanup();host.remove();return;}
        if(!host.shadowRoot||host.shadowRoot.customElementRegistry!==registry)throw new Error('Fixture did not preserve the supplied scoped registry');
        if(typeof cleanup==='function')scopedCleanup.push(cleanup);
      }
      $('scoped-status').textContent='Both versions are mounted in independent native registries. Their interactions remain separate; review is not acceptance.';
    }catch(e){for(const cleanup of scopedCleanup)cleanup?.();scopedCleanup=[];for(const side of ['before','after'])$('scoped-'+side).replaceChildren();$('scoped-status').textContent='Scoped comparison failed: '+e.message;}
    finally{if(generation===scopedGeneration)$('scoped-load').disabled=false;}
  });
  $('scenario').addEventListener('change',selectScenario);$('load').addEventListener('click',load);
  for(const node of document.querySelectorAll('input[name=layout]'))node.addEventListener('change',()=>layout(node.value));
  for(const id of ['notes','result','environment'])$(id).addEventListener('input',save);
  $('export').addEventListener('click',()=>{
    save();const payload={schema:'en-reve/version-review-feedback',schemaVersion:1,reviewDigest:review.digest,releaseDigest:review.releaseDigest,sides:review.sides,environment:$('environment').value,observations:review.scenarios.map(s=>({scenarioId:s.id,component:s.component,before:s.before,after:s.after,...(observations.get(s.id)??empty())})),adopted:false};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='version-review-feedback.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='Feedback exported for these exact versions. No release approval or adoption occurred.';
  });
  $('import').addEventListener('change',async event=>{
    const attempt=++revision,file=event.target.files?.[0];event.target.value='';if(!file)return;
    try{
      if(file.size>8_000_000)throw new Error('Feedback file exceeds 8 MB.');const data=JSON.parse(await file.text());
      if(!data.sides||['before','after'].some(side=>data.sides[side]?.fingerprint!==review.sides[side].fingerprint||data.sides[side]?.manifestDigest!==review.sides[side].manifestDigest)||data.schema!=='en-reve/version-review-feedback'||data.schemaVersion!==1||data.reviewDigest!==review.digest||data.releaseDigest!==review.releaseDigest||data.adopted!==false||typeof data.environment!=='string'||data.environment.length>10000||!Array.isArray(data.observations)||data.observations.length!==review.scenarios.length)throw new Error('Feedback does not belong to this exact review.');
      const incoming=new Map();
      for(const observation of data.observations){const scenario=review.scenarios.find(s=>s.id===observation.scenarioId);if(!scenario||incoming.has(scenario.id)||observation.component!==scenario.component||observation.before!==scenario.before||observation.after!==scenario.after||!results.has(observation.result)||typeof observation.notes!=='string'||observation.notes.length>10000)throw new Error('Feedback contains an invalid scenario observation.');incoming.set(scenario.id,{result:observation.result,notes:observation.notes});}
      if(attempt!==revision)return;
      observations.clear();for(const [key,value] of incoming)observations.set(key,value);$('environment').value=data.environment;const current=observations.get(selected.id);$('result').value=current.result;$('notes').value=current.notes;error('');$('status').textContent='Feedback restored. No release approval or adoption occurred.';
    }catch(e){if(attempt===revision)error(e.message??'Unable to read feedback.');}
  });
  if(matchMedia('(max-width:50rem)').matches)layout('after');selectScenario();
}catch(e){error(e.message??'Unable to load the review.');$('load').disabled=true;$('export').disabled=true;}
