"""Generate an explicit Phase5-only staging manifest; never stage unrelated results."""
import pathlib,json,subprocess,hashlib
r=pathlib.Path.cwd();out=r/'artifacts/scoped-registry-phase-5-closeout';paths=['package-lock.json','packages/ssr/README.md','packages/ssr/package.json','packages/ssr/tsconfig.json','packages/ssr/src/client.ts','packages/ssr/src/scoped.ts','packages/ssr/src/scoped-worker.ts','packages/ssr/src/hydration-manifest.ts','packages/ssr/src/island-markup.ts','packages/ssr/tests/scoped.test.mjs','plans/scoped-registry-phase-5.md']
for folder in ['packages/ssr/tests/scoped-fixtures','probes/scoped-hydration','showcases/performance/baselines/scoped-registry-phase-5-v1','showcases/performance/baselines/scoped-registry-phase-5-ssr-investigation-v1','showcases/performance/baselines/scoped-registry-phase-5-closeout-v1']:
 paths.extend(str(p.relative_to(r)) for p in (r/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
for folder,names in {
 'artifacts/scoped-registry-phase-5':['verification.json'],
 'artifacts/scoped-registry-phase-5-ssr-investigation':['verification.json','report.json'],
 'artifacts/scoped-registry-phase-5-manual-followup':['user-review.json','verification.json','browser.json'],
 'artifacts/scoped-registry-phase-5-closeout':['verification.json','runtime-parity.json','readiness-browser.json','report-verification.json','freeze.json','commit-boundary.json'],
}.items():paths.extend(folder+'/'+name for name in names)
# Reports remain independently viewable from the existing report server after checkout.
for folder in ['artifacts/scoped-registry-phase-5/production','artifacts/scoped-registry-phase-5-ssr-investigation','artifacts/scoped-registry-phase-5-closeout/production']:
 report=json.loads((r/folder/'report.json').read_text());paths.append('artifacts/scoped-registry-production-v1/page/'+report['filename'])
paths=sorted(set(paths));assert all((r/p).is_file() for p in paths),[p for p in paths if not (r/p).is_file()]
assert subprocess.check_output(['git','diff','--cached','--name-only'],cwd=r).decode().strip()=='','Index contains other work; preserve it and review before staging'
(out/'commit-paths.txt').write_text('\n'.join(paths)+'\n');(out/'commit-paths.nul').write_bytes(b'\0'.join(p.encode() for p in paths)+b'\0');print(len(paths),'explicit Phase5 files')
