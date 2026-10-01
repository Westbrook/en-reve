import { readFile, mkdir, readdir, writeFile, rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, isAbsolute } from 'node:path';
import { compileStyles } from '../../../tooling/css-authoring/compiler.mjs';
import { tokenCSS } from '../src/internal/token-values.ts';
import { styleOverrideNames } from '@en-reve/tokens/customization.js';

async function generate(root = new URL('../', import.meta.url)) {
  const manifest = JSON.parse(await readFile(new URL('css-authoring.json',root),'utf8'));
  const rootPath=fileURLToPath(root);
  const inside=path=>{const rel=relative(rootPath,resolve(rootPath,path));if(rel.startsWith('..')||isAbsolute(rel))throw Error(`CSS input outside package: ${path}`);return new URL(path,root);};
  const inputs=await Promise.all(manifest.definitions.map(async path=>({filename:fileURLToPath(inside(path)),css:await readFile(inside(path),'utf8')})));
  const modules=new Set(),sources=new Set(),names=new Set();
  const outputs=await Promise.all(manifest.entries.map(async entry=>{
    if(!/^[a-z][a-z-]*$/.test(entry.module)||!/^\w+Styles$/.test(entry.export)||modules.has(entry.module)||sources.has(entry.source)||names.has(entry.export))throw Error('Invalid or duplicate CSS entry');
    modules.add(entry.module);sources.add(entry.source);names.add(entry.export);
    const path=inside(entry.source);
    const css=compileStyles({definitions:inputs,css:await readFile(path,'utf8'),filename:fileURLToPath(path),token:tokenCSS,overrides:styleOverrideNames});
    // Preserve Lit's static-template caching and the existing production minifier.
    // Escape template delimiters so CSS strings cannot become JavaScript expressions.
    const literal = css.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${');
    return {module:entry.module,text:`// Generated from ${entry.source}; edit the CSS source.\nimport { css } from 'lit';\nimport { sizedStyles } from '../internal/sizing.js';\nexport const ${entry.export} = sizedStyles(css\`${literal}\`);\n`};
  }));
  const dir=new URL('src/generated/',root);await mkdir(dir,{recursive:true});
  // Validate all inputs first; never leave a half-generated successful build.
  for(const output of outputs){const path=new URL(output.module+'.ts',dir);if(await readFile(path,'utf8').catch(()=>null)===output.text)continue;await writeFile(new URL(output.module+'.tmp',dir),output.text);await rename(new URL(output.module+'.tmp',dir),path);}
  for(const name of await readdir(dir))if(name.endsWith('.ts')&&!modules.has(name.slice(0,-3)))await rm(new URL(name,dir));
  return outputs.map(o=>o.module);
}
export async function authorCSS(root = new URL('../', import.meta.url)) {
  try { return await generate(root); }
  catch (error) {
    // Make failed rebuilds explicit to consumers; never serve old generated recipes.
    await Promise.all(['src/generated/', 'dist/generated/', 'tsconfig.tsbuildinfo',
      'dist/typography.css', 'dist/surfaces.css', 'dist/foundations.css']
      .map(path => rm(new URL(path, root), {recursive:true, force:true})));
    throw error;
  }
}
if(process.argv[1] === fileURLToPath(import.meta.url)) {
  try { await authorCSS(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
