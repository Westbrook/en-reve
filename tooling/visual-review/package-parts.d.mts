import type {VisualReport} from './reader.mjs';

export interface VisualEvidencePart {
 path:string;
 bytes:number;
 digest:string;
 integrity:string;
 cases:string[];
 rows:string[];
}
export interface VisualEvidencePartsIndex {
 schema:'en-reve/visual-review-parts';
 schemaVersion:1;
 buildFingerprint:string;
 parent:{path:'parent-evidence.json';digest:string;integrity:string};
 maxBytes:number;
 parts:VisualEvidencePart[];
 manualAcceptance:'not-run';
 integrity:string;
}
export interface VisualEvidencePartsOptions {maxBytes?:number}
export function partitionVisualEvidence(parent:unknown,files:Map<string,Uint8Array<ArrayBuffer>>,build:unknown,options?:VisualEvidencePartsOptions):AsyncGenerator<{path:string;report:VisualReport;files:Map<string,Uint8Array<ArrayBuffer>>}>;
export function packageVisualEvidenceParts(directory:string,build:unknown,output:string,options?:VisualEvidencePartsOptions):Promise<VisualEvidencePartsIndex>;
export function verifyVisualEvidenceParts(directory:string,build:unknown):Promise<{index:VisualEvidencePartsIndex;parent:VisualReport;rows:number;artifacts:number}>;
