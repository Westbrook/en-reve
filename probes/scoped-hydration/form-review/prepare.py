"""Build a new manual fixture using immutable Phase5 package archives."""
import pathlib, json, tempfile, tarfile, shutil, hashlib, subprocess, os
root = pathlib.Path(__file__).resolve().parents[3]
source = root / 'probes/scoped-hydration/form-review'
out = root / 'artifacts/scoped-registry-phase-5-form-review'
out.mkdir(parents=True, exist_ok=True)
stage = pathlib.Path(tempfile.mkdtemp(prefix='phase5-form-review-'))
(stage / 'node_modules/@en-reve').mkdir(parents=True)
for item in (root / 'node_modules').iterdir():
    if item.name != '@en-reve':
        (stage / 'node_modules' / item.name).symlink_to(item, target_is_directory=item.is_dir())
packages = []
for archive in sorted((root / 'showcases/performance/baselines/scoped-registry-phase-5-v1/phase5/packed').glob('*.tgz')):
    with tarfile.open(archive) as tar:
        name = json.load(tar.extractfile('package/package.json'))['name']
        dest = stage / 'node_modules' / name
        dest.mkdir()
        for entry in tar.getmembers():
            entry.name = entry.name.removeprefix('package/')
            if entry.name and entry.name != 'package':
                tar.extract(entry, dest, filter='data')
    packages.append({'path':str(archive.relative_to(root)), 'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()})
assert len(packages) == 5
app = stage / 'review'
shutil.copytree(source, app)
env = dict(os.environ, REVIEW_OUT=str(out / 'site'), REVIEW_ESBUILD=str(root / 'showcases/performance/node_modules/esbuild/lib/main.js'))
subprocess.run(['node', 'build.mjs'], cwd=app, env=env, check=True)
sources = [{'path':str(p.relative_to(root)), 'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(source.glob('*')) if p.is_file()]
(out / 'build.json').write_text(json.dumps({'parentCommit':'4a6da1fba47ba47c32612e83e4cd9db0584ba774', 'stage':str(stage), 'packages':packages, 'sources':sources}, indent=2)+'\n')
print(out / 'site')
