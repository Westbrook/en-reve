import {mkdir, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {generateElements} from './generate-elements.ts';
import {compilerResolution} from './compiler-api.mjs';

/** Writes only a fresh caller-owned comparison directory, never the package's retained metadata. */
export async function writeCandidateElements(output: string, packageRoot = fileURLToPath(new URL('../../packages/elements/',import.meta.url))) {
  output=resolve(output);await mkdir(output);
  await writeFile(join(output,'status.json'),JSON.stringify({status:'running',kind:'unqualified-candidate'})+'\n',{flag:'wx'});
  try {
    const result=await generateElements(packageRoot);
    await writeFile(join(output,'custom-elements.json'),JSON.stringify(result.manifest,null,2)+'\n',{flag:'wx'});
    await writeFile(join(output,'custom-elements.json.receipt.json'),JSON.stringify(result.receipt,null,2)+'\n',{flag:'wx'});
    await writeFile(join(output,'compiler-resolution.json'),JSON.stringify(compilerResolution(),null,2)+'\n',{flag:'wx'});
    await writeFile(join(output,'status.json'),JSON.stringify({status:'generated-unqualified',sourceFiles:Object.keys(result.receipt.sources).length,requiresBaselineComparison:true})+'\n');
    return result;
  } catch(error) {await writeFile(join(output,'status.json'),JSON.stringify({status:'failed',error:String(error)})+'\n');throw error;}
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  if(!process.argv[2])throw new Error('Usage: node generate-candidate-elements.ts <fresh-output-directory> [elements-package-root]');
  await writeCandidateElements(process.argv[2],process.argv[3]);
}
