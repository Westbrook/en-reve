import {contentInventory} from '../evidence/setup.mjs';
import {sourceIdentity} from '../releases/source-identity.mjs';
import {fileDigests} from './file-digests.mjs';

/** A fresh reader per call. Never use a prior phase's digests for verification. */
export async function inputIdentity(root, output, {includeSource=false, exclude=()=>false}={}) {
 const reader=fileDigests();
 const options={digestFile:reader.digestFile};
 // Finder creates these view-preference files when a user browses a folder.
 // Match only its exact basename; similarly named source files remain inputs.
 const excludeInput=name=>name.split('/').at(-1)==='.DS_Store'||exclude(name);
 const started=performance.now();
 const [source,workspace,ownedFixtures]=await Promise.all([
  includeSource?sourceIdentity(root,options):undefined,
  contentInventory(root,['packages','apps/docs','tooling','probes','dist','showcases/performance-results','package.json','package-lock.json','node_modules',process.execPath],excludeInput,true,options),
  contentInventory(output,['fixtures','packages'],excludeInput,true,options),
 ]);
 return {source,inputs:{workspace,ownedFixtures},measurement:{wallMs:performance.now()-started,...reader.stats()}};
}
