import os
from pathlib import Path
import subprocess,json,shutil,hashlib,os
r=Path.cwd();stage=Path((r/(os.environ.get('PHASE6_BASE','artifacts/scoped-registry-phase-6')+'/candidate/stage.txt')).read_text());dest=stage/'consumer/ssr';shutil.copytree(r/'probes/date-picker-performance/ssr',dest,dirs_exist_ok=True);out=r/(os.environ.get('PHASE6_BASE','artifacts/scoped-registry-phase-6')+'/ssr/site')
with (r/(os.environ.get('PHASE6_BASE','artifacts/scoped-registry-phase-6')+'/ssr-build.log')).open('w') as log:subprocess.run(['node','build.mjs'],cwd=dest,env=dict(os.environ,REVIEW_OUT=str(out)),stdout=log,stderr=subprocess.STDOUT,check=True)
(out.parent/'receipt.json').write_text(json.dumps({'assets':[{'path':str(p.relative_to(out)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in out.rglob('*') if p.is_file()]},indent=2))
