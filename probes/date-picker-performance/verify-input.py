import os
from pathlib import Path
import json,hashlib
base=Path(os.environ.get('PHASE6_BASE','artifacts/scoped-registry-phase-6'));root=base/'frozen-input';manifest=json.loads((root/'manifest.json').read_text())
for row in manifest['files']:
 p=root/row['path'];assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'],str(p)
 if row['path'].startswith('source/'):
  actual=Path(row['path'].removeprefix('source/'));assert actual.read_bytes()==p.read_bytes(),str(actual)
for run in ['final-cold','final-warm']:
 p=base/run
 if (p/'summary.json').exists():
  info=json.loads((p/'manifest.json').read_text())
  for receipt in info['receipts']:
   for asset in receipt['assets']:assert hashlib.sha256((base/receipt['path']/'site'/asset['path']).read_bytes()).hexdigest()==asset['sha256']
print('Frozen inputs, current runtime overlay and completed campaign assets match.')
