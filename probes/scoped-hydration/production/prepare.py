"""Export the sealed parent, overlay only Phase 5 SSR sources, pack, then Vite build."""
import pathlib,subprocess,tempfile,shutil,json,hashlib,tarfile
r=pathlib.Path(__file__).resolve().parents[3]
out=r/'artifacts/scoped-registry-phase-5/production';out.mkdir(parents=True,exist_ok=True)
parent='5cab32d9311cb1a730fa9741e3334d03f7fc442a'
stage=pathlib.Path(tempfile.mkdtemp(prefix='phase5-production-'))
(out/'stage.txt').write_text(str(stage))
overlay=['packages/ssr/README.md','packages/ssr/package.json','packages/ssr/tsconfig.json','package-lock.json']+[str(p.relative_to(r)) for p in (r/'packages/ssr/src').glob('*.ts') if p.name in ['client.ts','scoped.ts','scoped-worker.ts','island-markup.ts','hydration-manifest.ts']]
sources=[{'path':p,'sha256':hashlib.sha256((r/p).read_bytes()).hexdigest()} for p in overlay]
(out/'source.json').write_text(json.dumps({'parentCommit':parent,'overlay':sources},indent=2)+'\n')
for phase in ['phase4','phase5']:
 root=stage/phase;root.mkdir()
 paths=subprocess.check_output(['git','ls-tree','--name-only',parent],cwd=r).decode().splitlines();paths=[p for p in paths if p not in ['artifacts','showcases','plans']]
 archive=subprocess.Popen(['git','archive',parent,'--',*paths],cwd=r,stdout=subprocess.PIPE)
 subprocess.run(['tar','-xf','-','-C',str(root)],stdin=archive.stdout,check=True);assert archive.wait()==0
 if phase=='phase5':
  for p in overlay:(root/p).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(r/p,root/p)
 (root/'node_modules/@en-reve').mkdir(parents=True)
 for x in (r/'node_modules').iterdir():
  if x.name=='@en-reve':continue
  (root/'node_modules'/x.name).symlink_to(x,target_is_directory=x.is_dir())
 names=['tokens','styles','primitives','elements','ssr']
 for name in names:(root/'node_modules/@en-reve'/name).symlink_to(root/'packages'/name,target_is_directory=True)
 dest=out/phase;dest.mkdir(exist_ok=True)
 with (dest/'build.log').open('w') as log:
  def run(args,cwd=root):
   log.write(repr(args)+'\n');log.flush();return subprocess.run(args,cwd=cwd,stdout=log,stderr=subprocess.STDOUT,check=True)
  for name in names:run(['npm','run','build','-w','@en-reve/'+name])
  packed=dest/'packed';packed.mkdir(exist_ok=True)
  for name in names:
   run(['npm','pack','--cache','/private/tmp/phase5-npm-cache','--ignore-scripts','--pack-destination',str(packed)],root/'packages'/name)
   link=root/'node_modules/@en-reve'/name;link.unlink();link.mkdir()
   with tarfile.open(packed/('en-reve-'+name+'-0.1.0.tgz')) as tar:
    for member in tar.getmembers():
     member.name=member.name.removeprefix('package/')
     if member.name and member.name!='package':tar.extract(member,link,filter='data')
  app=root/'study';shutil.copytree(r/'probes/scoped-hydration/production',app)
  run(['node','render.mjs'],app)
  for policy in (['eager'] if phase=='phase4' else ['prepared','cold']):
   shutil.copy2(app/(phase+'.mjs'),app/'selected.mjs')
   target=out/policy/'site';target.parent.mkdir(exist_ok=True)
   (app/'vite.config.mjs').write_text("export default {build:{target:'es2022',outDir:"+json.dumps(str(target))+",emptyOutDir:true},define:{__POLICY__:"+json.dumps(json.dumps(policy))+"}};")
   run(['node',str(r/'node_modules/vite/bin/vite.js'),'build'],app)
   assets=[{'path':str(p.relative_to(target)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(target.rglob('*')) if p.is_file()]
   packages=[{'path':str(p.relative_to(out)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(packed.glob('*.tgz'))]
   (target.parent/'receipt.json').write_text(json.dumps({'phase':phase,'policy':policy,'parentCommit':parent,'overlay':sources if phase=='phase5' else [],'assets':assets,'packages':packages},indent=2)+'\n')
 print(phase,'packed and built',flush=True)
