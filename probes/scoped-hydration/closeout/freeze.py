"""Seal the final application-readiness campaign; never alter earlier freezes."""
import pathlib,json,hashlib,shutil,datetime
r=pathlib.Path.cwd();base=r/'artifacts/scoped-registry-phase-5-closeout';prod=base/'production';dest=r/'showcases/performance/baselines/scoped-registry-phase-5-closeout-v1';assert not dest.exists()
verification=json.loads((prod/'capture-verification.json').read_text());assert verification['passed'];report=json.loads((prod/'report.json').read_text());assert hashlib.sha256((prod/report['filename']).read_bytes()).hexdigest()==report['sha256'];assert len(json.loads((base/'report-verification.json').read_text())['checks'])==3
prior=[]
for name in ['scoped-registry-phase-5-v1','scoped-registry-phase-5-ssr-investigation-v1']:
 old=r/'showcases/performance/baselines'/name;s=json.loads((old/'seal.json').read_text());checks=(old/'checksums.sha256').read_bytes();assert hashlib.sha256(checks).hexdigest()==s['checksumsSha256']
 for line in checks.decode().splitlines():
  digest,p=line.split('  ',1);assert hashlib.sha256((old/p).read_bytes()).hexdigest()==digest,p
 prior.append({'name':name,'checksumsSha256':s['checksumsSha256']})
dest.mkdir()
for name in ['eager','prepared','cold','campaign']:shutil.copytree(prod/name,dest/name)
for name in ['comparison.json','capture-verification.json','functional.json','report.json','source.json',report['filename']]:shutil.copy2(prod/name,dest/name)
for name in ['readiness-browser.json','readiness-browser.log','qualification.log','functional.log','runtime-parity.json','clean-build-tests.log','report-verification.json']:shutil.copy2(base/name,dest/name)
shutil.copytree(r/'probes/scoped-hydration',dest/'harness')
for folder in ['src','tests/scoped-fixtures']:
 # Runtime sources are small and retain the commit's exact source; shared unrelated tests excluded.
 for p in (r/'packages/ssr'/folder).glob('*.ts' if folder=='src' else '*.mjs'):
  if folder=='src' and p.name not in ['client.ts','scoped.ts','scoped-worker.ts','hydration-manifest.ts','island-markup.ts']:continue
  target=dest/'source/packages/ssr'/folder/p.name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
for p in ['packages/ssr/README.md','packages/ssr/package.json','packages/ssr/tsconfig.json','packages/ssr/tests/scoped.test.mjs','package-lock.json','plans/scoped-registry-phase-5.md']:
 target=dest/'source'/p;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(r/p,target)
for p in ['user-review.json','verification.json','browser.json']:
 target=dest/'manual'/p;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(r/'artifacts/scoped-registry-phase-5-manual-followup'/p,target)
files=sorted(p for p in dest.rglob('*') if p.is_file());checks=''.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.relative_to(dest)}\n' for p in files);(dest/'checksums.sha256').write_text(checks)
seal={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':len(files),'bytes':sum(p.stat().st_size for p in files),'checksumsSha256':hashlib.sha256(checks.encode()).hexdigest(),'timing':540,'retention':15,'successfulSamplesPerConfiguration':30,'separateRetentionPerPolicy':5,'earlierFreezesVerifiedUnchanged':prior,'runtimePackagesReference':'../scoped-registry-phase-5-v1/phase5/packed','serverTimings':'Historical cohorts: previous 60 samples and separate 120-sample SSR investigation retained. Renderer unchanged; new application-helper import overhead not remeasured.','manual':'User confirmed main flows and focused retests. Integrated once-per-island readiness passes automated checks; physical IME/autofill/hydrated-field history remain unreported.','commitIdentity':'git log -1 --format=%H -- artifacts/scoped-registry-phase-5-closeout/commit-boundary.json'}
(dest/'seal.json').write_text(json.dumps(seal,indent=2)+'\n');(base/'freeze.json').write_text(json.dumps(seal,indent=2)+'\n');print(json.dumps(seal,indent=2))
