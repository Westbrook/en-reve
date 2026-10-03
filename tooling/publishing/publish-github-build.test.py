import importlib.util
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location('publisher', Path(__file__).with_name('publish-github-build.py'))
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)
class Qualification(unittest.TestCase):
    def test_publication_does_not_change_qualified_html(self):
        page = b'<html><head><base href="https://westbrook.github.io/en-reve/"><title>Test</title></head><body>Text</body></html>'
        self.assertEqual(publisher.github_html(page), page)
    def test_unqualified_missing_or_conflicting_base_is_rejected(self):
        for page in [b'<head></head>', b'<head><base href="/"></head>', b'<head><base href="https://westbrook.github.io/en-reve/"><base href="https://westbrook.github.io/en-reve/"></head>', b'<body>no head</body>']:
            with self.assertRaises(ValueError): publisher.github_html(page)
if __name__ == '__main__': unittest.main()
