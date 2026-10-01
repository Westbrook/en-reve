import {createHash} from 'node:crypto';
import {ts} from './compiler-api.mjs';
import {capturedCompilerProgram} from './captured-compiler-program.ts';
import {checkCapturedFactoryEventEmissions,assertCapturedFactoryEventEmissions,checkCapturedModuleEventEmissions,assertCapturedModuleEventEmissions} from './captured-factory-event-dispatch.ts';
const certificates=new WeakMap<object,any>();
const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
const descriptor=(node:any)=>({fileName:node.getSourceFile().fileName,sourceSha256:hash(node.getSourceFile().text),kind:node.kind,start:node.getStart(),end:node.end});
const key=(value:any)=>JSON.stringify([value.fileName,value.sourceSha256,value.kind,value.start,value.end]);
function freeze(value:any):any{if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;}

/** Bind every supported, directly owned emission to its own documented event
 * and to the captured package implementation. Other flow shapes are explicit
 * refusals. This certificate does not replace public visibility or final-facet
 * selection, and it cannot prove arbitrary indirect application behavior.
 */
function checkEventAdmission(program:any,callable:any,owner:any,moduleOwner:boolean) {
 const capture=capturedCompilerProgram(program);
 if(!capture.dispatchHelperPolicy)throw new Error('Factory event admission requires its explicit captured implementation policy');
 let owned=false;
 for(const source of program.getSourceFiles()) {
  const visit=(node:any)=>{if(node===owner&&(ts.isClassDeclaration(node)||ts.isClassExpression(node)))owned=true;ts.forEachChild(node,visit);};visit(source);
 }
 if(!owned)throw new Error('Factory event admission requires an exact original class owner');
 if(moduleOwner) {
  if(!capture.receipt.roots.some((name:string)=>program.getSourceFile(name)?.statements.includes(owner))||!ts.isClassDeclaration(owner))throw new Error('Module admission requires an exact selected owner');
 } else {
  let parent=owner.parent;while(parent&&!ts.isFunctionDeclaration(parent)&&!ts.isFunctionExpression(parent)&&!ts.isArrowFunction(parent))parent=parent.parent;
  if(parent!==callable)throw new Error('Factory event admission requires its exact original callable');
 }
 const checker=program.getTypeChecker(),unalias=(symbol:any)=>symbol?.flags&ts.SymbolFlags.Alias?checker.getAliasedSymbol(symbol):symbol;
 const policySources=new Map<any,any>();
 for(const row of capture.receipt.dispatchHelperPolicy.policies) {
  const source=program.getSourceFile(row.declarationFile);if(!source)throw new Error('Captured helper source is absent');
  policySources.set(source,capture.dispatchHelperPolicy(source));
 }
 const usedHelpers=new Set<any>(),candidateCalls=new Map<string,any>();
 function classify(expression:any) {
  const symbol=unalias(checker.getSymbolAtLocation(expression));
  const signatures=checker.getSignaturesOfType(checker.getTypeAtLocation(expression),ts.SignatureKind.Call);
  const declarations=new Set([...(symbol?.declarations??[]),...signatures.map((signature:any)=>signature.getDeclaration()).filter(Boolean)]);
  for(const declaration of declarations) {
   const name=declaration.name?.text,source=declaration.getSourceFile();
   if(policySources.has(source)&&ts.isFunctionDeclaration(declaration)&&name?.startsWith('dispatch')) {
    if(!['dispatchChange','dispatchAction','dispatchDraftInput','dispatchNotification'].includes(name))throw new Error('Unclassified captured dispatch helper family');
    usedHelpers.add(source);return 'helper';
   }
   if(ts.isMethodSignature(declaration)&&name==='dispatchEvent'&&ts.isInterfaceDeclaration(declaration.parent)&&declaration.parent.name.text==='EventTarget'&&program.isSourceFileDefaultLibrary(source))return 'platform';
  }
  if(['dispatchChange','dispatchAction','dispatchDraftInput','dispatchNotification','dispatchEvent'].includes(symbol?.name))throw new Error('Dispatch expression has no captured implementation owner');
  if((ts.isPropertyAccessExpression(expression)&&expression.name.text==='dispatchEvent')||(ts.isElementAccessExpression(expression)&&ts.isStringLiteral(expression.argumentExpression)&&expression.argumentExpression.text==='dispatchEvent'))throw new Error('Dispatch expression has no captured implementation owner');
 }
 function visit(node:any) {
  if(node!==owner&&(ts.isClassDeclaration(node)||ts.isClassExpression(node)))return;
  if(ts.isTypeNode(node))return;
  // Scan nested function bodies too: a recognized but unproved emission is a
  // refusal below, rather than silently disappearing from an empty call list.
  if((ts.isIdentifier(node)||ts.isPropertyAccessExpression(node)||ts.isElementAccessExpression(node))&&
    !(node.parent.name===node&&!ts.isShorthandPropertyAssignment(node.parent))) {
    if(classify(node)&&(!ts.isCallExpression(node.parent)||node.parent.expression!==node))throw new Error('Factory dispatch reference escapes its direct call');
  }
  if(ts.isCallExpression(node)&&classify(node.expression))candidateCalls.set(key(descriptor(node)),node);
  ts.forEachChild(node,visit);
 }
 visit(owner);
 if(usedHelpers.size>1)throw new Error('Multiple helper implementation owners require an explicit composition adapter');
 const helperSource=[...usedHelpers][0],policy=helperSource&&policySources.get(helperSource);
 const tags=ts.getJSDocTags(owner).filter((tag:any)=>['event','fires'].includes(tag.tagName.text)),bindings=tags.map((tag:any)=>({tag,proof:moduleOwner?checkCapturedModuleEventEmissions(program,owner,tag,helperSource):checkCapturedFactoryEventEmissions(program,callable,owner,tag,helperSource)}));
 const names=new Map<string,any>();
 for(const binding of bindings) {
  const name=binding.proof.receipt.eventName;if(names.has(name))throw new Error('Duplicate original factory event contract');names.set(name,binding);
 }
 const observed=new Map<string,any>();
 for(const {proof}of bindings)for(const row of proof.receipt.allOwnDispatches) {
  const id=key(row),prior=observed.get(id);if(prior&&JSON.stringify(prior)!==JSON.stringify(row))throw new Error('Factory emission classification disagrees between contracts');observed.set(id,row);
 }
 if(candidateCalls.size!==observed.size||[...candidateCalls.keys()].some(id=>!observed.has(id)))throw new Error('Factory emission has no complete supported source contract');
 for(const row of observed.values()) {
  const binding=names.get(row.eventName);
  if(!binding||!binding.proof.receipt.checkedCalls.some((call:any)=>key(call)===key(row)))throw new Error('Unclassified factory event emission: '+row.eventName);
 }
 function assertOriginal() {
  capture.assertOriginal(program);
  if(helperSource&&JSON.stringify(capture.dispatchHelperPolicy(helperSource))!==JSON.stringify(policy))throw new Error('Factory event helper policy changed');
  for(const binding of bindings)if(moduleOwner)assertCapturedModuleEventEmissions(binding.proof,program,owner,binding.tag,helperSource);else assertCapturedFactoryEventEmissions(binding.proof,program,callable,owner,binding.tag,helperSource);
  return true;
 }
 assertOriginal();
 const receipt=freeze({version:1,scope:moduleOwner?'supported-owned-module-emissions':'supported-owned-factory-emissions',owner:descriptor(owner),...(callable?{callable:descriptor(callable)}:{}),policy:policy??null,
  declaredEvents:[...names.keys()],emissions:[...observed.values()],helperImplementationBound:Boolean(policy),unclassifiedEmissions:0,arbitraryFlowQualified:false,finalFacetBound:false});
 const result=Object.freeze({receipt,assertOriginal,event(tag:any){const entry=bindings.find(binding=>binding.tag===tag);if(!entry)throw new Error('Factory admission requires its exact original event tag');assertOriginal();return entry.proof;}});
 certificates.set(result,{program,callable,owner,moduleOwner});return result;
}
export function assertCapturedFactoryEventAdmission(result:any,program:any,callable:any,owner:any) {
 const entry=certificates.get(result);if(!entry||entry.moduleOwner||entry.program!==program||entry.callable!==callable||entry.owner!==owner)throw new Error('Unknown factory event admission certificate');return result.assertOriginal();
}

export function checkCapturedFactoryEventAdmission(program:any,callable:any,owner:any) {return checkEventAdmission(program,callable,owner,false);}
export function checkCapturedModuleEventAdmission(program:any,owner:any) {return checkEventAdmission(program,undefined,owner,true);}
export function assertCapturedModuleEventAdmission(result:any,program:any,owner:any) {
 const entry=certificates.get(result);if(!entry?.moduleOwner||entry.program!==program||entry.owner!==owner)throw new Error('Unknown module event admission certificate');return result.assertOriginal();
}
