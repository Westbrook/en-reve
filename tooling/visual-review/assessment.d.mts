import type {VisualEvidence,VisualReference} from './reader.mjs';
export type AssessmentCategory='unassessed'|'intentional'|'regression';
export interface AssessmentEntry {rowDigest:string;category:AssessmentCategory;feedback:'open'|'resolved';note:string;updatedAt:string}
export interface VisualAssessment {schema:'en-reve/local-visual-assessment';schemaVersion:1;evidence:VisualReference;createdAt:string;updatedAt:string;entries:Record<string,AssessmentEntry>;integrity:string}
export const MAX_ASSESSMENT_BYTES:number;
export function createAssessment(evidence:VisualEvidence,now?:string):VisualAssessment;
export function validateAssessment(value:unknown,evidence:VisualEvidence):VisualAssessment;
export function updateAssessment(value:VisualAssessment,evidence:VisualEvidence,key:string,change:Partial<Pick<AssessmentEntry,'category'|'feedback'|'note'>>,now?:string):VisualAssessment;
export function exportAssessment(value:VisualAssessment,evidence:VisualEvidence):string;
export function importAssessment(text:string,evidence:VisualEvidence):VisualAssessment;
export function assessmentSummary(value:VisualAssessment,evidence:VisualEvidence):Record<AssessmentCategory|'openFeedback',number>;
