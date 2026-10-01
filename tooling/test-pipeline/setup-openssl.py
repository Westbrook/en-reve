"""Provision the pinned certificate-generation CLI without changing host libraries."""
import hashlib
import json
import os
import pathlib
import subprocess
import tarfile
import urllib.request

root = pathlib.Path(__file__).resolve().parents[2]
version = '4.0.2'
toolchains = root / '.toolchains'
prefix = toolchains / ('openssl-' + version)
archive = toolchains / ('openssl-' + version + '.tar.gz')
source = toolchains / ('openssl-source-' + version)
url = 'https://github.com/openssl/openssl/releases/download/openssl-' + version + '/' + archive.name
toolchains.mkdir(exist_ok=True)
if not (prefix / 'bin/openssl').exists():
    with urllib.request.urlopen(url + '.sha256', timeout=60) as response:
        checksum = response.read()
    expected = checksum.decode().split()[0]
    if len(expected) != 64 or any(char not in '0123456789abcdef' for char in expected.lower()):
        raise SystemExit('Unexpected official OpenSSL checksum format')
    if not archive.exists():
        with urllib.request.urlopen(url, timeout=180) as response:
            archive.write_bytes(response.read())
    if hashlib.sha256(archive.read_bytes()).hexdigest() != expected:
        raise SystemExit('OpenSSL archive checksum mismatch')
    (toolchains / (archive.name + '.sha256')).write_bytes(checksum)
    if source.exists():
        raise SystemExit('A prior OpenSSL source build exists; inspect it before resuming')
    source.mkdir()
    with tarfile.open(archive) as tar:
        tar.extractall(source, filter='data')
    work = source / ('openssl-' + version)
    commands = [
        ['perl', 'Configure', 'no-shared', 'no-tests', '--prefix=' + str(prefix),
         '--openssldir=' + str(prefix / 'ssl')],
        ['make', '-j4', 'build_sw'],
        ['make', 'install_sw'],
        ['make', 'install_ssldirs'],
    ]
    for command in commands:
        subprocess.run(command, cwd=work, check=True)
    (prefix / 'provision.json').write_text(json.dumps({
        'version': version, 'sourceURL': url, 'checksumURL': url + '.sha256',
        'sourceSha256': expected, 'commands': commands,
        'scope': 'Private static-linked certificate-generation CLI; host OpenSSL and Python linkage unchanged.',
    }, indent=2) + '\n')
if not (prefix / 'ssl/openssl.cnf').exists():
    # install_sw alone omits the configuration needed by `openssl req`.
    command = ['make', 'install_ssldirs']
    subprocess.run(command, cwd=source / ('openssl-' + version), check=True)
    (prefix / 'configuration-provision.json').write_text(json.dumps({'command': command}, indent=2) + '\n')
binpath = toolchains / 'bin'
binpath.mkdir(exist_ok=True)
link = binpath / 'openssl'
if link.is_symlink():
    link.unlink()
elif link.exists():
    raise SystemExit('Refusing to overwrite ' + str(link))
link.symlink_to(os.path.relpath(prefix / 'bin/openssl', binpath))
subprocess.run([str(link), 'version', '-a'], check=True)
