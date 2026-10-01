"""Provision pinned Node/npm under .toolchains; never touch system/app runtimes.

Run with Python 3.14. Python itself can be installed with uv into .toolchains/python,
or built from the official source as documented in README.md.
"""
import base64, hashlib, json, os, pathlib, platform, subprocess, tarfile
from urllib.request import urlopen
root = pathlib.Path(__file__).resolve().parents[2]
target = root / '.toolchains'
target.mkdir(exist_ok=True)
versions = [(root / '.node-version').read_text().strip(), '24.21.0']
arch = {'arm64':'arm64','aarch64':'arm64','x86_64':'x64'}.get(platform.machine())
osname = {'Darwin':'darwin','Linux':'linux'}.get(platform.system())
if not arch or not osname:
    raise SystemExit('This bootstrap supports macOS/Linux arm64/x64; use your version manager for other hosts.')
def download(url, destination):
    with urlopen(url, timeout=120) as response:
        destination.write_bytes(response.read())
    return destination.read_bytes()
for version in versions:
    name = f'node-v{version}-{osname}-{arch}'
    if (target / name / 'bin/node').exists():
        continue
    archive = name + '.tar.gz'
    url = f'https://nodejs.org/dist/v{version}/'
    sums = download(url+'SHASUMS256.txt',target/f'{name}-SHASUMS256.txt').decode()
    expected = next(line.split()[0] for line in sums.splitlines() if line.endswith('  '+archive))
    data = download(url+archive,target/archive)
    if hashlib.sha256(data).hexdigest() != expected:
        raise SystemExit('Node archive checksum mismatch')
    with tarfile.open(target/archive) as tar:
        tar.extractall(target,filter='data')
npm_version = json.loads((root/'package.json').read_text())['packageManager'].split('@')[1]
npmdir = target / f'npm-{npm_version}'
if not (npmdir/'package/bin/npm-cli.js').exists():
    with urlopen(f'https://registry.npmjs.org/npm/{npm_version}',timeout=30) as response:
        meta=json.load(response)
    data=download(meta['dist']['tarball'],target/f'npm-{npm_version}.tgz')
    algorithm,digest=meta['dist']['integrity'].split('-',1)
    if base64.b64encode(hashlib.new(algorithm,data).digest()).decode()!=digest:
        raise SystemExit('npm archive integrity mismatch')
    with tarfile.open(target/f'npm-{npm_version}.tgz') as tar:
        tar.extractall(npmdir,filter='data')
binpath=target/'bin';binpath.mkdir(exist_ok=True)
for name,source in {'node':target/f'node-v{versions[0]}-{osname}-{arch}/bin/node','npm':npmdir/'package/bin/npm-cli.js','npx':npmdir/'package/bin/npx-cli.js'}.items():
    path=binpath/name
    if path.is_symlink():path.unlink()
    elif path.exists():raise SystemExit(f'Refusing to overwrite {path}')
    path.symlink_to(os.path.relpath(source,binpath))
ltsbin=target/'lts-bin';ltsbin.mkdir(exist_ok=True)
ltspath=ltsbin/'node'
if ltspath.is_symlink():ltspath.unlink()
elif ltspath.exists():raise SystemExit(f'Refusing to overwrite {ltspath}')
ltspath.symlink_to(os.path.relpath(target/f'node-v{versions[1]}-{osname}-{arch}/bin/node',ltsbin))
print('Run tooling/test-pipeline/with-toolchain.sh node --version and npm --version.')
