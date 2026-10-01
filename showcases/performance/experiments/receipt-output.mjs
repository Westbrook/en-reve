import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));

/** Preserve original standalone destinations; graph calls bind fresh retained evidence. */
export async function writeExperimentReceipt(relative,data,options={}) {
 if(typeof relative!=='string'||!relative.startsWith('reports/')||relative.includes('\\')||relative.split('/').some(part=>!part||part==='.'||part==='..'))throw new Error('Invalid experiment receipt path');
 const output=process.env.EN_NATIVE_EXPERIMENT_OUTPUT;
 const file=output?resolve(output,relative.slice('reports/'.length)):resolve(root,relative);
 if(output)await mkdir(dirname(file),{recursive:true});
 return writeFile(file,data,output?{...options,flag:'wx'}:options);
}
