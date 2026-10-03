import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyVisualEvidence,encodeVisualBundle} from './reader.mjs';
export async function packageVisualEvidence(directory,build){
 const report=JSON.parse(await readFile(resolve(directory,'evidence.json'),'utf8')),files=new Map();
 for(const artifact of report.artifacts){if(!/^artifacts\/[a-f0-9]{64}\.(png|json)$/.test(artifact.path))throw new Error('Invalid artifact path.');files.set(artifact.path,new Uint8Array(await readFile(resolve(directory,artifact.path))));}
 await verifyVisualEvidence(report,files,build);return encodeVisualBundle(report,files);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [directory,buildFile,output]=process.argv.slice(2);if(!output)throw new Error('Usage: node tooling/visual-review/package.mjs <evidence-directory> <review-build.json> <new-bundle.json>');
 await writeFile(output,await packageVisualEvidence(directory,JSON.parse(await readFile(buildFile,'utf8'))),{flag:'wx'});console.log('Portable visual evidence written to '+resolve(output));
}
