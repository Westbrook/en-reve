import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Bind generated source before the graph records consumer input identities. */
export async function prepareMinificationSource(directory=import.meta.dirname) {
 const text=`export default ${JSON.stringify(await readFile(resolve(directory,'template.mjs'),'utf8'))};\n`;
 const generated=resolve(directory,'source.generated.mjs');
 const previous=await readFile(generated,'utf8').catch(error=>{if(error.code==='ENOENT')return null;throw error;});
 if(previous!==text)await writeFile(generated,text);
}
