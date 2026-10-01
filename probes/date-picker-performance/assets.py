import os
from pathlib import Path
import json,re,subprocess
base=Path(os.environ.get('PHASE6_BASE','artifacts/scoped-registry-phase-6'));rows=[]
for arm in ['parent/eager','candidate/eager','candidate/dom','candidate/cold','candidate/intent','candidate/route']:
 site=base/arm/'site';page=(site/'index.html').read_text();initial=set(re.findall(r'(?:src|href)="(/assets/[^" ]+\.js)"',page));assets=[]
 for p in sorted((site/'assets').glob('*.js')):
  b=p.read_bytes();gz=int(subprocess.check_output(['node','--input-type=module','-e',"import{readFileSync}from'node:fs';import{gzipSync}from'node:zlib';process.stdout.write(String(gzipSync(readFileSync(process.argv[1]),{level:6}).length));",str(p)]));assets.append({'path':p.name,'rawBytes':len(b),'gzipBytes':gz,'entryOrPreload':'/assets/'+p.name in initial})
 rows.append({'arm':arm,'entryOrPreloadGzipBytes':sum(x['gzipBytes'] for x in assets if x['entryOrPreload']),'allEmittedGzipBytes':sum(x['gzipBytes'] for x in assets),'allEmittedRawBytes':sum(x['rawBytes'] for x in assets),'assets':assets})
(base/'asset-inventory.json').write_text(json.dumps({'note':'Deterministic emitted sizes; entry/preload references read from Vite HTML. Not observed transfer bytes. Uses the same Node zlib gzip level 6 as the delivery server.','rows':rows},indent=2)+'\n')
for row in rows:print(row['arm'],row['entryOrPreloadGzipBytes'],row['allEmittedGzipBytes'])
