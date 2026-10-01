import { access, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { lab,repo } from './config.mjs';
export async function doctor(){
 const checks=[];const check=async(name,fn)=>{try{checks.push({name,ok:true,detail:await fn()})}catch(e){checks.push({name,ok:false,detail:e.message})}};
 await check('Pinned Node',async()=>{const expected=(await readFile(resolve(repo,'.node-version'),'utf8')).trim();if(process.versions.node!==expected)throw Error(`Use tooling/test-pipeline/with-toolchain.sh; expected ${expected}, got ${process.versions.node}`);return expected;});
 await check('Pinned npm',async()=>{const expected=JSON.parse(await readFile(resolve(repo,'package.json'))).packageManager.replace('npm@','');const got=execFileSync('npm',['--version']).toString().trim();if(got!==expected)throw Error(`Expected ${expected}, got ${got}`);return got;});
 await check('OpenSSL',async()=>execFileSync('openssl',['version']).toString().trim());
 await check('Lab lockfile installed',async()=>{await access(resolve(lab,'node_modules/@playwright/test/package.json'));const expected=JSON.parse(await readFile(resolve(lab,'package.json'))).devDependencies['@playwright/test'];const got=JSON.parse(await readFile(resolve(lab,'node_modules/@playwright/test/package.json'))).version;if(got!==expected)throw Error('Run npm ci in showcases/performance');return got;});
 await check('Browser executables',async()=>{const {chromium,firefox,webkit}=await import('@playwright/test');for(const type of [chromium,firefox,webkit])await access(type.executablePath());return 'Chromium, Firefox, WebKit installed (OS launch dependencies checked by qualification)';});
 await check('Prepared inventory',async()=>{const inv=JSON.parse(await readFile(resolve(lab,'.cache/inventory.json')));return {systems:inv.systems.map(s=>s.id),qualificationRequired:inv.requiresFunctionalQualification};});
 await check('Local TLS certificate (renew with campaign.mjs certificate)',async()=>{execFileSync('openssl',['x509','-checkend','0','-noout','-in',resolve(lab,'.cache/cert.pem')]);await access(resolve(lab,'.cache/key.pem'));return 'Unexpired local certificate and key';});
 return {ready:checks.every(c=>c.ok),checks,note:'Read-only preflight; does not claim quiet hardware, functional qualification or a performance result.'};
}
