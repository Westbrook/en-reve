"""Rebuild the private CEM package archives from pinned upstream bytes and reviewed overlays."""
import argparse, base64, gzip, hashlib, io, json, tarfile
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parent
for package in ['cem-generator', 'cem-generator-utils', 'cem-generator-lit']:
    directory = root / package
    source = json.loads((directory / 'source.json').read_text())
    upstream = (directory / 'upstream.tgz').read_bytes()
    assert hashlib.sha256(upstream).hexdigest() == source['upstreamSha256'], 'Upstream archive changed'
    assert 'sha512-' + base64.b64encode(hashlib.sha512(upstream).digest()).decode() == source['upstreamIntegrity']
    files = {}
    with tarfile.open(fileobj=io.BytesIO(upstream), mode='r:gz') as archive:
        for entry in archive:
            if entry.isdir():
                continue
            assert entry.isfile() and entry.name.startswith('package/') and '..' not in entry.name.split('/')
            assert entry.name not in files
            files[entry.name] = archive.extractfile(entry).read()
    overlays = {}
    overlay_root = directory / 'overlay' / 'dist'
    assert len(source['overlays']) == len(set(source['overlays'])), 'Duplicate overlay entries'
    assert all(path.is_file() and not path.is_symlink() for path in overlay_root.iterdir()), 'Unsupported overlay entry'
    assert set(source['overlays']) == {path.name for path in overlay_root.iterdir()}, 'Overlay manifest omits or invents files'
    for name in source['overlays']:
        assert '/' not in name and name not in {'.', '..'}
        data = (directory / 'overlay' / 'dist' / name).read_bytes()
        files['package/dist/' + name] = data
        overlays['dist/' + name] = hashlib.sha256(data).hexdigest()
    metadata = json.loads(files['package/package.json'])
    assert metadata['name'] == source['name'] and metadata['version'] == source['upstreamVersion']
    metadata.update(version=source['localVersion'], private=True, enCemPatch={
        'upstreamVersion': source['upstreamVersion'], 'upstreamIntegrity': source['upstreamIntegrity'],
        'overlaySha256': overlays,
    })
    files['package/package.json'] = (json.dumps(metadata, indent=2) + '\n').encode()
    output = io.BytesIO()
    with gzip.GzipFile(fileobj=output, mode='wb', filename='', mtime=0, compresslevel=9) as compressed:
        with tarfile.open(fileobj=compressed, mode='w', format=tarfile.USTAR_FORMAT) as archive:
            for name, data in sorted(files.items()):
                entry = tarfile.TarInfo(name)
                entry.size = len(data)
                entry.mode = 0o644
                archive.addfile(entry, io.BytesIO(data))
    destination = directory / (package + '-' + source['localVersion'] + '.tgz')
    data = output.getvalue()
    if args.check:
        assert destination.read_bytes() == data, 'Local archive is stale: ' + str(destination)
    else:
        destination.write_bytes(data)
    print(json.dumps({'package': source['name'], 'version': source['localVersion'], 'files': len(files),
                      'sha256': hashlib.sha256(data).hexdigest(),
                      'integrity': 'sha512-' + base64.b64encode(hashlib.sha512(data).digest()).decode(),
                      'checked': args.check}))
