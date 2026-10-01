"""Build isolated parent/candidate packages and production date routes."""
from pathlib import Path
import subprocess, tempfile, shutil, json, hashlib, os, sys, argparse
parser=argparse.ArgumentParser();parser.add_argument('kind',choices=['parent','candidate'],nargs='?',default='parent');parser.add_argument('--output',default=os.environ.get('PHASE6_BASE','artifacts/scoped-registry-phase-6'));parser.add_argument('--calendar-labels',choices=['current','column-weekday'],default='current');args=parser.parse_args()
if args.calendar_labels!='current' and (args.kind!='candidate' or args.output=='artifacts/scoped-registry-phase-6'):parser.error('Calendar label experiments require a candidate with a separate --output directory.')
r=Path.cwd();assert not (r/args.output/args.kind).exists(),'Use a new output directory; never overwrite a build'
out=(r/args.output).resolve();out.mkdir(parents=True,exist_ok=True);parent='2dc77b5773839f7afdd52ce0b4fc68a6af35d0f4';kind=args.kind;stage=Path(tempfile.mkdtemp(prefix='phase6-'+kind+'-'))
paths=[p for p in ['package.json','package-lock.json','tsconfig.base.json','packages','tooling'] if subprocess.run(['git','cat-file','-e',parent+':'+p],stderr=subprocess.DEVNULL).returncode==0]
p=subprocess.Popen(['git','archive',parent,'--',*paths],stdout=subprocess.PIPE);subprocess.run(['tar','-xf','-','-C',str(stage)],stdin=p.stdout,check=True);assert p.wait()==0
if kind=='candidate':
 for name in json.loads((r/'probes/date-picker-performance/overlay.json').read_text()):
  dest=stage/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(r/name,dest)
# Both historical subjects execute the selected current toolchain. Adapt only the
# shared build integration; keep the archived subject sources and locks intact.
compatibility_overlay=[]
# npm may expose the metadata compiler alias as .bin/tsc. Keep both frozen
# subjects on the explicitly selected root build compiler, with exact preimages.
# Only these build-script tokens change; archive sources and lock stay intact.
historical_build_manifests = {}
historical_build_expected = {'tokens': {'sha256': 'ed3c0048e8f0e7c6f5253c6091dd93d54d89b9fe94527c9908b4b4ec7e12a880', 'build': 'tsc -p tsconfig.json && node scripts/generate.mjs'}, 'styles': {'sha256': 'e862f4085950837e45083bba260b4cdf56e44e052104279edd45a3087bd4db96', 'build': 'node scripts/author-css.mjs && tsc -p tsconfig.json && node scripts/export-css.mjs'}, 'primitives': {'sha256': '6c5e9a2326979022fd4be78e07dde49ee126781a667513bddab2d0f28176bf3b', 'build': 'tsc -b'}, 'elements': {'sha256': '90bdf39411df3e527e2ccbf26dabad33289a9da929237a3db11a390afe087507', 'build': 'node ../../tooling/metadata/lazy-manifest.ts && tsc -b'}, 'ssr': {'sha256': '1955af28e3deb72d79ae9725385ac163ce1c32a83dfe1617753f95c5d9906a3c', 'build': 'tsc -b'}}
for name, expected in historical_build_expected.items():
 path = stage/'packages'/name/'package.json'
 original = path.read_bytes()
 assert hashlib.sha256(original).hexdigest() == expected['sha256'], 'Historical build manifest changed: '+name
 manifest = json.loads(original)
 assert manifest['scripts']['build'] == expected['build'], 'Historical build script changed: '+name
 needle = 'tsc '
 assert expected['build'].count(needle) == 1
 executed = expected['build'].replace(needle, 'node ../../node_modules/typescript/bin/tsc ', 1)
 # Change only the JSON string for this exact build script, preserving all
 # other bytes in the archived manifest rather than reserializing the object.
 before = json.dumps(expected['build']).encode()
 after = json.dumps(executed).encode()
 assert original.count(before) == 1
 changed = original.replace(before, after, 1)
 path.write_bytes(changed)
 historical_build_manifests[name] = original
 compatibility_overlay.append({'path':str(path.relative_to(stage)), 'kind':'build-compiler-selection',
  'historicalSha256':hashlib.sha256(original).hexdigest(), 'executedSha256':hashlib.sha256(changed).hexdigest(),
  'historicalBuild':expected['build'], 'executedBuild':executed,
  'historicalManifestCopy':'historical-build-manifests/'+name+'.package.json'})
