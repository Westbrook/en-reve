"""Create a new immutable archive; refuse incomplete cells or unresolved acceptance gates."""
from pathlib import Path
import os,json,shutil,hashlib,datetime,collections,tempfile,subprocess
r=Path.cwd();base=r/os.environ.get('PHASE6_BASE','artifacts/scoped-registry-phase-6');dest=r/os.environ.get('PHASE6_ARCHIVE','showcases/performance/baselines/scoped-registry-phase-6-v2')
assert not dest.exists(),'Never overwrite an existing reference campaign'
subprocess.run(['python3','probes/date-picker-performance/verify-input.py'],check=True)
qualification=json.loads((base/'qualification.json').read_text());assert len(qualification['results'])>=11 and all(x['status']=='pass' for x in qualification['results'])
analysis=json.loads((base/'analysis.json').read_text());runs=analysis['runs'];assert 'final-cold' in runs and 'final-warm' in runs
counts={}
for run in runs:
 summary=json.loads((base/run/'summary.json').read_text());manifest=json.loads((base/run/'manifest.json').read_text());samples=[json.loads(x) for x in (base/run/'samples.jsonl').read_text().splitlines()]
 assert len(samples)==summary['successful']==len(manifest['jobs']) and all(x['status']=='ok' for x in samples)
 cells=collections.Counter((x['path'],x['mode'],x['browser'],x['profile'],x['input'],x['kind']) for x in samples)
 assert all(n>= (5 if key[-1]=='retention' else 30) for key,n in cells.items()),(run,cells)
 expected=collections.Counter((x['path'],x['mode'],x['browser'],x['profile'],x['input'],x['kind']) for x in manifest['jobs']);assert cells==expected
 for x in samples:
  job={k:x[k] for k in manifest['jobs'][0]};assert job in manifest['jobs']
 assert len({(x['key'],x['browser'],x['profile'],x['input'],x['kind'],x['block']) for x in samples})==len(samples),'Duplicate samples'
 counts[run]={'timing':sum(x['kind']=='timing' for x in samples),'retention':sum(x['kind']=='retention' for x in samples),'cells':[{'configuration':list(k),'n':v} for k,v in cells.items()]}
assert counts['final-cold']['retention']==20
assert counts['final-cold']['timing']==720 and counts['final-warm']['timing']==240,'Required primary configuration coverage missing'
for name in ['functional/verification.json','extended.json','ssr/verification.json','scaling.json','range-regression.json','report-verification.json','manual-fixture-verification.json','retry-integration-verification.json','reenable-verification.json']:
 receipt=json.loads((base/name).read_text());items=receipt.get('results',receipt.get('checks',[]));assert items and all(x.get('status','pass')=='pass' for x in items),name
assert json.loads((base/'budget-check.json').read_text())['automatedGate']=='pass'
assert json.loads((base/'manual-review.json').read_text())['status']=='accepted_with_documented_browser_limits'
# Verify older reference checksums without changing any historical receipt.
verified=[]
for seal in sorted((r/'showcases/performance/baselines').glob('scoped-registry-*/seal.json')):
 checks=seal.parent/'checksums.sha256'
 if not checks.exists():checks=seal.parent/'checksums.json'
 assert checks.exists(),str(seal)
 data=json.loads(seal.read_text());raw=checks.read_bytes()
 if 'checksumsSha256' in data:assert hashlib.sha256(raw).hexdigest()==data['checksumsSha256'],str(seal)
 entries=[(x['sha256'],x['path']) for x in json.loads(raw)['files']] if checks.suffix=='.json' else [line.split('  ',1) for line in raw.decode().splitlines()]
 for digest,path in entries:assert hashlib.sha256((seal.parent/path).read_bytes()).hexdigest()==digest,str(seal.parent/path)
 verified.append(str(seal.parent.relative_to(r)))
# Build beside the destination and publish only once every check/copy succeeds.
stage=Path(tempfile.mkdtemp(prefix='.phase6-seal-',dir=dest.parent))
for name in ['frozen-input',*runs,'ssr','functional','supporting-harness']:shutil.copytree(base/name,stage/name)
if (base/'rejected-campaign-v3').exists():shutil.copytree(base/'rejected-campaign-v3',stage/'rejected-campaign-v3')
for path in base.iterdir():
 if path.is_file() and path.suffix in ['.json','.log','.html']:shutil.copy2(path,stage/path.name)
shutil.copytree(r/'probes/date-picker-performance',stage/'harness',ignore=shutil.ignore_patterns('__pycache__'))
for name in ['scoped-registry-phase-6.md','scoped-registry-phase-6-results.md']:shutil.copy2(r/'plans'/name,stage/name)
(stage/'older-seals-verified.json').write_text(json.dumps(verified,indent=2)+'\n')
checks=''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(stage))+'\n' for p in sorted(stage.rglob('*')) if p.is_file());(stage/'checksums.sha256').write_text(checks)
seal={'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checksumsSha256':hashlib.sha256(checks.encode()).hexdigest(),'files':len(checks.splitlines()),'parentCommit':'2dc77b5773839f7afdd52ce0b4fc68a6af35d0f4','status':'Final automated gates passed; targeted manual review accepted with documented browser limits. Source identity is frozen-input/manifest.json; source commit follows this seal.','campaigns':counts}
(stage/'seal.json').write_text(json.dumps(seal,indent=2)+'\n');stage.rename(dest);print(json.dumps({'archive':str(dest),'files':seal['files'],'priorSealsVerified':len(verified)}))
