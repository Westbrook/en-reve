"""Build final application policy against the frozen Phase5 runtime packages."""
import pathlib,json,tempfile,shutil,subprocess,hashlib,tarfile
r=pathlib.Path.cwd();frozen=r/'showcases/performance/baselines/scoped-registry-phase-5-v1';out=r/'artifacts/scoped-registry-phase-5-closeout/production';out.mkdir(parents=True,exist_ok=True)
assert not (out/'prepared/site').exists(),'Use a new capture directory; do not replace measured sites'
old=pathlib.Path((r/'artifacts/scoped-registry-phase-5/production/stage.txt').read_text().strip());stage=pathlib.Path(tempfile.mkdtemp(prefix='phase5-closeout-'));(out/'stage.txt').write_text(str(stage));(stage/'node_modules/@en-reve').mkdir(parents=True)
for p in (r/'node_modules').iterdir():
 if p.name!='@en-reve':(stage/'node_modules'/p.name).symlink_to(p,target_is_directory=p.is_dir())
packages=[]
for archive in sorted((frozen/'phase5/packed').glob('*.tgz')):
 with tarfile.open(archive) as tar:
  name=json.load(tar.extractfile('package/package.json'))['name'];dest=stage/'node_modules'/name;dest.mkdir()
  for item in tar.getmembers():
   item.name=item.name.removeprefix('package/')
   if item.name and item.name!='package':tar.extract(item,dest,filter='data')
 packages.append({'path':str(archive.relative_to(r)),'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()})
app=stage/'study';shutil.copytree(r/'probes/scoped-hydration/production',app)
# Keep HTML/snapshot exactly equal to the original campaign; only the JS readiness policy changes.
for name in ['index.html','rendered.json']:shutil.copy2(old/'phase5/study'/name,app/name)
shutil.copy2(app/'phase5.mjs',app/'selected.mjs')
sources=[{'path':str(p.relative_to(r)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted((r/'probes/scoped-hydration/production').glob('*')) if p.is_file()]
for policy in ['prepared','cold']:
 dest=out/policy/'site';dest.parent.mkdir(exist_ok=True)
 (app/'vite.config.mjs').write_text("export default {build:{target:'es2022',outDir:"+json.dumps(str(dest))+",emptyOutDir:true},define:{__POLICY__:"+json.dumps(json.dumps(policy))+"}};")
 with (out/policy/'build.log').open('w') as log:subprocess.run(['node',str(r/'node_modules/vite/bin/vite.js'),'build'],cwd=app,stdout=log,stderr=subprocess.STDOUT,check=True)
 assets=[{'path':str(p.relative_to(dest)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(dest.rglob('*')) if p.is_file()]
 (dest.parent/'receipt.json').write_text(json.dumps({'phase':'phase5','policy':policy,'parentCommit':'5cab32d9311cb1a730fa9741e3334d03f7fc442a','assets':assets,'packages':packages,'overlay':[],'applicationSources':sources},indent=2)+'\n')
shutil.copytree(frozen/'eager',out/'eager');d=json.loads((out/'eager/receipt.json').read_text())
for p in d['packages']:p['path']=str((frozen/p['path']).relative_to(r))
(out/'eager/receipt.json').write_text(json.dumps(d,indent=2)+'\n')
(out/'source.json').write_text(json.dumps({'source':sources,'runtimePackages':'exact frozen Phase5 archives','baseline':'exact frozen Phase4 eager Vite assets','change':'first hydration ready awaits two animation frames, abort-aware; repeated opening remains immediate'},indent=2)+'\n')
print(stage)
