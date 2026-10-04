import importlib.util
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import unittest
import json
import tempfile
spec = importlib.util.spec_from_file_location('publisher', Path(__file__).with_name('publish-github-build.py'))
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)
class Qualification(unittest.TestCase):
    def performance_fixture(self, root):
        source, build = root / 'source', root / 'build'
        files = {
            'plans/native-showcase-performance-results.md': '# Dated results\n',
            'plans/evidence.json': '{"measured":"2026-10-01"}\n',
            'showcases/performance-results/scripts/render.mjs': '// renderer\n',
        }
        for name, value in files.items():
            path = source / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(value)
        reader = build / 'performance'
        (reader / 'documents/plans').mkdir(parents=True)
        (reader / 'index.html').write_text('<html><head></head><body>Results</body></html>')
        (reader / 'results.md').write_text(files['plans/native-showcase-performance-results.md'])
        (reader / 'documents/plans/evidence.json').write_text(files['plans/evidence.json'])
        provenance = {'source': 'plans/native-showcase-performance-results.md',
                      'sourceHash': publisher.sha256(reader / 'results.md'),
                      'basePath': '/en-reve/performance/', 'resourceCount': 1,
                      'viewerInputs': {'showcases/performance-results/scripts/render.mjs': publisher.sha256(source / 'showcases/performance-results/scripts/render.mjs')},
                      'resources': [{'source': 'plans/evidence.json', 'path': 'documents/plans/evidence.json', 'sha256': publisher.sha256(source / 'plans/evidence.json')}]}
        (reader / 'source.json').write_text(json.dumps(provenance))
        return source, build

    def test_performance_publication_binds_source_and_linked_documents(self):
        with tempfile.TemporaryDirectory() as directory:
            source, build = self.performance_fixture(Path(directory))
            result = publisher.verify_performance_results(source, build)
            self.assertEqual(result['resourceCount'], 1)
            self.assertEqual(result['sourceHash'], publisher.sha256(build / 'performance/results.md'))

    def test_missing_stale_or_modified_performance_files_are_rejected(self):
        for changed in ['source-report', 'built-report', 'source-evidence', 'built-evidence', 'viewer-input', 'missing-reader', 'wrong-base']:
            with self.subTest(changed=changed), tempfile.TemporaryDirectory() as directory:
                source, build = self.performance_fixture(Path(directory))
                paths = {'source-report': source / 'plans/native-showcase-performance-results.md',
                         'built-report': build / 'performance/results.md',
                         'source-evidence': source / 'plans/evidence.json',
                         'built-evidence': build / 'performance/documents/plans/evidence.json',
                         'viewer-input': source / 'showcases/performance-results/scripts/render.mjs'}
                if changed in paths:
                    paths[changed].write_text('Changed after qualification')
                elif changed == 'missing-reader':
                    (build / 'performance/index.html').unlink()
                else:
                    path = build / 'performance/source.json'
                    value = json.loads(path.read_text())
                    value['basePath'] = '/'
                    path.write_text(json.dumps(value))
                with self.assertRaises(ValueError): publisher.verify_performance_results(source, build)

    def test_publication_does_not_change_qualified_html(self):
        page = b'<html><head><base href="https://westbrook.github.io/en-reve/"><title>Test</title></head><body>Text</body></html>'
        self.assertEqual(publisher.github_html(page), page)
    def test_unqualified_missing_or_conflicting_base_is_rejected(self):
        for page in [b'<head></head>', b'<head><base href="/"></head>', b'<head><base href="https://westbrook.github.io/en-reve/"><base href="https://westbrook.github.io/en-reve/"></head>', b'<body>no head</body>']:
            with self.assertRaises(ValueError): publisher.github_html(page)
if __name__ == '__main__': unittest.main()
