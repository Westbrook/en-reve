import pathlib,json,hashlib,datetime,gzip
r=pathlib.Path(__file__).resolve().parents[3];b=r/'artifacts/scoped-registry-phase-4-closeout';s=pathlib.Path((b/'isolation-path.txt').read_text().strip());ref=r/'artifacts/scoped-registry-phase-4-followup/route/source';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();diff=[];same=0
for pkg in ['elements','primitives','styles','tokens','ssr']:
 for p in (s/'packages'/pkg/'dist').rglob('*.js'):
  rel=p.relative_to(s);old=ref/rel
  if not old.exists():assert str(rel)=='packages/elements/dist/activation.js';continue
  if sha(p)!=sha(old):diff.append({'path':str(rel),'sha256':sha(p),'beforeSha256':sha(old),'bytesChange':len(p.read_bytes())-len(old.read_bytes()),'gzipBytesChange':len(gzip.compress(p.read_bytes(),mtime=0))-len(gzip.compress(old.read_bytes(),mtime=0))})
  else:same+=1
assert [x['path'] for x in diff]==['packages/elements/dist/command-palette/element.js'],diff
assert sha(s/'packages/elements/src/command-palette/element.ts')==json.loads((b/'dismissal-candidate.json').read_text())['sourceSha256']
assets=[{'path':str(p.relative_to(s/'dist')),'bytes':p.stat().st_size,'sha256':sha(p)} for p in (s/'dist').rglob('*') if p.is_file()]
(b/'integrated/receipt-before-dismissal.json').write_bytes((b/'integrated/receipt.json').read_bytes());(b/'integrated/receipt.json').write_text(json.dumps({'basis':'Accepted dismissal-ordering final production build; isolated source with unrelated changes excluded','assets':assets},indent=2)+'\n')
report={'status':'passed','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'unchangedRuntimeModules':same,'runtimeDifferences':diff,'checks':['elements TypeScript build','metadata generation','SSR build','full production docs build and SSR generation','API/type freshness','45 palette browser checks','9 served SSR dismissal traces'],'sourceSha256':sha(s/'packages/elements/src/command-palette/element.ts'),'performanceQualification':'Original freezes preserved and remain historical measurements. Sole runtime delta changes accepted closing order, adds a guarded pre-render check on opening, and slightly changes optional payload. No new timing claim for this final patch. Phase 5 comparisons must identify the sealed Phase 4 commit and rebuild their reference from it.'}
(b/'final-build-verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
