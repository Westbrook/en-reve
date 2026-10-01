import assert from 'node:assert/strict';
import test from 'node:test';
import {ts} from './compiler-api.mjs';
import {guardParsedSources} from './captured-compiler-program.ts';

const code='/** Public class. @fires {CustomEvent<string>} changed */\nexport class First { value=1; }\nexport class Second {}';
const parse=(text=code)=>ts.createSourceFile('input.ts',text,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TS);
function rejectsMutation(change:(source:any)=>void,text=code) {
 const source=parse(text),guard=guardParsedSources([source]);guard();
 change(source);assert.throws(guard,/parsed structure changed|plain serializable values/);
}

test('parsed syntax guards accept repeated unchanged checks but detect later identifier mutation',()=>{
 const source=parse(),guard=guardParsedSources([source]);
 for(let i=0;i<5;i++)guard();
 source.statements[0].name.escapedText='Changed';
 assert.throws(guard,/parsed structure changed/);
});

test('parsed syntax guards retain scalar presence type value and finite-number checks',()=>{
 rejectsMutation(source=>{source.statements[0].name.rawText='new scalar';});
 rejectsMutation(source=>{delete source.statements[0].name.pos;});
 rejectsMutation(source=>{source.statements[0].name.pos=String(source.statements[0].name.pos);});
 rejectsMutation(source=>{source.statements[0].name.moduleName=null;});
 rejectsMutation(source=>{source.statements[0].name.moduleName=Number.NaN;});
 rejectsMutation(source=>{source.statements[0].name.moduleName=Number.POSITIVE_INFINITY;});
});

test('parsed syntax guards retain syntax flags and token kinds',()=>{
 rejectsMutation(source=>{source.statements[0].flags^=ts.NodeFlags.Synthesized;});
 rejectsMutation(source=>{source.statements[0].members[0].initializer.kind=ts.SyntaxKind.StringLiteral;});
});

test('parsed syntax guards reject same-text child replacements and changed parent identity',()=>{
 rejectsMutation(source=>{
  const replacement=parse().statements[0].name;replacement.parent=source.statements[0];
  source.statements[0].name=replacement;
 });
 rejectsMutation(source=>{source.statements[0].members[0].parent=source.statements[1];});
});

test('parsed syntax guards reject inserted removed and reordered children',()=>{
 rejectsMutation(source=>{source.statements.push(parse('class Added {}').statements[0]);});
 rejectsMutation(source=>{source.statements.pop();});
 rejectsMutation(source=>{source.statements.reverse();});
});

test('parsed syntax guards retain node-array identity bounds and trailing comma state',()=>{
 rejectsMutation(source=>{
  const original=source.statements,replacement=ts.factory.createNodeArray([...original]);
  for(const key of ['pos','end','hasTrailingComma'])replacement[key]=original[key];
  source.statements=replacement;
 });
 rejectsMutation(source=>{source.statements.pos--;});
 rejectsMutation(source=>{source.statements.end++;});
 rejectsMutation(source=>{source.statements.hasTrailingComma=!source.statements.hasTrailingComma;});
});

test('parsed syntax guards retain source bytes and filename identity',()=>{
 rejectsMutation(source=>{source.text=source.text.replace('value=1','value=2');});
 rejectsMutation(source=>{source.fileName='elsewhere.ts';});
});

test('parsed syntax guards retain reference directive values arrays and item identity',()=>{
 const text='/// <reference path="./types.d.ts" />\n/// <reference types="pkg" />\n/// <reference lib="dom" />\n/// <amd-dependency path="dep" name="dependency" />\n'+code;
 for(const key of ['referencedFiles','typeReferenceDirectives','libReferenceDirectives','amdDependencies']) {
  rejectsMutation(source=>{assert.equal(source[key].length,1);source[key][0]={...source[key][0]};},text);
  rejectsMutation(source=>{assert.equal(source[key].length,1);source[key]=[...source[key]];},text);
  rejectsMutation(source=>{assert.equal(source[key].length,1);source[key][0].pos=-99;},text);
 }
});

test('parsed syntax guards retain JSDoc tag and authored comment payload changes',()=>{
 const text='/**\n * Original documentation.\n * @fires {CustomEvent<string>} changed\n */\nexport class First {}';
 rejectsMutation(source=>{const tag=ts.getJSDocTags(source.statements[0])[0];assert.equal(tag.tagName.text,'fires');tag.tagName.escapedText='event';},text);
 rejectsMutation(source=>{assert.equal(source.statements[0].jsDoc.length,1);source.statements[0].jsDoc[0].comment='Changed documentation.';},text);
});

