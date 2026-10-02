#!/usr/bin/env python3
"""Publish a qualified static build on a separate, fast-forward-only gh-pages history."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import uuid


def git(repo, *args, data=None, env=None):
    return subprocess.check_output(['git', '-C', str(repo), *args], input=data, env=env)


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def publish(args):
    source = args.source.resolve()
    repository = args.repository.resolve()
    build = args.build.resolve()
    source_commit = git(source, 'rev-parse', 'HEAD').decode().strip()
    if git(source, 'status', '--porcelain'):
        raise ValueError('Commit source changes before publishing a build.')
    receipt = json.loads(args.receipt.read_text())
    if receipt['status'] != 'passed' or receipt['productionBuild']['SSRBuild'] != 'passed':
        raise ValueError('The build receipt must record passing qualification.')
    for group in ['inputs', 'generatedModules']:
        if not receipt[group]:
            raise ValueError(f'Missing qualified {group}.')
        for name, expected in receipt[group].items():
            path = (source / name).resolve()
            if not path.is_relative_to(source) or sha256(path) != expected:
                raise ValueError(f'Qualified source changed: {name}')
    files = {}
    for path in sorted(build.rglob('*')):
        if path.is_symlink():
            raise ValueError(f'Build symlinks are not published: {path}')
        if path.is_file():
            if path.stat().st_size >= 100 * 1024 * 1024:
                raise ValueError(f'Build file exceeds GitHub blob limit: {path}')
            files[path.relative_to(build).as_posix()] = sha256(path)
    if 'index.html' not in files or '.en-reve-build.json' in files:
        raise ValueError('Build needs index.html and must not own .en-reve-build.json.')
    digest = hashlib.sha256(json.dumps(files, sort_keys=True).encode()).hexdigest()
    qualified = receipt['productionBuild']
    if len(files) != qualified['distFiles'] or digest != qualified['distManifestSHA256']:
        raise ValueError('Static files differ from the qualified build receipt.')

    def heads():
        return dict((line.split()[1], line.split()[0]) for line in
                    git(repository, 'ls-remote', args.remote, 'refs/heads/main', 'refs/heads/gh-pages').decode().splitlines())

    initial = heads()
    main = initial['refs/heads/main']
    parent = initial.get('refs/heads/gh-pages')
    # Fetch into temporary refs, never a developer's branch or index. Only the
    # source-only export is fetched; no full local evidence history is pushed.
    ref = 'refs/en-build-publish/' + uuid.uuid4().hex
    try:
        git(repository, 'fetch', '--no-tags', args.remote, f'refs/heads/main:{ref}/main')
        if git(repository, 'rev-parse', ref + '/main').decode().strip() != main:
            raise ValueError('Remote main changed during preparation; retry after syncing source.')
        export = json.loads(git(repository, 'show', main + ':.source-export/manifest.json'))
        if export['sourceCommit'] != source_commit:
            raise ValueError('Push this source commit through the source-only export first.')
        if parent:
            git(repository, 'fetch', '--no-tags', args.remote, f'refs/heads/gh-pages:{ref}/build')
            if git(repository, 'rev-parse', ref + '/build').decode().strip() != parent:
                raise ValueError('Remote gh-pages changed during preparation; retry.')
        info = {'schemaVersion': 1, 'sourceCommit': source_commit, 'githubSourceCommit': main,
                'buildFiles': len(files), 'buildManifestSHA256': digest,
                'qualificationReceiptSHA256': sha256(args.receipt)}
        with tempfile.TemporaryDirectory(prefix='en-github-build-') as directory:
            env = dict(os.environ, GIT_INDEX_FILE=str(Path(directory) / 'index'))
            git(repository, 'read-tree', '--empty', env=env)
            entries = []

            def add(name, content):
                blob = git(repository, 'hash-object', '-w', '--stdin', data=content).decode().strip()
                entries.append(f'100644 {blob}\t{name}\0'.encode())

            for name in files:
                content = (build / name).read_bytes()
                if hashlib.sha256(content).hexdigest() != files[name]:
                    raise ValueError(f'Build changed during snapshot: {name}')
                add(name, content)
            if '.nojekyll' not in files:
                add('.nojekyll', b'')
            add('.en-reve-build.json', (json.dumps(info, indent=2) + '\n').encode())
            git(repository, 'update-index', '-z', '--index-info', data=b''.join(entries), env=env)
            tree = git(repository, 'write-tree', env=env).decode().strip()
        unchanged = bool(parent and git(repository, 'rev-parse', parent + '^{tree}').decode().strip() == tree)
        if unchanged:
            commit = parent
        else:
            ancestry = ['-p', parent] if parent else []
            commit = git(repository, 'commit-tree', tree, *ancestry,
                         data=f'Publish verified site build from {main[:12]}\n'.encode()).decode().strip()
            if heads() != initial:
                raise ValueError('Remote source or build advanced; no push performed. Retry after syncing.')
            # No force: concurrent build publishers cannot overwrite each other.
            git(repository, 'push', args.remote, commit + ':refs/heads/gh-pages')
        if heads().get('refs/heads/gh-pages') != commit:
            raise ValueError('Remote build moved before final verification.')
        return {**info, 'branch': 'gh-pages', 'commit': commit, 'unchanged': unchanged}
    finally:
        git(repository, 'update-ref', '-d', ref + '/main')
        git(repository, 'update-ref', '-d', ref + '/build')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=Path.cwd(), help='Clean local main source checkout')
    parser.add_argument('--repository', type=Path, required=True, help='Existing source-only Git export repository')
    parser.add_argument('--remote', default='origin')
    parser.add_argument('--build', type=Path, required=True, help='Qualified static output directory')
    parser.add_argument('--receipt', type=Path, required=True, help='Passed receipt with inputs/generatedModules and productionBuild manifest')
    print(json.dumps(publish(parser.parse_args()), indent=2))