# Apply the same explicit metadata/type compatibility to both fresh subjects.
# -I excludes the script directory: resolve this helper from this exact script.
import importlib.util
helper_path = Path(__file__).resolve().with_name('metadata_compatibility.py')
helper_spec = importlib.util.spec_from_file_location('phase6_metadata_compatibility', helper_path)
metadata_helper = importlib.util.module_from_spec(helper_spec)
helper_spec.loader.exec_module(metadata_helper)
metadata_rows, historical_metadata_files, historical_cem = metadata_helper.apply_metadata_compatibility(stage, r, parent)
compatibility_overlay.extend(metadata_rows)
for name in ['tooling/minify/literals.mjs']:
 dest=stage/name
 compatibility_overlay.append({'path':name,'historicalSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
   'executedSha256':hashlib.sha256((r/name).read_bytes()).hexdigest()})
 shutil.copy2(r/name,dest)
if args.calendar_labels=='column-weekday':
 # Patch only the isolated source copy: no library edit before manual evidence.
 path=stage/'packages/elements/src/calendar/element.ts';source=path.read_text()
 changes=[('scope="col" abbr=${day.long}', 'scope="col" abbr=${day.long} aria-label=${day.long}'), ("adapter.format(day.date, { weekday: 'long', year:", "adapter.format(day.date, { year:")]
 for old,new in changes:
  assert source.count(old)==1, 'Calendar source changed; inspect the experimental patch.'
  source=source.replace(old,new)
 path.write_text(source)
(stage/'node_modules/@en-reve').mkdir(parents=True)
for p in (r/'node_modules').iterdir():
 if p.name!='@en-reve':(stage/'node_modules'/p.name).symlink_to(p,target_is_directory=p.is_dir())
for p in (stage/'packages').iterdir():
 if (p/'package.json').exists():(stage/'node_modules/@en-reve'/p.name).symlink_to(p,target_is_directory=True)
base=out/kind;assert not base.exists(),'Use a new output directory; never overwrite a build';base.mkdir();(base/'stage.txt').write_text(str(stage))
for name, original in historical_metadata_files.items():
 preserved = base/'historical-metadata-files'/name
 preserved.parent.mkdir(parents=True, exist_ok=True); preserved.write_bytes(original)
historical_manifests = base/'historical-build-manifests'; historical_manifests.mkdir()
for name, original in historical_build_manifests.items():
 (historical_manifests/(name+'.package.json')).write_bytes(original)
# The TS7 launcher delegates to a platform-native executable. Record both the
# selected files and actual --version result; dependency versions alone do not
# establish which compiler was executed.
compiler_entry = r/'node_modules/typescript/bin/tsc'
compiler_native = Path(subprocess.check_output(['node','--input-type=module','-e',
 "import getExePath from './node_modules/typescript/lib/getExePath.js'; console.log(getExePath());"],cwd=r,text=True).strip()).resolve()
compiler_manifest = r/'node_modules/typescript/package.json'
compiler_metadata = json.loads(compiler_manifest.read_text())
compiler_version = subprocess.check_output(['node',str(compiler_entry),'--version'],cwd=r,text=True).strip()
assert compiler_version == 'Version '+compiler_metadata['version']
assert compiler_metadata['version'].startswith('7.'), 'Expected selected TypeScript7 build compiler'
compiler_files = [compiler_manifest,compiler_entry,r/'node_modules/typescript/lib/tsc.js',
 r/'node_modules/typescript/lib/getExePath.js',compiler_native.parent.parent/'package.json',compiler_native]