test('parsed syntax guards reject a changed edge before traversing its foreign replacement',()=>{
 rejectsMutation(source=>{
  const replacement={get kind(){throw Error('Foreign replacement was traversed');}};
  source.statements[0].name=replacement;
 });
});

test('parsed syntax guards inspect every allowlisted scalar including additions and removals',()=>{
 const fields=["kind", "pos", "end", "escapedText", "text", "rawText", "isUnterminated", "hasExtendedUnicodeEscape", "hasUnicodeEscape", "isTypeOnly", "isExportEquals", "isTypeOf", "operator", "token", "keywordToken", "isSpread", "containsOnlyTriviaWhiteSpaces", "isNameFirst", "isBracketed", "isArrayType", "comment", "fileName", "languageVersion", "languageVariant", "isDeclarationFile", "hasNoDefaultLib", "impliedNodeFormat", "moduleName"];
 for(const field of fields) {
  const source=parse(),node=source.statements[0].name,guard=guardParsedSources([source]);
  const before=node[field],after=typeof before==='string'?before+'Changed':typeof before==='number'?before+1:before===true?false:true;
  Object.defineProperty(node,field,{value:after,writable:true,configurable:true,enumerable:true});
  assert.throws(guard,/parsed structure changed/,field+' changed or added');
  const removalSource=parse(),removal=removalSource.statements[0].name;
  if(removal[field]===undefined)Object.defineProperty(removal,field,{value:'present',writable:true,configurable:true,enumerable:true});
  const removalGuard=guardParsedSources([removalSource]);
  Object.defineProperty(removal,field,{value:undefined,writable:true,configurable:true,enumerable:true});
  assert.throws(removalGuard,/parsed structure changed/,field+' removed');
 }
});

test('parsed syntax guards retain structured JSDoc comment arrays and ordered link nodes',()=>{
 const text='/** See {@link First} and {@link Second}. */\nexport class First {}\nexport class Second {}';
 rejectsMutation(source=>{
  const doc=source.statements[0].jsDoc[0],original=doc.comment;
  assert.ok(Array.isArray(original));assert.ok(original.length>1);
  const replacement=[...original];
  for(const key of ['pos','end','hasTrailingComma'])replacement[key]=original[key];
  doc.comment=replacement;
 },text);
 rejectsMutation(source=>{
  const comment=source.statements[0].jsDoc[0].comment;
  assert.ok(Array.isArray(comment));assert.ok(comment.length>1);comment.reverse();
 },text);
});

test('parsed syntax guards cannot delegate reference item identity to mutable array methods',()=>{
 const source=parse('/// <reference path="./types.d.ts" />\n'+code),references=source.referencedFiles;
 assert.equal(references.length,1);
 const guard=guardParsedSources([source]);let calls=0;
 const prototype=Object.create(Array.prototype);
 Object.defineProperty(prototype,'some',{value(){calls++;return false;}});
 Object.setPrototypeOf(references,prototype);
 guard();assert.equal(calls,0);
 references[0]={...references[0]};
 assert.throws(guard,/parsed structure changed/);assert.equal(calls,0);
});

test('parsed syntax guards reject foreign Program roots despite an inherited some override',async()=>{
 const {mkdtemp,writeFile,rm,realpath}=await import('node:fs/promises');
 const {join}=await import('node:path'),{tmpdir}=await import('node:os');
 const {createCapturedCompilerProgram}=await import('./captured-compiler-program.ts');
 const directory=await realpath(await mkdtemp(join(tmpdir(),'cem-root-array-guard-')));
 try {
  const file=join(directory,'main.ts');await writeFile(file,'export const value=1;');
  const capture=createCapturedCompilerProgram([file],{noEmit:true,strict:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,types:[],lib:['lib.es5.d.ts']});
  const sources=capture.program.getSourceFiles(),source=capture.program.getSourceFile(file),index=sources.indexOf(source);
  assert.ok(index>=0);const originalPrototype=Object.getPrototypeOf(sources),prototype=Object.create(originalPrototype);let calls=0;
  Object.defineProperty(prototype,'some',{value(){calls++;return false;}});
  Object.setPrototypeOf(sources,prototype);
  try {
   capture.assertOriginal();assert.ok(calls>0,'precondition: the outer source check observes the inherited override');calls=0;
   const replacement=ts.createSourceFile(source.fileName,source.text,source.languageVersion,true,source.scriptKind);
   replacement.impliedNodeFormat=source.impliedNodeFormat;
   assert.equal(replacement===source,false);sources[index]=replacement;
   assert.throws(()=>capture.assertOriginal(),/parsed structure changed/);
   assert.ok(calls>0,'the independent syntax guard rejects after the outer some override');
  } finally {sources[index]=source;Object.setPrototypeOf(sources,originalPrototype);}
  capture.assertOriginal();
 } finally {await rm(directory,{recursive:true,force:true});}
});


