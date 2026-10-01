"""Verify staged files, frozen archives and recorded runtime against the index."""
import pathlib,json,subprocess,hashlib
r=pathlib.Path.cwd();base=r/'artifacts/scoped-registry-phase-5-closeout';expected=(base/'commit-paths.txt').read_text().splitlines();actual=subprocess.check_output(['git','diff','--cached','--name-only'],cwd=r).decode().splitlines();assert sorted(expected)==sorted(actual),(set(actual)-set(expected),set(expected)-set(actual))
def staged(p):return subprocess.check_output(['git','show',':'+p],cwd=r)
for name in ['scoped-registry-phase-5-v1','scoped-registry-phase-5-ssr-investigation-v1','scoped-registry-phase-5-closeout-v1']:
 prefix='showcases/performance/baselines/'+name+'/';seal=json.loads(staged(prefix+'seal.json'));checks=staged(prefix+'checksums.sha256');assert hashlib.sha256(checks).hexdigest()==seal['checksumsSha256']
 for line in checks.decode().splitlines():
  digest,path=line.split('  ',1);assert hashlib.sha256(staged(prefix+path)).hexdigest()==digest,path
for p in expected:assert staged(p)==(r/p).read_bytes(),p
print('Index scope and all three frozen archives verified:',len(expected),'files')
