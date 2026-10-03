import {hashValue} from '@en-reve/tokens';
import type {ReviewWorkspace} from './workspace.js';
import type {ReviewBuild} from './bundle.js';
import {verifyImpact,selectCandidateImpact,type ImpactManifest} from '../../../../tooling/evidence/impact-client.mjs';
export type {ImpactManifest};

/** The original build's transport hash must match before using its source graph. */
export async function loadCandidateImpact(build:ReviewBuild,signal:AbortSignal):Promise<ImpactManifest> {
 const expected=build.assets.find(asset=>asset.path==='impact.json')?.sha256;
 if(!expected)throw new Error('This build has no source-impact manifest. Keep the complete review scope.');
 const response=await fetch('/impact.json',{cache:'no-store',signal});
 if(!response.ok)throw new Error('Source impact is unavailable. Keep the complete review scope.');
 const bytes=await response.arrayBuffer();
 const digest='sha256:'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte=>byte.toString(16).padStart(2,'0')).join('');
 if(digest!==expected)throw new Error('Source impact belongs to a different or incomplete build. Reload before relying on it.');
 return verifyImpact(JSON.parse(new TextDecoder().decode(bytes)));
}
export function candidateImpact(manifest:ImpactManifest,workspace:ReviewWorkspace) {
 const branches=workspace.pair ? [workspace.pair.light,workspace.pair.dark] : [workspace.draft];
 const changed=[...new Set(branches.flatMap(draft=>draft.prepare({title:'Impact selection'}).changedTokens))].sort();
 const selection=selectCandidateImpact(manifest,changed.map(id=>'token:'+id));
 return {...selection,candidate:workspace.identity,baseline:hashValue(branches.map(branch=>({mode:branch.base.mode,sourceHash:branch.base.sourceHash}))),
  appearances:branches.map(branch=>({mode:branch.theme.mode,base:branch.base.sourceHash,candidate:branch.theme.sourceHash}))};
}