test('parsed syntax guards retain absent-scalar normalization for structured and callable values',()=>{
 const source=parse(),node=source.statements[0].name;
 node.moduleName={ignored:true};const guard=guardParsedSources([source]);
 for(const value of [undefined,{different:true},[],()=>true,Symbol('ignored'),1n]) {
  node.moduleName=value;guard();
 }
 node.moduleName=null;assert.throws(guard,/parsed structure changed/);
 const absent=parse(),absentNode=absent.statements[0].name,absentGuard=guardParsedSources([absent]);
 absentNode.moduleName=()=>true;absentGuard();
 absentNode.moduleName='now authored';assert.throws(absentGuard,/parsed structure changed/);
});

test('parsed syntax guards preserve signed-zero equivalence and reject scalar type and nonfinite changes',()=>{
 for(const bad of [1,'0',false,null,Number.NaN,Number.POSITIVE_INFINITY,Number.NEGATIVE_INFINITY]) {
  const source=parse(),node=source.statements[0].name;node.moduleName=0;
  const guard=guardParsedSources([source]);node.moduleName=-0;guard();node.moduleName=bad;
  assert.throws(guard,/parsed structure changed|plain serializable values/);
 }
 for(const value of [Number.NaN,Number.POSITIVE_INFINITY,Number.NEGATIVE_INFINITY]) {
  const source=parse();source.statements[0].name.moduleName=value;
  assert.throws(()=>guardParsedSources([source]),/plain serializable values/);
 }
});

test('parsed syntax guards read normalized fields once and stop before later fields after a mismatch',()=>{
 const source=parse(),node=source.statements[0].name,guard=guardParsedSources([source]);let reads=0;
 Object.defineProperty(node,'rawText',{configurable:true,get(){reads++;return {ignored:true};}});
 guard();assert.equal(reads,1);
 reads=0;node.escapedText='Changed';
 Object.defineProperty(node,'rawText',{get(){reads++;throw Error('A later scalar was read after a mismatch');}});
 assert.throws(guard,/parsed structure changed/);assert.equal(reads,0);
});


test('parsed syntax link checks isolate reentrant invocations from node-array iterators',()=>{
 const source=parse('class First { a=1; b=2; } class Second { c=3; }'),guard=guardParsedSources([source]);
 const members=source.statements[0].members;let nested=false,nestedCalls=0;
 Object.defineProperty(members,Symbol.iterator,{configurable:true,value:function*(){
  for(const item of Array.prototype[Symbol.iterator].call(this)) {
   if(!nested) {
    nested=true;
    try {nestedCalls++;guard();} finally {nested=false;}
   }
   yield item;
  }
 }});
 guard();assert.ok(nestedCalls>=2,'the same guard must run again during live edge iteration');
 source.statements[1].members[0].name.escapedText='changed';
 assert.throws(guard,/parsed structure changed/);
});

test('parsed syntax link checks recover from iterator errors without retaining traversal state',()=>{
 const source=parse('class First { a=1; b=2; } class Second { c=3; }'),guard=guardParsedSources([source]);
 const members=source.statements[0].members;let interrupt=true;
 Object.defineProperty(members,Symbol.iterator,{configurable:true,value:function*(){
  for(const item of Array.prototype[Symbol.iterator].call(this)) {
   if(interrupt){interrupt=false;throw Error('interrupted live edge iterator');}
   yield item;
  }
 }});
 assert.throws(guard,/interrupted live edge iterator/);guard();guard();
 members.reverse();assert.throws(guard,/parsed structure changed/);
});
