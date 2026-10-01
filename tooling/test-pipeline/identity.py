"""Snapshot source, package build bytes and selected runtimes before a validation wave."""
import pathlib,os,json,hashlib,subprocess,sys,shutil,datetime,ssl
root=pathlib.Path.cwd(); destination=pathlib.Path(sys.argv[1])
if destination.exists(): raise SystemExit('Refusing to overwrite an identity')
skip={'.git','node_modules','.toolchains','artifacts','results','runs','reports','baselines','vendor','.cache','.vite','.vite-temp'}
source={};build={}
for top in ['packages','apps','probes','tooling','showcases','plans','.github','dist']:
 for base,dirs,names in os.walk(root/top):
  dirs[:]=[d for d in dirs if d not in skip]
  for name in names:
   if name=='.DS_Store':continue
   path=pathlib.Path(base)/name
   if path.is_symlink():continue
   key=str(path.relative_to(root));generatedReader=key.startswith('showcases/performance-results/public/') or key in ['showcases/performance-results/index.html','showcases/performance-results/src/comparison.json','showcases/performance-results/src/tables.json']
   target=build if 'dist' in path.parts or path.name.endswith('.tsbuildinfo') or generatedReader else source
   target[key]=hashlib.sha256(path.read_bytes()).hexdigest()
for name in ['package.json','package-lock.json','.nvmrc','.node-version','.python-version','README.md','.gitignore','tsconfig.base.json']:
 source[name]=hashlib.sha256((root/name).read_bytes()).hexdigest()
def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True).encode()).hexdigest()
versions={}
for executable in ['node','npm','python3','openssl']:
 result=subprocess.run([executable,'version' if executable=='openssl' else '--version'],capture_output=True,text=True)
 versions[executable]={'path':shutil.which(executable),'realpath':str(pathlib.Path(shutil.which(executable)).resolve()),'version':result.stdout.strip(),'exitCode':result.returncode}
runtimeLibraries={'node':json.loads(subprocess.check_output(['node','-p','JSON.stringify(process.versions)'],text=True)),'pythonOpenSSL':ssl.OPENSSL_VERSION}
data={'schemaVersion':2,'coverage':'Active project directories, plans, root manifests/runtime/configuration files; generated output classified separately. Historical baseline/vendor/report archives and artifact outputs excluded.','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'root':str(root),'source':source,'build':build,'sourceSha256':digest(source),'buildSha256':digest(build),'runtimes':versions,'runtimeLibraries':runtimeLibraries}
destination.parent.mkdir(parents=True,exist_ok=True);destination.write_text(json.dumps(data,indent=2)+'\n')
print(json.dumps({k:v for k,v in data.items() if k not in ['source','build']}))
