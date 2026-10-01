import { evidenceDirectory } from '../test-pipeline/evidence-output.mjs';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createReviewDraft,validateRoleProvenance,createThemeCompanion,unknownComponentHooks} from '@en-reve/tokens';
const root=new URL('../../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8').then(JSON.parse);
const definitions=await read('tooling/theme-candidates/definitions.json');
const provenance=await read('tooling/theme-candidates/role-provenance.json');
const fonts=await read('tooling/theme-candidates/font-delivery.json');
const branches=[];
for(const definition of definitions)for(const mode of ['light','dark']){
 const draft=createReviewDraft(definition.baseOptions?.[mode]??{});
 for(const edit of await read(`tooling/theme-candidates/${definition.inputs[mode]}`)){
  if(edit.type==='context')draft.setContext({mode:edit.mode,density:edit.density});else if(edit.type==='token')draft.setToken(edit.id,edit.value);else draft.restoreToken(edit.id);
 }
 const roles=provenance.roles.filter(r=>r.themeId===definition.id&&r.appearance===mode);
 validateRoleProvenance(draft.theme,roles);
 assert.deepEqual(unknownComponentHooks(draft.theme),[],definition.id);
 const companion=definition.companion ? createThemeCompanion(draft.theme,definition.companion,{name:definition.id}) : undefined;
 branches.push({id:definition.id,mode,sourceHash:draft.theme.sourceHash,provenanceRoles:roles.length,companionIdentity:companion?.identity ?? null});
}
const sources=await read('apps/docs/public/fonts/theme-references/sources.json');
for(const font of fonts.assets){
 assert.equal(createHash('sha256').update(await readFile(new URL(font.path,root))).digest('hex'),font.sha256);
 const license=sources.find(s=>font.licensePath.endsWith('/'+s.filename));assert.ok(license);
 assert.equal(createHash('sha256').update(await readFile(new URL(font.licensePath,root))).digest('hex'),license.sha256);
}
const sourceManifests=(await read('tooling/theme-candidates/reference-sources.json')).sources;
for(const role of provenance.roles){
 const source=sourceManifests.find(s=>s.url===role.sourceUrl);assert.ok(source,role.sourceUrl);assert.equal(source.sha256,role.sourceHash);
 // Raw research captures are optional local evidence, not runtime dependencies.
 const bytes=await readFile(new URL(source.file,root)).catch(error=>{if(error.code!=='ENOENT')throw error;return null;});
 if(bytes)assert.equal('sha256:'+createHash('sha256').update(bytes).digest('hex'),role.sourceHash);
}
const output=evidenceDirectory(import.meta.url,new URL('artifacts/theme-api-v1/',root));await mkdir(output,{recursive:true});
await writeFile(new URL('authoring-corpus.json',output),JSON.stringify({schemaVersion:1,branches,licensedAssets:fonts.assets.length,provenanceRoles:provenance.roles.length},null,2)+'\n');
console.log(`${branches.length} branches: connected hooks, companion identity, provenance and ${fonts.assets.length} licensed assets verified.`);
