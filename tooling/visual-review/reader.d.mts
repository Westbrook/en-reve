export interface Artifact {digest:string;path:string;label:string;mediaType:'image/png'|'application/json'}
export interface Identity {schemaVersion:1;kind:'rendering'|'comparison'|'review';digest:string;inputs:Record<string,unknown>}
export interface Capture {identity:Identity;artifact:Artifact;reused:boolean;originatingRun:string;details?:unknown}
export interface Comparison extends Capture {stats:{expected:{width:number;height:number};actual:{width:number;height:number};differentPixels:number;totalPixels:number;dimensionsMatch:boolean;match:boolean}}
export interface VisualRow {key:string;engine:string;viewport:{id:string;width:number;height:number};appearance:string;fixture:{id:string;page:string;state:string;selector:string;actions:unknown[]};status:'passed'|'different'|'failed'|'not-run'|'unsupported';reason?:string;captures?:Partial<Record<'expected'|'actual',Capture>>;comparison?:Comparison}
export interface VisualReference {schemaVersion:1;integrity:string;candidate:{sourceHash:string;envelopeIntegrity:string};baseline:{sourceHash:string;envelopeIntegrity:string};buildFingerprint:string;run:string}
export interface VisualReport extends VisualReference {schema:'en-reve/candidate-visual-evidence';createdAt:string;status:string;artifacts:Artifact[];environments:Record<string,{version:string}>;results:VisualRow[];comparisonSettings:{channelThreshold:number;maxDifferentPixels:number};error?:string}
export interface VisualEvidence {report:VisualReport;files:Map<string,Uint8Array<ArrayBuffer>>;missing:string[];outcomes:{row:VisualRow;missing:string[]}[];candidate:unknown;baseline:unknown}
export const MAX_VISUAL_BUNDLE_BYTES:number;
export function bytesDigest(bytes:Uint8Array<ArrayBuffer>):Promise<string>;
export function verifyVisualEvidence(report:unknown,files:Map<string,Uint8Array<ArrayBuffer>>,build:unknown):Promise<VisualEvidence>;
export function encodeVisualBundle(report:VisualReport,files:Map<string,Uint8Array<ArrayBuffer>>):string;
export function readVisualBundle(text:string,build:unknown):Promise<VisualEvidence>;
export function evidenceReference(evidence:VisualEvidence):VisualReference;
export function validateEvidenceReference(value:unknown):VisualReference|undefined;
