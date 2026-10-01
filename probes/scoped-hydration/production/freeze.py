import pathlib,json,hashlib,shutil,subprocess,datetime,sys
r=pathlib.Path.cwd();base=r/'artifacts/scoped-registry-phase-5/production';run=sys.argv[1] if len(sys.argv)>1 else 'campaign-v2';dest=r/'showcases/performance/baselines/scoped-registry-phase-5-v1'
assert not dest.exists(),'Never replace an existing freeze';summary=json.loads((base/run/'summary.json').read_text());assert summary['timing']==540 and summary['retention']==15 and summary['failed']==0
for policy in ['eager','prepared','cold']:
 receipt=json.loads((base/policy/'receipt.json').read_text())
 for a in receipt['assets']:assert hashlib.sha256((base/policy/'site'/a['path']).read_bytes()).hexdigest()==a['sha256']
 for p in receipt['packages']:assert hashlib.sha256((base/p['path']).read_bytes()).hexdigest()==p['sha256']
 for s in receipt['overlay']:assert hashlib.sha256((r/s['path']).read_bytes()).hexdigest()==s['sha256']
dest.mkdir(parents=True)
for name in ['eager','prepared','cold','phase4/packed','phase5/packed',run,'qualification-cleanup']:
 shutil.copytree(base/name,dest/name)
for name in ['retention-settlement.json','capture-verification.json','functional.json','power-during.txt','thermal-during.txt','source.json','comparison.json','findings.json','phase4-server-cost.json','phase5-server-cost.json']:
 shutil.copy2(base/name,dest/name)
shutil.copy2(r/'plans/scoped-registry-phase-5.md',dest/'phase5-plan.md')
shutil.copytree(r/'probes/scoped-hydration',dest/'harness',ignore=shutil.ignore_patterns('node_modules','test-results'))
for s in json.loads((base/'source.json').read_text())['overlay']:
 target=dest/'source'/s['path'];target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(r/s['path'],target)
shutil.copytree(r/'packages/ssr/tests/scoped-fixtures',dest/'source/packages/ssr/tests/scoped-fixtures');shutil.copy2(r/'packages/ssr/tests/scoped.test.mjs',dest/'source/packages/ssr/tests/scoped.test.mjs')
for name in ['browser.json','browser-cleanup-final.log','ssr-regressions-final.log','production-build-cleanup.log','verification.json']:
 shutil.copy2(r/'artifacts/scoped-registry-phase-5'/name,dest/name)
subprocess.run(['git','archive','--format=tar.gz','--output='+str(dest/'phase4-authored-source.tar.gz'),'5cab32d9311cb1a730fa9741e3334d03f7fc442a','--','packages','tooling','tsconfig.base.json','package.json','package-lock.json'],check=True)
files=[{'path':str(p.relative_to(dest)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(dest.rglob('*')) if p.is_file()]
checks=''.join(f"{f['sha256']}  {f['path']}\n" for f in files);(dest/'checksums.sha256').write_text(checks)
seal={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'campaign':run,'parentCommit':'5cab32d9311cb1a730fa9741e3334d03f7fc442a','checksumsSha256':hashlib.sha256(checks.encode()).hexdigest(),'files':len(files),'bytes':sum(f['bytes'] for f in files),'timing':540,'retention':15,'serverTiming':60,'candidateCommitted':False,'manualAcceptance':'pending','exploratoryCapture':'campaign-v1 excluded; stopped for inert-template release cleanup'}
(dest/'seal.json').write_text(json.dumps(seal,indent=2)+'\n');print(json.dumps(seal,indent=2))
