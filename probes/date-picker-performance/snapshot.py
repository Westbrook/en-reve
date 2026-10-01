"""Snapshot exact source, harness, production packages and emitted assets before capture."""
from pathlib import Path
import os,json,shutil,hashlib
base=Path(os.environ.get('PHASE6_BASE','artifacts/scoped-registry-phase-6'));dest=base/'frozen-input';assert not dest.exists(),'Never replace measured inputs';dest.mkdir()
for name in json.loads(Path('probes/date-picker-performance/overlay.json').read_text()):
 p=dest/'source'/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(name,p)
shutil.copytree('probes/date-picker-performance',dest/'harness',ignore=shutil.ignore_patterns('__pycache__'))
for name in ['parent','candidate']:
 for path in (base/name).rglob('*'):
  if path.is_file() and ('site' in path.parts or 'packed' in path.parts or path.name=='receipt.json'):
   out=dest/path.relative_to(base);out.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,out)
# Capture shared imports separately so unrelated harness edits need not enter the
# application commit. Reproduction restores these only in an isolated checkout.
support=[]
for name in ['probes/scoped-hydration/production/server.mjs','showcases/performance/src/lock.mjs','showcases/performance/src/config.mjs','showcases/performance/registry/systems.json','showcases/performance/profiles/profiles.json']:
 p=Path(name);out=base/'supporting-harness'/name;out.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,out);support.append({'path':name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(base/'supporting-harness.json').write_text(json.dumps({'files':support,'purpose':'Exact supporting imports; restore only in an isolated reproduction checkout.'},indent=2)+'\n')
files=[{'path':str(p.relative_to(dest)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(dest.rglob('*')) if p.is_file()]
(dest/'manifest.json').write_text(json.dumps({'parent':'2dc77b5773839f7afdd52ce0b4fc68a6af35d0f4','files':files},indent=2)+'\n');print(len(files),'snapshotted inputs')
