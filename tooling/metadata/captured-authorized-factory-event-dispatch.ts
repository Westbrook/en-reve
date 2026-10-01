import {capturedCompilerProgram} from './captured-compiler-program.ts';
import {checkCapturedFactoryEventDispatch,assertCapturedFactoryEventDispatch} from './captured-factory-event-dispatch.ts';
const certificates=new WeakMap<object,any>();

/** This exact implementation/package policy is additional to the declaration
 * payload obligation. It still proves no full flow, visibility or final facet.
 */
export function checkCapturedAuthorizedFactoryEventDispatch(program:any,callable:any,owner:any,tag:any,helperSource:any) {
 const capture=capturedCompilerProgram(program);
 if(!capture.dispatchHelperPolicy)throw new Error('Factory dispatch requires captured helper implementation policy');
 const policy=capture.dispatchHelperPolicy(helperSource),dispatch=checkCapturedFactoryEventDispatch(program,callable,owner,tag,helperSource);
 function assertOriginal() {
  assertCapturedFactoryEventDispatch(dispatch,program,callable,owner,tag,helperSource);
  if(JSON.stringify(capture.dispatchHelperPolicy(helperSource))!==JSON.stringify(policy))throw new Error('Factory helper implementation policy changed');return true;
 }
 assertOriginal();const result=Object.freeze({receipt:Object.freeze({version:1,scope:'implementation-bound-factory-declaration-dispatch',policy,dispatch:dispatch.receipt,helperPackagePolicyBound:true,publicVisibilityChecked:false,finalFacetBound:false}),assertOriginal});
 certificates.set(result,{program,callable,owner,tag,helperSource});return result;
}
export function assertCapturedAuthorizedFactoryEventDispatch(result:any,program:any,callable:any,owner:any,tag:any,helperSource:any) {
 const entry=certificates.get(result);
 if(!entry||entry.program!==program||entry.callable!==callable||entry.owner!==owner||entry.tag!==tag||entry.helperSource!==helperSource)throw new Error('Unknown implementation-bound factory dispatch certificate');
 return result.assertOriginal();
}
