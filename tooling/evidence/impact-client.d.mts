export interface ImpactManifest {
 schemaVersion:1; kind:'en-reve/source-impact'; digest:string; policy:string;
 graph:unknown; gaps:string[];
 components:{tagName:string;source:string}[];
 scenarios:{id:string;path:string;tags:string[]}[];
}
export interface CandidateImpact {
 schemaVersion:1;graphDigest:string;impactDigest:string;changed:string[];
 affected:string[];scenarios:string[];mode:'focused'|'expanded';
 reasons:Record<string,string[]>;gaps:string[];components:string[];caseIds:string[];policy:string;
}
export function verifyImpact(manifest:unknown):ImpactManifest;
export function selectCandidateImpact(manifest:ImpactManifest,changed:string[]):CandidateImpact;
