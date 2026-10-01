import { mkdir, rename, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { lab } from './config.mjs';
export async function certificate(){
 const scratch=resolve(lab,'.cache/certificate-'+randomUUID());await mkdir(scratch,{recursive:true});
 try{execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',resolve(scratch,'key.pem'),'-out',resolve(scratch,'cert.pem'),'-days','30','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost,IP:127.0.0.1'],{stdio:'ignore'});await rename(resolve(scratch,'key.pem'),resolve(lab,'.cache/key.pem'));await rename(resolve(scratch,'cert.pem'),resolve(lab,'.cache/cert.pem'));console.log('Created a 30-day loopback-only certificate. OS trust and measured builds unchanged.');}
 finally{await rm(scratch,{recursive:true,force:true});}
}
