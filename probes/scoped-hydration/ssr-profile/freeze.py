import pathlib,json,hashlib,shutil,datetime
root=pathlib.Path.cwd();src=root/'artifacts/scoped-registry-phase-5-ssr-investigation';dest=root/'showcases/performance/baselines/scoped-registry-phase-5-ssr-investigation-v1'
assert not dest.exists(),'Never overwrite frozen evidence'
report=json.loads((src/'report.json').read_text()); data=json.loads((src/'campaign-v1/samples.json').read_text());verification=json.loads((src/'report-verification.json').read_text())
assert len(data['samples'])==120 and len(data['qualification'])==10
assert all(c['passed'] for c in verification['checks']) and len(verification['checks'])==3
assert hashlib.sha256((src/report['filename']).read_bytes()).hexdigest()==report['sha256']
# Recheck original freeze before sealing this separate supplement.
old=root/'showcases/performance/baselines/scoped-registry-phase-5-v1';seal=json.loads((old/'seal.json').read_text());checks=(old/'checksums.sha256').read_bytes();assert hashlib.sha256(checks).hexdigest()==seal['checksumsSha256']
for line in checks.decode().splitlines():
 digest,p=line.split('  ',1);assert hashlib.sha256((old/p).read_bytes()).hexdigest()==digest,p
dest.mkdir()
for p in ['campaign-v1/samples.json','campaign-v1/receipt.json','qualification-v2/samples.json','qualification-v2/receipt.json','comparison.json','report.json','report-verification.json','provenance.json',report['filename']]:
 target=dest/p;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src/p,target)
shutil.copytree(root/'probes/scoped-hydration/ssr-profile',dest/'harness')
shutil.copy2(root/'packages/ssr/README.md',dest/'ssr-readme.md')
shutil.copy2(root/'plans/scoped-registry-phase-5.md',dest/'phase5-plan.md')
# Snapshot the exact fixture and isolation checks used in the measured temporary study.
stage=pathlib.Path(json.loads((src/'campaign-v1/receipt.json').read_text())['stage']);(dest/'fixture').mkdir()
for name in ['rendered.json','island.mjs','one.mjs','two.mjs','stateful.mjs','worker.mjs','driver.mjs']:shutil.copy2(stage/name,dest/'fixture'/name)
files=sorted(p for p in dest.rglob('*') if p.is_file());checks=''.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.relative_to(dest)}\n' for p in files);(dest/'checksums.sha256').write_text(checks)
result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':len(files),'checksumsSha256':hashlib.sha256(checks.encode()).hexdigest(),'timings':120,'samplesPerConfiguration':30,'qualificationChecks':10,'originalPhase5Seal':seal['checksumsSha256'],'clientCampaignUnchanged':True,'runtimeApiUnchanged':True,'report':report,'stagePackagesReference':'../scoped-registry-phase-5-v1/phase5/packed','limits':'Diagnostic prototype only. No new retention, pool capacity or end-to-end HTTP campaign. Manual Phase 5 acceptance unchanged.'}
(dest/'seal.json').write_text(json.dumps(result,indent=2)+'\n');(src/'verification.json').write_text(json.dumps(result,indent=2)+'\n')
for line in checks.splitlines():
 digest,p=line.split('  ',1);assert hashlib.sha256((dest/p).read_bytes()).hexdigest()==digest
print(json.dumps(result,indent=2))