build_compiler = {'entry':str(compiler_entry),'nativeExecutable':str(compiler_native),'versionOutput':compiler_version,
 'npmBinRealPath':str((r/'node_modules/.bin/tsc').resolve()),
 'files':[{'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()} for path in compiler_files]}
# This reproduction intentionally links the caller's installed toolchain into the
# frozen source stage. Record actual tools separately from its historical lock.
tool_packages=['typescript','vite','parse5','html-minifier-next','@playwright/test','@typescript/typescript6','@wc-toolkit/cem-generator','@wc-toolkit/cem-generator-lit','@wc-toolkit/cem-generator-utils','@lit-labs/ssr','lightningcss','postcss']
toolchain={'sourceParent':parent,'hostRoot':str(r),'stageManifestIsHistorical':False,
 'rootManifestIsHistorical':True,
 'buildCompiler':build_compiler,
 'compatibilityOverlay':compatibility_overlay,
 'historicalMetadata':historical_cem,
 'subjectOverlay':[{'path':name,'sha256':hashlib.sha256((stage/name).read_bytes()).hexdigest()} for name in json.loads((r/'probes/date-picker-performance/overlay.json').read_text())] if kind=='candidate' else [],
 'historicalLockSha256':hashlib.sha256((stage/'package-lock.json').read_bytes()).hexdigest(),
 'node':subprocess.check_output(['node','--version'],text=True).strip(),
 'npm':subprocess.check_output(['npm','--version'],text=True).strip(),
 'python':sys.version,'pythonExecutable':sys.executable,
 'hostLockSha256':hashlib.sha256((r/'package-lock.json').read_bytes()).hexdigest(),
 'packages':{name:json.loads((r/'node_modules'/name/'package.json').read_text())['version'] for name in tool_packages}}
(base/'toolchain.json').write_text(json.dumps(toolchain,indent=2)+'\n')

with (base/'build.log').open('w') as log:
 for name in ['tokens','styles','primitives','elements','ssr']:
  subprocess.run(['npm','run','build','-w','@en-reve/'+name],cwd=stage,stdout=log,stderr=subprocess.STDOUT,check=True)
with (base/'metadata.log').open('w') as log:
 subprocess.run(['npm','run','metadata'],cwd=stage,stdout=log,stderr=subprocess.STDOUT,check=True)
# Verify the retained stage metadata using the same fresh Program and receipts.
with (base/'metadata-check.log').open('w') as log:
 subprocess.run(['node','tooling/metadata/generate-elements.ts','--check'],cwd=stage,stdout=log,stderr=subprocess.STDOUT,check=True)
metadata_receipt=json.loads((stage/'packages/elements/custom-elements.json.receipt.json').read_text())
(base/'metadata-identity.json').write_text(json.dumps({key:metadata_receipt[key] for key in ['schemaVersion','kind','generator','compiler','packages','parserVersion','historicalMetadata']},indent=2)+'\n')
pack=base/'packed';pack.mkdir(exist_ok=True)
for name in ['tokens','styles','primitives','elements','ssr']:
 subprocess.run(['npm','pack','--pack-destination',str(pack),'--workspace','@en-reve/'+name],cwd=stage,stdout=subprocess.DEVNULL,env=dict(os.environ,npm_config_cache=str(stage/'.npm-cache')),check=True)
# Production consumer resolves extracted tarballs, not source/build aliases.
import tarfile
consumer=stage/'consumer';shutil.copytree(r/'probes/date-picker-performance/app',consumer);(consumer/'node_modules/@en-reve').mkdir(parents=True)
for p in (stage/'node_modules').iterdir():
 if p.name!='@en-reve':(consumer/'node_modules'/p.name).symlink_to(p,target_is_directory=p.is_dir())
for archive in pack.glob('*.tgz'):
 with tarfile.open(archive) as tar:
  name=json.load(tar.extractfile('package/package.json'))['name'];dest=consumer/'node_modules'/name;dest.mkdir()
  for entry in tar.getmembers():
   entry.name=entry.name.removeprefix('package/')
   if entry.name and entry.name!='package':tar.extract(entry,dest,filter='data')
for policy in (['eager'] if kind=='parent' else ['eager','dom','cold','intent','route']):
 shutil.copy2(consumer/('eager.mjs' if policy in ['eager','dom'] else 'lazy.mjs'),consumer/'selected.mjs')
 dest=base/policy/'site';dest.parent.mkdir(exist_ok=True)
 (consumer/'vite.config.mjs').write_text('export default '+json.dumps({'build':{'target':'es2022','outDir':str(dest),'emptyOutDir':True},'define':{'__POLICY__':json.dumps(policy)}})+';')
 with (dest.parent/'build.log').open('w') as log:subprocess.run(['node',str(r/'node_modules/vite/bin/vite.js'),'build'],cwd=consumer,stdout=log,stderr=subprocess.STDOUT,check=True)
 assets=[{'path':str(p.relative_to(dest)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(dest.rglob('*')) if p.is_file()]
 (dest.parent/'receipt.json').write_text(json.dumps({'kind':kind,'policy':policy,'calendarLabels':args.calendar_labels,'parentCommit':parent,'assets':assets,'packages':[{'path':str(p.relative_to(r)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(pack.glob('*.tgz'))]},indent=2)+'\n')
print(stage)
