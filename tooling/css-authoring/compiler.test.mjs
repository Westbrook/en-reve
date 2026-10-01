import { minifyLitTemplates } from '../minify/literals.mjs';
import { fileURLToPath } from 'node:url';
import { validateDefinitions } from './contracts.mjs';
import { invalidDefinitionCases } from './definition-cases.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, cp, rm, writeFile, mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {transform} from 'lightningcss';
import {compileStyles} from './compiler.mjs';
import {authorCSS} from '../../packages/styles/scripts/author-css.mjs';
import {watchStyles} from '../../packages/styles/scripts/watch-css.mjs';
import {tokenCSS,rawTokenCSS} from '../../packages/styles/src/internal/token-values.ts';
import {token,rawToken} from '../../packages/styles/dist/internal/values.js';
import {styleOverrideNames} from '../../packages/tokens/dist/customization.js';
const definitions=[{filename:'recipes.css',css:await readFile(new URL('../../packages/styles/src/css/recipes.css',import.meta.url),'utf8')}];
const compile=css=>compileStyles({definitions,css,filename:'consumer.css',token:tokenCSS,overrides:styleOverrideNames});
const canonical=css=>transform({code:Buffer.from(css),minify:true,targets:{chrome:999<<16,firefox:999<<16,safari:999<<16}}).code.toString();
const baseline=JSON.parse(await readFile(new URL('./fixtures/consumer-baseline.json',import.meta.url),'utf8'));
for(const family of ['typography','surfaces'])test(`${family}: emitted consumer CSS matches reviewed artifact`,async()=>{
 const css=await readFile(new URL(`../../packages/styles/dist/${family}.css`,import.meta.url),'utf8');
 assert.equal(canonical(css),canonical(baseline.css[family]));
 assert.doesNotMatch(css,/@(?:apply|mixin|function)\b|--(?:token|en-font|en-inset-radius)\(/);
});
test('shared token serialization retains runtime defaults and finite size indirection',()=>{
 for(const name of ['--en-font-body-size','--en-radius-container','--en-color-text']){
  assert.equal(tokenCSS(name),token(name).cssText);assert.equal(rawTokenCSS(name),rawToken(name).cssText);
 }
 assert.throws(()=>tokenCSS('--en-nonexistent'),/Unknown token/);
});
test('mixin expansion preserves order, CSS strings and comma-containing font stacks',()=>{
 const css=compile('.a{font:inherit;@apply --en-font(400,16px,1.5,var(--font,"A, B", serif));font-weight:700}');
 assert.match(css,/font:inherit;\s*font: 400 16px \/ 1.5 var\(--font,"A, B", serif\);?\s*font-weight:700/);
});
test('consumer conditions, nesting and important stay in their original scope',()=>{
 const css=compile('@layer a{@media (width>1px){.a{border-radius:--en-inset-radius(3px,5px)!important;&:hover{color:red}}}}');
 assert.match(css,/@layer a/);assert.match(css,/@media/);assert.match(css,/max\(0px, 3px - 5px\)!important/);assert.match(css,/&:hover/);
});
test('quoted helper-like text stays literal',()=>assert.match(compile('.a{content:"--token(--unknown)"}'),/"--token\(--unknown\)"/));
for(const [label,css,pattern] of [
 ['unknown token','.a{color:--token(--en-unknown)}',/Unknown token/],
 ['unknown override','.a{color:var(--en-typo,red)}',/Unknown style override/],
 ['raw design token','.a{color:var(--en-color-text)}',/use --token/],
 ['unknown function','.a{color:--wat(1px)}',/Unknown function/],
 ['arity','.a{width:--en-inset-radius(1px)}',/requires 2/],
 ['empty argument','.a{width:--en-inset-radius(1px,)}',/nonempty/],
 ['CSS-wide argument','.a{width:--en-inset-radius(inherit,1px)}',/nonempty/],
 ['nested helper','.a{width:--en-inset-radius(--en-inset-radius(4px,1px),2px)}',/Nested helper/],
 ['mixin as function','.a{font:--en-font(400,16px,1,serif)}',/Unknown function/],
 ['unknown mixin','.a{@apply --wat()}',/Unknown mixin/],
 ['misplaced apply','@apply --en-font(400,16px,1,serif);',/inside a style rule/],
 ['late definition','@function --a(){result:1px}',/Unsupported authoring/],
 ['import','@import "other.css";',/Unsupported authoring/],
 ['condition helper','@media (width>--token(--en-space-2)){.a{color:red}}',/declaration values only/],
])test(`rejects ${label} with a source location`,()=>assert.throws(()=>compile(css),error=>pattern.test(error.message)&&/consumer.css:\d+:\d+/.test(error.message)));

test('manifest rebuild and watch handle edits/add/remove/errors/recovery without stale success',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'theme07-authoring-'));const root=pathToFileURL(dir+'/');let stop;
 try{
  await cp(new URL('../../packages/styles/src/css/',import.meta.url),new URL('src/css/',root),{recursive:true});
  await cp(new URL('../../packages/styles/css-authoring.json',import.meta.url),new URL('css-authoring.json',root));
  const events=[];stop=watchStyles({root,interval:20,build:()=>authorCSS(root),onResult:r=>events.push(r)});
  const wait=async n=>{const deadline=Date.now()+5000;while(events.length<n){if(Date.now()>deadline)throw Error('Watch result timeout');await new Promise(r=>setTimeout(r,20));}return events.at(-1);};
  assert.equal((await wait(1)).ok,true);
  const source=new URL('src/css/typography.css',root),original=await readFile(source,'utf8');
  await writeFile(source,original+'\n.en-extra{color:--token(--en-color-text)}');assert.equal((await wait(2)).ok,true);
  const output=new URL('src/generated/typography.ts',root);const watched=await readFile(output,'utf8');await authorCSS(root);assert.equal(await readFile(output,'utf8'),watched);
  const path=new URL('css-authoring.json',root),manifest=JSON.parse(await readFile(path,'utf8'));
  await writeFile(new URL('src/css/extra.css',root),'@function --extra(--x){result:var(--x)}');manifest.definitions.push('src/css/extra.css');await writeFile(path,JSON.stringify(manifest));assert.equal((await wait(3)).ok,true);
  await rm(new URL('src/css/extra.css',root));assert.equal((await wait(4)).ok,false);
  manifest.definitions.pop();await writeFile(path,JSON.stringify(manifest));assert.equal((await wait(5)).ok,true);
  await writeFile(source,'.a{width:--token(--en-unknown)}');assert.equal((await wait(6)).ok,false);await assert.rejects(readFile(output),{code:'ENOENT'});
  await writeFile(source,original);assert.equal((await wait(7)).ok,true);
  const recovered=await readFile(output,'utf8');await authorCSS(root);assert.equal(await readFile(output,'utf8'),recovered);
  manifest.entries.push({...manifest.entries[0]});await writeFile(path,JSON.stringify(manifest));assert.equal((await wait(8)).ok,false);
  manifest.entries.pop();manifest.entries[0].source='../escape.css';await writeFile(path,JSON.stringify(manifest));assert.equal((await wait(9)).ok,false);
 }finally{await stop?.();await rm(dir,{recursive:true,force:true});}
});

for (const [name, css, message] of invalidDefinitionCases(definitions[0].css)) {
  test(`definition contract: reject ${name} with source location`, () => {
    assert.throws(() => validateDefinitions([{filename:'bad-definitions.css',css}]),
      error => message.test(error.message) && /bad-definitions.css:\d+:\d+/.test(error.message));
  });
}

test('generated Lit adapters retain the production minifier and consumer CSS', async () => {
  const url=new URL('../../packages/styles/dist/generated/typography.js',import.meta.url);
  const source=await readFile(url,'utf8');
  const result=await minifyLitTemplates({include:[url]}).transform(source,fileURLToPath(url));
  assert.ok(result?.code.length < source.length);
  const runnable=result.code.replace("'lit'", JSON.stringify(import.meta.resolve('lit')))
    .replace("'../internal/sizing.js'",JSON.stringify(new URL('../../packages/styles/dist/internal/sizing.js',import.meta.url).href));
  const {typographyStyles}=await import('data:text/javascript;base64,'+Buffer.from(runnable).toString('base64'));
  assert.equal(canonical(typographyStyles.cssText),canonical(baseline.css.typography));
});
