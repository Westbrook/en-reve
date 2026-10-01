"""Verify frozen campaign and the extracted packages actually used by the probe."""
import pathlib,tarfile,hashlib,json,sys
root=pathlib.Path.cwd(); frozen=root/'showcases/performance/baselines/scoped-registry-phase-5-v1'
checks=(frozen/'checksums.sha256').read_bytes(); seal=json.loads((frozen/'seal.json').read_text())
assert hashlib.sha256(checks).hexdigest()==seal['checksumsSha256']
for line in checks.decode().splitlines():
 digest,name=line.split('  ',1);assert hashlib.sha256((frozen/name).read_bytes()).hexdigest()==digest,name
stage=pathlib.Path((root/'artifacts/scoped-registry-phase-5/production/stage.txt').read_text().strip())
packages=[]
for archive in sorted((frozen/'phase5/packed').glob('*.tgz')):
 count=0
 with tarfile.open(archive) as tar:
  metadata=json.load(tar.extractfile('package/package.json')); name=metadata['name']
  for item in tar.getmembers():
   if not item.isfile():continue
   relative=item.name.removeprefix('package/'); actual=stage/'phase5/node_modules'/name/relative
   assert actual.read_bytes()==tar.extractfile(item).read(),str(actual);count+=1
 packages.append({'name':name,'files':count,'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest()})
assert len(packages)==5
assert (stage/'phase5/study/island.mjs').read_bytes()==(frozen/'harness/production/island.mjs').read_bytes()
print(json.dumps({'frozenFilesVerified':seal['files'],'frozenSeal':seal['checksumsSha256'],'packages':packages},indent=2))
