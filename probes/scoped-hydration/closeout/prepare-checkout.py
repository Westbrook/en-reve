"""Export only committed parent plus exact Phase5 library sources for clean build/test."""
import pathlib,tempfile,subprocess,shutil,json
r=pathlib.Path.cwd();out=r/'artifacts/scoped-registry-phase-5-closeout';stage=pathlib.Path(tempfile.mkdtemp(prefix='phase5-commit-check-'))
paths=subprocess.check_output(['git','ls-tree','--name-only','HEAD'],cwd=r).decode().splitlines();paths=[p for p in paths if p not in ['artifacts','showcases','plans']]
archive=subprocess.Popen(['git','archive','HEAD','--',*paths],cwd=r,stdout=subprocess.PIPE);subprocess.run(['tar','-xf','-','-C',str(stage)],stdin=archive.stdout,check=True);assert archive.wait()==0
for p in ['package-lock.json','packages/ssr/README.md','packages/ssr/package.json','packages/ssr/tsconfig.json','packages/ssr/src/client.ts','packages/ssr/src/scoped.ts','packages/ssr/src/scoped-worker.ts','packages/ssr/src/hydration-manifest.ts','packages/ssr/src/island-markup.ts','packages/ssr/tests/scoped.test.mjs']:
 dest=stage/p;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(r/p,dest)
shutil.copytree(r/'packages/ssr/tests/scoped-fixtures',stage/'packages/ssr/tests/scoped-fixtures')
(stage/'node_modules/@en-reve').mkdir(parents=True)
for p in (r/'node_modules').iterdir():
 if p.name!='@en-reve':(stage/'node_modules'/p.name).symlink_to(p,target_is_directory=p.is_dir())
for p in (r/'node_modules/@en-reve').iterdir():
 target=stage/'packages'/p.name
 if target.exists():(stage/'node_modules/@en-reve'/p.name).symlink_to(target,target_is_directory=True)
(out/'checkout.txt').write_text(str(stage));print(stage)
with (out/'clean-build-tests.log').open('w') as log:
 for name in ['tokens','styles','primitives','elements','ssr']:
  subprocess.run(['npm','run','build','-w','@en-reve/'+name],cwd=stage,stdout=log,stderr=subprocess.STDOUT,check=True)
 subprocess.run(['npm','test','-w','@en-reve/ssr'],cwd=stage,stdout=log,stderr=subprocess.STDOUT,check=True)
print('Clean source export builds and SSR tests passed')
