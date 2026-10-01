"""Confirm the final commit's SSR runtime is exactly the runtime previously qualified."""
import pathlib,json,hashlib
r=pathlib.Path.cwd();f=r/'showcases/performance/baselines/scoped-registry-phase-5-v1';original=json.loads((r/'artifacts/scoped-registry-phase-5/verification.json').read_text());checked=[]
for item in original['sources']:
 p=item['path']
 if p.startswith('packages/ssr/') and not p.endswith('README.md'):
  assert hashlib.sha256((r/p).read_bytes()).hexdigest()==item['sha256'],p
  checked.append(p)
lock=json.loads((r/'package-lock.json').read_text());pkg=json.loads((r/'packages/ssr/package.json').read_text())
assert lock['packages']['packages/ssr']['dependencies']==pkg['dependencies']
print(json.dumps({'runtimeAndTestsByteIdenticalToQualifiedPhase5':checked,'lockfileDependenciesMatch':True},indent=2))
