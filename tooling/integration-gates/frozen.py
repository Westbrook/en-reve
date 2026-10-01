"""Read the original archive inventories; never regenerate their seals."""
import hashlib, json, os
from pathlib import Path
root=Path('showcases/performance/baselines'); receipts=[]
def sha(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for block in iter(lambda:f.read(1024*1024),b''): h.update(block)
 return h.hexdigest()
seals=sorted(root.glob('scoped-registry-*/seal.json'))
if len(seals)<15: raise RuntimeError('Missing required Phase 0–6 archives')
for seal in seals:
 d=json.loads(seal.read_text());p=seal.parent;inventory=p/'checksums.json'
 if inventory.exists(): entries=json.loads(inventory.read_text())['files']
 else:
  inventory=p/'checksums.sha256';entries=[dict(zip(['sha256','path'],line.split('  ',1))) for line in inventory.read_text().splitlines() if line.strip()]
 if sha(inventory)!=d['checksumsSha256'].removeprefix('sha256:'): raise RuntimeError(str(inventory))
 for e in entries:
  f=p/e['path']
  if not f.resolve().is_relative_to(p.resolve()) or sha(f)!=e['sha256'].removeprefix('sha256:'): raise RuntimeError(str(f))
 receipts.append(dict(archive=p.as_posix(),files=len(entries),sealSha256=sha(seal),checksumsSha256=sha(inventory)))
out=Path(os.environ['EN_GATE_STAGE_OUTPUT']);out.mkdir(parents=True,exist_ok=True)
(out/'frozen.json').write_text(json.dumps(dict(status='passed',archives=receipts),indent=2)+'\n')
print(f'{len(receipts)} archives, {sum(r["files"] for r in receipts)} files verified')
